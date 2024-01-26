import {
  Capability,
  K8s, Log, a, kind
} from "pepr";
import { ConfigMap } from "kubernetes-fluent-client/dist/upstream";
import { PolicyReport } from '../types/policyreport-v1alpha2';

export const PolicyCapability = new Capability({
  name: "test-policy-report",
  description: "Generate a resource",
});

const { When } = PolicyCapability;

const peprPolicyReportName = "pepr-policy-report"

async function generateReport() {
  const policyReport = {
    apiVersion: "wgpolicyk8s.io/v1alpha2",
    kind: "PolicyReport",
    metadata: {
      name: peprPolicyReportName,
      namespace: "pepr-system"
    },
    results: [],
    summary: {error: 0, pass: 0, skip: 0, warn: 0, fail: 0}
  }
  try{ 
    const policyReportApply = await K8s(PolicyReport).Apply(policyReport)
    console.log(policyReportApply)
  } catch (e) {
    console.log(e)
  }
  
}

// generateReport().then(() => {})

async function updateReport() { 
  const policyReport = await K8s(PolicyReport).InNamespace("pepr-system").Get(peprPolicyReportName)
  
  //policyReport.summary = {error: 1, pass: 0, skip: 0, warn: 0, fail: 0}
  const policyReportApply = await K8s(PolicyReport).Apply(policyReport)
}

When(ConfigMap)
.IsCreatedOrUpdated()
.Validate(async request => {
  await generateReport()
  if (request.Raw.metadata.name !== "fail") {
    await updateReport()
  }
  return request.Approve()
});