import { afterEach, beforeEach, beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate, untilTrue } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { secs, mins, sleep } from "helpers/src/time";
import { clean } from "helpers/src/cluster";
import { gone } from "helpers/src/resource";
import { K8s, kind } from "kubernetes-fluent-client";
import { ClusterPolicyReport } from "../types/clusterpolicyreport-v1alpha2";
import { UDSExemptionCRD } from "../types/uds-exemption-crd-v1alpha1";
import { Exemption } from "../types/uds-exemption-v1alpha1";
import exp from "constants";

const trc = new TestRunCfg(__filename);

kind["ClusterPolicyReport"] = ClusterPolicyReport;
kind["Exemption"] = Exemption;

const apply = async res => {
  return await fullCreate(res, kind);
};

const timed = async (m, f) => {
  console.time(m)
  await f()
  console.timeEnd(m)
}

describe("Pepr ClusterPolicyReport()", () => {
  beforeAll(async () => {
    // want the CRD to install automagically w/ the Pepr Module startup (eventually)
    await timed("load ClusterPolicyReport CRD", async () => {
      const crds = await trc.loadRaw(`${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`)
      const crds_applied = await apply(crds)
    })

    await timed("load UDS Exemption CRD", async () => {
      const exemption_applied = await K8s(kind.CustomResourceDefinition).Apply(
        UDSExemptionCRD,
      )
    })

    await moduleUp()
  }, mins(4))

  beforeEach(async () => {
    const file = `${trc.root()}/capabilities/exemption.yaml`
    await timed(`load: ${file}`, async () => {
      const resources = await trc.load(file)
      const resources_applied = await apply(resources)

      // '{"level":20,"time":1708704596527,"pid":16,"hostname":"pepr-5f4e99be-321f-5a32-85bd-eb2c9bfcc291-6546c47845-zhlbc","uid":"fef1a632-4be6-4f0b-9778-88bf3f55881c","namespace":"pexex-policy-report","name":"/example-bad-pod","kubeAdmissionResponse":{"uid":"fef1a632-4be6-4f0b-9778-88bf3f55881c","allowed":true,"status":{"message":""}},"msg":"Outgoing response"}',
      const matches = line => {
        const l = JSON.parse(line)
        const found = (
          l?.namespace === 'pexex-policy-report'  &&
          l?.name === '/example-bad-pod' &&
          l?.kubeAdmissionResponse?.allowed === true
        )
        if (found){
          console.log(line)
        }
        return found
      }
      await untilLogged(matches)
    })
  }, secs(30))

  afterEach(async () => {
    await timed("clean test-labelled resources", async () => {
      //await clean(trc)
    })
  }, mins(3))

  afterAll(async () => {
    await timed("teardown Pepr module", async () => {
      //await moduleDown()
    })
  }, mins(2));

  it("Generate policy report when there is a uds exemption", async () => {
    const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")
    expect(cpr).not.toBeFalsy();
  }, secs(30))

  it("When there are no exemptions delete the cluster policy report", async () => {
    await K8s(Exemption).InNamespace("pexex-policy-report").Delete("exemption")
    await untilTrue(() => gone(ClusterPolicyReport, { metadata: { name: "pepr-report" } }))
  }, secs(30))

  it("Adds a result to the policy report", async () => {

    await sleep(40)
    const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")
    console.log(await logs())
    expect(cpr.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({policy: "exemption:Disallow_Privileged"}),
        expect.objectContaining({policy: "exemption:Drop_All_Capabilities"})
      ])
    )

  }, secs(100))
});
