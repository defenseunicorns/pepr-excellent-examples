import { Capability, a } from "pepr";

const name = "hello-pepr-rbac";

export const HelloPeprRBAC = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprRBAC;

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("rbac-test-secret")
  .Mutate(function mutateOnly() {});
