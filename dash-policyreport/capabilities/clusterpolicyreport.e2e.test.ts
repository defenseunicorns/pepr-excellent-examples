import { afterEach, beforeEach, beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate, untilTrue } from "helpers/src/general";
import { moduleUp, moduleDown } from "helpers/src/pepr";
import { secs, mins } from "helpers/src/time";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "kubernetes-fluent-client";
import { ClusterPolicyReport } from "../types/clusterpolicyreport-v1alpha2";
import { UDSExemptionCRD } from "../types/uds-exemption-crd-v1alpha1";
import { Exemption } from "../types/uds-exemption-v1alpha1";
import { gone } from "helpers/src/resource";

const trc = new TestRunCfg(__filename);

kind["ClusterPolicyReport"] = ClusterPolicyReport;
kind["Exemption"] = Exemption;

const apply = async res => {
  return await fullCreate(res, kind);
};

describe("Pepr ClusterPolicyReport()", () => {
  beforeAll(async () => {
    // want the CRD to install automagically w/ the Pepr Module startup (eventually)
    let label = "load ClusterPolicyReport CRD"
    console.time(label)
    let crds = await trc.load(`${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`);
    crds = crds.map( (crd) => {
      delete crd.metadata.labels
      return crd
    })
    const crds_applied = await apply(crds);
    console.timeEnd(label)

    label = "load UDS Exemption CRD"
    console.time(label)
    const exemption_applied = await K8s(kind.CustomResourceDefinition).Apply(
      UDSExemptionCRD,
    );
    console.timeEnd(label)

    await moduleUp();
  }, mins(4));

  beforeEach( async () => {
    const file = `${trc.root()}/capabilities/exemption.yaml`

    const label = `load resources: ${file}`
    console.time(label)
    const resources = await trc.load(file)
    const resources_applied = await apply(resources);
    console.timeEnd(label)
  }, secs(30))

  afterEach( async () => {
    const label = "clean test-labelled resources"
    console.time(label)
    await clean(trc)
    console.timeEnd(label)
  }, mins(3))


  afterAll(async () => {
    const label = "teardown Pepr module"
    console.time(label)
    await moduleDown();
    console.timeEnd(label)
  }, mins(2));

  it(
    "Generate policy report when there is a uds exemption",
    async () => {
      const cpr = await K8s(ClusterPolicyReport).Get("pepr-report");
      expect(cpr).not.toBeFalsy();
    },
    secs(30),
  );

  it(
    "When there are no exemptions delete the cluster policy report",
    async () => {
      await K8s(Exemption).InNamespace("pexex-policy-report").Delete("exemption")
      await untilTrue(() => gone(ClusterPolicyReport, {metadata: {name: "pepr-report"} }))
    },
    secs(30),
  );
});
