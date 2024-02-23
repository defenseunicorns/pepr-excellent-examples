import { a, Capability, K8s, Log } from "pepr";
import { Exemption } from "../types/uds-exemption-v1alpha1";
import { ClusterPolicyReport, ResultElement } from "../types/clusterpolicyreport-v1alpha2";
import { sleep } from "helpers/src/time";

export const PeprReport = new Capability({
  name: "pepr-report",
  description: "pepr-report",
  namespaces: [],
});

const { When } = PeprReport;

When(Exemption)
  .IsCreatedOrUpdated()
  .Validate(async request => {
    try {
      const cpr = await K8s(ClusterPolicyReport).Get("pepr-report");
    } catch (e) {
      if (e.status === 404) {
        const cpr: ClusterPolicyReport = {
          apiVersion: "wgpolicyk8s.io/v1alpha2",
          kind: "ClusterPolicyReport",
          metadata: {
            name: "pepr-report",
          },
          results: [],
          summary: {
            pass: 0,
            fail: 0,
            warn: 0,
            error: 0,
            skip: 0,
          },
        };
        await K8s(ClusterPolicyReport).Apply(cpr);
      } else {
        Log.error(e);
      }
    }

    return request.Approve();
  });

When(Exemption)
  .IsDeleted()
  .Validate(async request => {
    const exemption_list = await K8s(Exemption).Get()
    if (exemption_list.items.length > 1) { return request.Approve() }

    try {
      await K8s(ClusterPolicyReport).Delete("pepr-report")
    }
    catch (e) {
      if (e.status != 404) {
        Log.error(e)
        return request.Deny()
      }
    }
    return request.Approve()
  }
  )

When(a.GenericKind)
  .IsCreatedOrUpdated()
  .WithLabel("uds.dev.v1alpha1/exemption","true")
  .Validate(async request => {


    Log.info(request, "we are in logging for generic kind")

    // if (policies.length > 0) {
    //   const cpr = await K8s(ClusterPolicyReport).Get("pepr-report");
    //   delete cpr.metadata.managedFields
    //   for (let [name, policy] of policies) {
    //     const result: ResultElement = {
    //       policy: `${name}:${policy}`,
    //       message: policy,
    //       resources: [{
    //         name: request.Raw.metadata.name,
    //         kind: request.Raw.kind
    //       }]
    //     }
    //     cpr.results.push(result)
    //   }
    //   const applied = await K8s(ClusterPolicyReport).Apply(cpr)
    //   Log.info(applied, "pepr-report updated")
    // }
    return request.Approve()
  }
  )
