import {
  beforeAll,
  // beforeEach,
  afterEach,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { Cmd } from "helpers/src/Cmd";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import {
  mins,
  secs,
  lock,
  unlock,
  sleep,
  untilTrue,
  resourceLive,
  resourceGone,
} from "helpers/src/general";
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';

const halfApply = async (resources) => {
  resources = [ resources ].flat()
  return Promise.all(
    resources.map((r) => K8s(kind[r.kind]).Apply(r))
  )
}

const fullApply = async (resources) => {
  resources = [ resources ].flat()

  return Promise.all(resources.map(async (r) => {
    const kynd = kind[r.kind]
    const applied = await K8s(kynd).Apply(r)

    return untilTrue(() => resourceLive(kynd, applied))
  }))
}

const sift = (stdout) => {
  const parsed = stdout
    .filter(l => l !== '')
    .map(l => JSON.parse(l))
    .filter(l => l.url !== "/healthz")
    .filter(l => l.msg !== "Pepr Store update")
  
  parsed.sort((l, r) => l.time > r.time ? 1 : -1)
    
  return parsed.map(l => JSON.stringify(l))
}

const logs = async () => {
  const raw = await new Cmd({
    cmd: `kubectl -n pepr-system logs -l 'pepr.dev/controller=admission'`
  }).run()
  return sift(raw.stdout)
}
  
const untilLogged = async (needle, count = 1) => {
  const logz = await logs()
  const found = logz.filter(l => l.includes(needle))
  while (true) {
    if (found.length >= count) { break }
    await sleep(.25)
  }
}


const trc = new TestRunCfg(__filename);

beforeAll(async () => { await lock(trc) }, mins(10))
afterAll(async () => { await unlock(trc) });

describe("validate.ts", () => {
  beforeAll(async () => {
    // have pepr cmds use default tsconfig.json (NOT the cli's tsconfig.json)
    const pepr = { TS_NODE_PROJECT: "" }
    await new Cmd({ env: pepr, cmd: `npx pepr build` }).run()
    await new Cmd({ env: pepr, cmd: `npx pepr deploy --confirm` }).run()

    await untilLogged('✅ Controller startup complete', 2)
  }, mins(5))

  afterEach(async () => await clean(trc), mins(5))

  it("prevents bad examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.fail.yaml`)

    let rejects = await Promise.all(
      resources.map(r => halfApply(r).then(() => '').catch(e => e.data.message))
    )
    rejects = rejects.filter(f => f)

    // Pepr-namespaced requests are rejected directly
    expect(rejects).toHaveLength(2)
    expect(rejects).toEqual(
      expect.arrayContaining([
        expect.stringMatching("denied the request: fail-false"),
        expect.stringMatching("denied the request: fail-missing"),
      ])
    )

    // non-Pepr-namespaced requests aren't rejected, just log-&-drop'ed (ugh)
    await untilLogged('Namespace does not match')
    await expect(K8s(kind.ConfigMap).Get("fail-namespace"))
      .rejects.toMatchObject({ status: 404 })
  }, secs(45))
  
  it.skip("allows good examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.pass.yaml`)
    await Promise.all(resources.map(r => fullApply(r)))
  })
})
