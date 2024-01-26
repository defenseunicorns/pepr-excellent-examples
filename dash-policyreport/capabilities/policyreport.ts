import {
  Capability,
  // K8s, Log, a, kind
} from "pepr";
// import { PolicyReport } from '../types/policyreport-v1alpha1';
import { ConfigMap } from "kubernetes-fluent-client/dist/upstream";

export const PolicyCapability = new Capability({
  name: "test-policy-report",
  description: "Generate a  resource",
});

const { When } = PolicyCapability;

When(ConfigMap)
  .IsCreated()
  .Validate(request => {
    return request.Raw.metadata.name !== "fail"
      ? request.Approve()
      : request.Deny("Name must not be 'fail'");
  });
