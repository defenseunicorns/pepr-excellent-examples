import {
  beforeAll,
  beforeEach,
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
  // untilTrue,
  // resourceLive,
} from "helpers/src/general";
import { clean } from 'helpers/src/cluster';
// import { K8s, kind } from 'kubernetes-fluent-client';

// const apply = async (resources) => {
//   // kind["ClusterPolicyReport"] = ClusterPolicyReport

//   // normalize single / lists of resources as iterable list
//   resources = [ resources ].flat()

//   return Promise.all(resources.map(async (r) => {
//     const kynd = kind[r.kind]
//     const applied = await K8s(kynd).Apply(r)

//     return untilTrue(() => resourceLive(kynd, applied))
//   }))
// }

const trc = new TestRunCfg(__filename);

beforeAll(async () => { await lock(trc) }, mins(10))
afterAll(async () => { await unlock(trc) });

describe("validate.ts", () => {
  beforeAll(async () => {
    // unset so pepr uses default tsconfig.json (rather than cli's tsconfig)
    const pepr = { TS_NODE_PROJECT: "" }
    await new Cmd({ env: pepr, cmd: `npx pepr build` }).run()
    await new Cmd({ env: pepr, cmd: `npx pepr deploy --confirm` }).run()
  }, mins(5))

  afterAll(async () => await clean(trc), mins(5))

  beforeEach(async () => {
    // TODO: create "zero'ed" cpr
  })

  afterEach(async () => {
    // TODO: clean out "dirty" cpr
  })

  it("can access Pepr controller logs", async () => {
    const raw = await new Cmd({
      env: { KUBECONFIG: process.env.KUBECONFIG },
      cmd: `kubectl -n pepr-system logs -l 'pepr.dev/controller=admission'`
    }).run()

    const logs = raw.stdout.filter(l => l !== '')
      .map(l => JSON.parse(l))
      .filter(l => l.url !== "/healthz" && l.msg !== "Pepr Store update")

    const needle = '✅ Controller startup complete'
    expect(logs.filter(u => u.msg === needle)).toHaveLength(2)

  }, secs(30))

  it.skip("fails bad examples", async () => {

  })

  it.skip("passes good examples", async () => {
    
  })
})
