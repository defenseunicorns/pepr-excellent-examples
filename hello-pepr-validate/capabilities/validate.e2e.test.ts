import {
  beforeAll,
  afterEach,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import {
  mins,
  secs,
  untilTrue,
  resourceLive,
} from "helpers/src/general";
import { peprVersion, moduleUp, untilLogged } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';

const halfCreate = async (resources) => {
  resources = [ resources ].flat()

  return Promise.all(resources.map((r) => {
    const kynd = kind[r.kind]
    const applied = K8s(kynd).Apply(r)

    return applied
  }))
}

const fullCreate = async (resources) => {
  resources = [ resources ].flat()

  return Promise.all(resources.map(async (r) => {
    const kynd = kind[r.kind]
    const applied = await K8s(kynd).Apply(r)

    return untilTrue(() => resourceLive(kynd, applied))
  }))
}

const trc = new TestRunCfg(__filename)

describe("validate.ts", () => {
  beforeAll(async () => await moduleUp(await peprVersion()), mins(2))

  afterEach(async () => await clean(trc), mins(5))

  it("prevents bad examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.fail.yaml`)

    let rejects = (await Promise.all(
      resources.map(r => halfCreate(r).then(() => '').catch(e => e.data.message))
    )).filter(f => f)

    // Pepr-namespaced requests are rejected directly
    expect(rejects).toHaveLength(2)
    expect(rejects).toEqual(
      expect.arrayContaining([
        expect.stringMatching("denied the request: fail-oof"),
        expect.stringMatching("denied the request: fail-missing"),
      ])
    )

    // non-Pepr-namespaced requests aren't rejected, just log-&-drop'ed (ugh)
    await untilLogged('Namespace does not match')
    await expect(K8s(kind.ConfigMap).Get("fail-namespace"))
      .rejects.toMatchObject({ status: 404 })
  }, secs(10))
  
  it("allows good examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.pass.yaml`)
    await Promise.all(resources.map(r => fullCreate(r)))

    // fullCreate will wait until resources are Get-able from cluster, hence
    //  no need for expect()s -- test succeeds if it doesn't error/timeout
  }, secs(10))
})
