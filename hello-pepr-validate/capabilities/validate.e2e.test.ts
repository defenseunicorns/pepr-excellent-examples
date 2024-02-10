import {
  beforeAll,
  afterEach,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { halfCreate, fullCreate } from "helpers/src/general";
import { secs, mins } from 'helpers/src/time';
import { moduleUp, untilLogged } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';

const trc = new TestRunCfg(__filename)

describe("validate.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  afterEach(async () => await clean(trc), mins(5))

  it("prevents bad examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.fail.yaml`)

    let rejects = (await Promise.all(resources.map(r => {
      return halfCreate(r).then(() => '').catch(e => e.data.message)}
    ))).filter(f => f)

    // Pepr-namespaced requests are rejected directly
    expect(rejects).toHaveLength(2)
    expect(rejects).toEqual(
      expect.arrayContaining([
        expect.stringMatching("denied the request: fail-oof"),
        expect.stringMatching("denied the request: fail-missing"),
      ])
    )

    // non-Pepr-namespaced requests AREN'T rejected (just log-&-drop'ed, ugh)
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
