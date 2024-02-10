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
import { lock, unlock, untilTrue } from "helpers/src/general";
import { secs, mins } from 'helpers/src/time';
import { live } from 'helpers/src/resource';
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';
import { ClusterPolicyReport } from '../types/clusterpolicyreport-v1alpha2';

const apply = async (resources) => {
  kind["ClusterPolicyReport"] = ClusterPolicyReport

  // normalize single / lists of resourcse as iterable list
  resources = [ resources ].flat()

  return Promise.all(resources.map(async (r) => {
    const kynd = kind[r.kind]
    const applied = await K8s(kynd).Apply(r)

    return untilTrue(() => live(kynd, applied))
  }))
}

const trc = new TestRunCfg(__filename);

beforeAll(async () => { await lock(trc) }, mins(10))
afterAll(async () => { await unlock(trc) });

describe("Pepr ClusterPolicyReport()", () => {
  beforeAll(async () => {
    // want the CRD to install automagically w/ the Pepr Module startup (eventually)
    const crds = await trc.load(`${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`)
    const crds_applied = await apply(crds)

    // want intial CR to install automagically on Pepr Module startup (eventually)
    const crs = await trc.load(`${trc.here()}/clusterpolicyreport.yaml`)
    const crs_applied = await apply(crs)

    await new Cmd({ cmd: `npx pepr build` }).run()
    await new Cmd({ cmd: `npx pepr deploy --confirm` }).run()
  }, mins(5))

  afterAll(async () => await clean(trc), mins(5))

  beforeEach(async () => {
    // TODO: create "zero'ed" cpr
  })

  afterEach(async () => {
    // TODO: clean out "dirty" cpr
  })

  it("can access a zeroized ClusterPolicyReport", async () => {
    const crd = await K8s(kind.CustomResourceDefinition).Get("clusterpolicyreports.wgpolicyk8s.io")
    const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")

    Object.values(cpr.summary).forEach(value => {
      expect(value).toBe(0)
    })
  }, secs(30))

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
})
