import { Capability, K8s, Log, a, kind } from "pepr";
import { K8s, kind } from 'kubernetes-fluent-client';
import { PolicyReport } from '../types/policyreport-v1alpha1';
import test from "node:test";
import { ConfigMap } from "kubernetes-fluent-client/dist/upstream";
import { request } from "node:http";

export const TestPolicyReport = new Capability({
    name: "test-policy-report",
    description: "Generate a  resource",
  });

const { When, Store } = TestPolicyReport;

When(ConfigMap)
  .IsCreated()
  .Validate(request => {
    if (request.Raw.metadata.Name != null) {
        return request.Approve();
    }

    return request.Deny("Name is required");    
})

