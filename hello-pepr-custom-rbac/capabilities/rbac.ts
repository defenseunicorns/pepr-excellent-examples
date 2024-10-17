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

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("validate-only")
  .Validate(function validateOnly(request) {
    return request.Approve();
  });

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Mutate(function mutateMutVal() {});

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Validate(function validateMutVal(request) {
    return request.Approve();
  });
