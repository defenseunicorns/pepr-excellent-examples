import { a, Capability, K8s, Log } from "pepr";
import { Exemption } from "../types/uds-exemption-v1alpha1";
import { ClusterPolicyReport, ResultElement } from "../types/clusterpolicyreport-v1alpha2";

export const PeprReport = new Capability({
  name: "pepr-report",
  description: "pepr-report",
  namespaces: [],
});

const empty: ClusterPolicyReport = {
  apiVersion: "wgpolicyk8s.io/v1alpha2",
  kind: "ClusterPolicyReport",
  metadata: {
    name: "pepr-report",
  },
  summary: {
    pass: 0,
    fail: 0,
    warn: 0,
    error: 0,
    skip: 0,
  },
  results: [],
};

const { When } = PeprReport;

When(Exemption)
  .IsCreatedOrUpdated()
  .Validate(async request => {
    try {
      const cpr = await K8s(ClusterPolicyReport).Get("pepr-report");
    } catch (e) {
      if (e.status === 404) {
        await K8s(ClusterPolicyReport).Apply(empty);
      } else {
        Log.error(e);
      }
    }

    return request.Approve();
  });

When(Exemption)
  .IsDeleted()
  .Validate(async request => {
    const list = await K8s(Exemption).Get()
    if (list.items.length > 1) { return request.Approve() }

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
  });

const asExemptedResource = async (request) => {
  const EXEMPTIONS = "exemptions.uds.dev/v1alpha1"

  const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")
  delete cpr.metadata.managedFields

  const raw = request.Raw
  const kind = raw.kind
  const name = raw.metadata.name
  const nspc = raw.metadata.namespace
  const exms = raw.metadata.annotations[EXEMPTIONS].split(" ")

  const res = [ kind, nspc, name ].join(":")
  Log.info({ resource: res, exemptions: exms }, `Exempt: ${res}`)

  // include exempted resource under relevant policies
  for (const exm of exms) {

    // locate / create result element
    const results = cpr.results.filter(r => r.policy === exm)
    let result = results.length > 0
      ? { ...results[0] }
      : { policy: exm, resources: [] }

    // locate / create resource element
    let found = result.resources.filter(r => (
      r.kind === kind &&
      r.namespace === nspc &&
      r.name === name
    ))
    if (found.length === 0) {
      result.resources.push({ kind, namespace: nspc, name })
    }

    // update / create result element
    const idx = cpr.results.findIndex(r => r.policy === exm)
    idx === -1
      ? cpr.results.push(result)
      : cpr.results.splice(idx, 1, result)
  }

  const applied = await K8s(ClusterPolicyReport).Apply(cpr)
  Log.info(applied, "pepr-report updated")

  return request.Approve()
}

const lbl: [string, string] = [ "exemptions.uds.dev",  "v1alpha1" ]
When(a.Pod).IsCreatedOrUpdated().WithLabel(...lbl).Validate(asExemptedResource)
When(a.Service).IsCreatedOrUpdated().WithLabel(...lbl).Validate(asExemptedResource)

// When(a.Pod).IsDeleted().WithLabel(...lbl).Validate(asDeletedResource)
// When(a.Service).IsDeleted().WithLabel(...lbl).Validate(asDeletedResource)

// adding resources to CPR when exemption label is added... but what about when it's taken away?
// - does a resource with a label being removed still trigger .WithLabel()?
// - how will we see things that "used to be" exempted but aren't anymore?