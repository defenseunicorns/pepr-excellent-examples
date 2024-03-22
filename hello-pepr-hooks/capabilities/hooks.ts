import { Capability, a } from "pepr";

const name = "hello-pepr-hooks";

export const HelloPeprHooks = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprHooks;

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-only")
  .Mutate(function mutateOnly(){});

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("validate-only")
  .Validate(function validateOnly(request) {return request.Approve()});

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Mutate(function mutateMutVal(){});

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Validate(function validateMutVal(request) {return request.Approve()});
