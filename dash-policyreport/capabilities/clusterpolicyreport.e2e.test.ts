import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, logs, untilLogged } from "helpers/src/pepr";
import { sleep, secs, mins } from "helpers/src/time";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "kubernetes-fluent-client";
import { ClusterPolicyReport } from "../types/clusterpolicyreport-v1alpha2";
import { UDSExemptionCRD } from "../types/uds-exemption-crd-v1alpha1";
import { Exemption } from "../types/uds-exemption-v1alpha1";

const trc = new TestRunCfg(__filename);

kind["ClusterPolicyReport"] = ClusterPolicyReport;
kind["Exemption"] = Exemption;

const apply = async res => {
  return await fullCreate(res, kind);
};

describe("Pepr ClusterPolicyReport()", () => {
  beforeAll(async () => {
    // want the CRD to install automagically w/ the Pepr Module startup (eventually)
    const crds = await trc.load(
      `${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`,
    );
    const crds_applied = await apply(crds);
    const exemption_applied = await K8s(kind.CustomResourceDefinition).Apply(
      UDSExemptionCRD,
    );

    await moduleUp();
  }, mins(4));

  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  it(
    "can generate a cluster policy report",
    async () => {
      const resources = await trc.load(
        `${trc.root()}/capabilities/exemption.yaml`,
      );
      const resources_applied = await apply(resources);

      const cpr = await K8s(ClusterPolicyReport).Get("pepr-report");
      expect(cpr).not.toBeFalsy();
    },
    secs(30),
  );

});
