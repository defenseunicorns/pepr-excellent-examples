import { Capability, a, Log } from "pepr";

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
  .Mutate(() => {});

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("validate-only")
  .Validate(request => request.Approve());

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Mutate(() => {});

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Validate(request => request.Approve());
