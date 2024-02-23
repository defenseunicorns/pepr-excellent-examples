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

When(a.Pod)
  .IsCreatedOrUpdated()
  .Validate(async request => { 
    const exemptions = await K8s(Exemption).Get();

    let match = false
    for(const exempt of exemptions.items) {
      if (exempt.spec.exemptions[0].matcher.namespace !== request.Raw.metadata?.namespace){
        continue
      }

      if (exempt.spec.exemptions[0].matcher.name !== request.Raw.metadata?.name){
        continue
      }

      match = true
      break
    }

    if(match){ 
      const cpr = await K8s(ClusterPolicyReport).Get("pepr-report");
      delete cpr.metadata.managedFields
      for (let policy of exemptions.items[0].spec.exemptions[0].policies){
        const exemptionName = exemptions.items[0].metadata.name
        const result: ResultElement = { 
          policy: `${exemptionName}:${policy}`,
          message: policy
        }
        cpr.results.push(result)
      }
      const applied = await K8s(ClusterPolicyReport).Apply(cpr)
      Log.info(applied, "pepr-report updated")
    }
    return request.Approve()
  }
)
