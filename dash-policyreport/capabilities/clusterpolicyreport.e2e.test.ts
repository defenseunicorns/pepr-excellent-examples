import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, logs, untilLogged } from "helpers/src/pepr";
import { secs, mins } from 'helpers/src/time';
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';
import { ClusterPolicyReport } from '../types/clusterpolicyreport-v1alpha2';
import { UDSExemptionCRD } from "../types/uds-exemption-crd-v1alpha1";
import { Exemption } from "../types/uds-exemption-v1alpha1";

const trc = new TestRunCfg(__filename)

kind["ClusterPolicyReport"] = ClusterPolicyReport
kind["Exemption"] = Exemption

const apply = async (res) => { return await fullCreate(res, kind) }

describe("Pepr ClusterPolicyReport()", () => {
  beforeAll(async () => {
    // want the CRD to install automagically w/ the Pepr Module startup (eventually)
    const crds = await trc.load(`${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`)
    const crds_applied = await apply(crds)
    K8s(kind.CustomResourceDefinition).Apply(
      UDSExemptionCRD
    )
    
    // want intial CR to install automagically on first .Validate() (eventually)
    const crs = await trc.load(`${trc.here()}/clusterpolicyreport.yaml`)
    const crs_applied = await apply(crs)
    
    await moduleUp()
  }, mins(2))

  afterAll(async () => {
    await moduleDown()
    await clean(trc)
  }, mins(2))
  
  it("can access a zeroized ClusterPolicyReport", async () => {
    const crd = await K8s(kind.CustomResourceDefinition).Get("clusterpolicyreports.wgpolicyk8s.io")
    const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")

    Object.values(cpr.summary).forEach(value => {
      expect(value).toBe(0)
    })
  }, secs(30))

  it("can create an exemption", async () => {
    const ns = await trc.load(`${trc.root()}/capabilities/namespace.yaml`)
    const ns_applied = await apply(ns)
    const exemption = await trc.load(`${trc.root()}/capabilities/exemption.yaml`)
    await apply(exemption)

    const gotten = await K8s(Exemption).InNamespace(ns_applied[0].metadata.name).Get("exemption")
  }, secs(30))
  

  it("can access Pepr controller logs", async () => {
    await untilLogged('--> asdf')

  }, secs(10))
})
