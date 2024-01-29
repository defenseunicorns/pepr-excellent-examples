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
  untilTrue,
  sleep,
} from "helpers/src/general";
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';
import { ClusterPolicyReport } from '../types/clusterpolicyreport-v1alpha2';

const apply = async (resources) => {
  kind["ClusterPolicyReport"] = ClusterPolicyReport

  resources = [ resources ].flat()
  return Promise.all(resources.map(async (r) => {
    const kynd = kind[r.kind]
    const applied = await K8s(kynd).Apply(r)
    const ns = applied.metadata.namespace ? applied.metadata.namespace : ""

    return untilTrue(async () => {
      try { await K8s(kind[r.kind]).InNamespace(ns).Get(applied.name) }
      catch (e) {
        if (e.status === 404) { return false }
        else { throw e }
      }
      return true
    })
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

  it("can access to a zeroized ClusterPolicyReport", async () => {
    const crd = await K8s(kind.CustomResourceDefinition).Get("clusterpolicyreports.wgpolicyk8s.io")
    const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")

    Object.entries(cpr.summary).forEach( ([key, value]) => {
      expect(value).toBe(0)
    })

    // await sleep(mins(30)

  }, mins(30))
});
