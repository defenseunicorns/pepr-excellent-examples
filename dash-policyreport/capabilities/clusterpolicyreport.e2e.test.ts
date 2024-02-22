import { afterEach, beforeEach, beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate, untilTrue } from "helpers/src/general";
import { moduleUp, moduleDown, logs, untilLogged } from "helpers/src/pepr";
import { sleep, secs, mins } from "helpers/src/time";
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
    let crds = await trc.load(
      `${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`,
    );
    crds = crds.map( (crd) => {
      delete crd.metadata.labels
      return crd
    })
    const crds_applied = await apply(crds);
    const exemption_applied = await K8s(kind.CustomResourceDefinition).Apply(
      UDSExemptionCRD,
    );

    await moduleUp();
  }, mins(4));

  beforeEach( async () => {
    const resources = await trc.load(
      `${trc.root()}/capabilities/exemption.yaml`,
    );
    const resources_applied = await apply(resources);
  }, secs(30))

  afterEach( async () => {
    console.time("cleaning up")
    await clean(trc)
    console.timeEnd("cleaning up")
  }, secs(180))


  // afterAll(async () => {
  //   await moduleDown();
  //   await clean(trc);
  // }, mins(2));

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
