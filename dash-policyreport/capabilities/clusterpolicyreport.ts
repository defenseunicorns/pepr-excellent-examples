import { a, Capability, K8s, Log } from "pepr";
import { Exemption } from "../types/uds-exemption-v1alpha1";
import { ClusterPolicyReport } from "../types/clusterpolicyreport-v1beta1";
import { StatusFilterElement } from "../types/policyreport-v1beta1";

export const PeprReport = new Capability({
  name: "pepr-report",
  description: "pepr-report",
  namespaces: [],
});

const empty: ClusterPolicyReport = {
  apiVersion: "wgpolicyk8s.io/v1beta1",
  kind: "ClusterPolicyReport",
  metadata: {
    name: "pepr-report",
    labels: {"policy.kubernetes.io/engine": "pepr"},
    annotations: {
      "uds-core.pepr.dev/uds-core-policies": "exemptions"
    }
  },
  summary: {
    pass: 0,  // <-- w/o exemptions
    fail: 0,  // <-- with exemptions
    warn: 0,
    error: 0,
    skip: 0,
  },
  results: [
    {
      policy: "DisallowHostNamespaces",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },  
    {
      policy: "DisallowNodePortServices",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "DisallowPrivileged",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },  
    { 
      policy: "DisallowSELinuxOptions",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "DropAllCapabilities",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "RequireNonRootUser",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },  
    {
      policy: "RestrictCapabilities",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
    policy: "RestrictExternalNames",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "RestrictHostPathWrite",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "RestrictHostPorts",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "RestrictProcMount",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "RestrictSELinuxType",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "RestrictSeccomp",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
    {
      policy: "RestrictVolumeTypes",
      result: StatusFilterElement.Pass,
      resources: [],
      properties: {},
    },
  ],
};

const { When } = PeprReport;

When(Exemption)
  .IsCreatedOrUpdated()
  .Validate(async function createCPR(request) {
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
  .Validate(async function deleteCPR(request) {
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

const asExemptedResource = async (instance) => {
  const EXEMPTIONS = "exemptions.uds.dev/v1alpha1"

  const cpr = await K8s(ClusterPolicyReport).Get("pepr-report")
  delete cpr.metadata.managedFields

  const vers = instance.apiVersion
  const kind = instance.kind
  const name = instance.metadata.name
  const nspc = instance.metadata.namespace
  const exms = instance.metadata.annotations[EXEMPTIONS].split(" ")

  const res = [ kind, nspc, name ].join(":")
  Log.info({ resources: res, exemptions: exms }, `Exempt: ${res}`)

  // const properties = {
  //   exemptions: [
  //     {
  //       apiVersion: "uds.dev/v1alpha1",
  //       kind: "Exemption",
  //       namespace: "pexex-clusterpolicyreport",
  //       name: "allow-naughtiness"
  //     },
  //   ]
  // }

  // include exempted resources under relevant policies
  for (const exm of exms) {

    // pull exemption/policy from exemption label
    const [exNpsc, exName, pol] = exm.split(":")

    // locate / create result element
    const results = cpr.results.filter(r => r.policy === pol)
    let result = results.length > 0
      ? { ...results[0] }
      : {
        policy: pol,
        result: StatusFilterElement.Pass,
        resources: []
      }

    // locate / create resources element
    let found = result.resources.filter(r => (
      r.apiVersion === vers &&
      r.kind === kind &&
      r.namespace === nspc &&
      r.name === name
    ))
    if (found.length === 0) {
      result.resources.push({ apiVersion: vers, kind, namespace: nspc, name })
    }

    // determine pass / fail
    result.result = result.resources.length === 0
      ? StatusFilterElement.Pass
      : StatusFilterElement.Fail

    // update / create result element
    const idx = cpr.results.findIndex(r => r.policy === pol)
    idx === -1
      ? cpr.results.push(result)
      : cpr.results.splice(idx, 1, result)
  }

  // refresh summary counts
  cpr.summary = {
    ...empty.summary,
    pass: cpr.results.filter(f => f.result === "pass").length,
    fail: cpr.results.filter(f => f.result === "fail").length,
  }

  const applied = await K8s(ClusterPolicyReport).Apply(cpr)
  Log.info(applied, "pepr-report updated")
}

const lbl: [string, string] = [ "exemptions.uds.dev",  "v1alpha1" ]
When(a.Pod).IsCreatedOrUpdated().WithLabel(...lbl).Reconcile(asExemptedResource)
When(a.Service).IsCreatedOrUpdated().WithLabel(...lbl).Reconcile(asExemptedResource)
