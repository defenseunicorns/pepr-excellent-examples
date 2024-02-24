import { afterEach, beforeEach, beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate, untilTrue } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { secs, mins, sleep } from "helpers/src/time";
import { clean } from "helpers/src/cluster";
import { gone } from "helpers/src/resource";
import { K8s, kind } from "kubernetes-fluent-client";
import { ClusterPolicyReport, ResultElement } from "../types/clusterpolicyreport-v1alpha2";
import { UDSExemptionCRD } from "../types/uds-exemption-crd-v1alpha1";
import { Exemption } from "../types/uds-exemption-v1alpha1";

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

describe("ClusterPolicyReport", () => {
  beforeAll(async () => {
    // want the CRD to install automagically w/ the Pepr Module startup (eventually)
    await timed("load ClusterPolicyReport CRD", async () => {
      const crds = await trc.loadRaw(`${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`)
      const crds_applied = await apply(crds)
    })

    // assumed to already exist as part of UDS install
    await timed("load UDS Exemption CRD", async () => {
      const exemption_applied = await K8s(kind.CustomResourceDefinition).Apply(
        UDSExemptionCRD,
      )
    })

    await moduleUp()
  }, mins(4))

  beforeEach(async () => {
    const file = `${trc.root()}/capabilities/scenario.exemptions.yaml`
    await timed(`load: ${file}`, async () => {
      const resources = await trc.load(file)
      const resources_applied = await apply(resources)

      // await untilLogged('"msg":"pepr-report updated"')
    })
  }, secs(10))

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

  it("is created when UDS Exemption exists", async () => {
    const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")
    expect(cpr).not.toBeFalsy();
  }, secs(30))

  it("is deleted when UDS Exemptions are gone", async () => {
    await K8s(Exemption).InNamespace("pexex-policy-report").Delete("exemption")
    await untilTrue(() => gone(ClusterPolicyReport, { metadata: { name: "pepr-report" } }))
  }, secs(30))

  it("has results for each UDS Exemption", async () => {
    const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")

    console.log(await logs())

    expect(cpr.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          policy: "pexex-clusterpolicyreport:allow-naughtiness:Disallow_Privileged",
          resources: [

          ]
        }),
        expect.objectContaining({
          policy: "pexex-clusterpolicyreport:allow-naughtiness:Drop_All_Capabilities",
          resources: [
            
          ]
        }),
        expect.objectContaining({
          policy: "pexex-clusterpolicyreport:allow-naughtiness:Restrict_Volume_Types",
          resources: [
            
          ]
        }),
      ])
    )

    // const pod = {kind:"Pod",name:"naughty-pod"}

    // expect(cpr.results).toEqual(
    //   expect.arrayContaining([
    //     expect.objectContaining({
    //       policy: "exemption:Disallow_Privileged",
    //       resources: [ pod ]
    //     }),
    //     expect.objectContaining({
    //       policy: "exemption:Drop_All_Capabilities",
    //       resources: [ pod ]
    //     }),
    //     expect.objectContaining({
    //       policy: "exemption:Restrict_Volume_Types",
    //       resources: [ pod ]
    //     }),
    //   ])
    // )
  }, secs(10))
});
