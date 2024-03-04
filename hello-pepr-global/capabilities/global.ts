import { Capability, a, Log } from "pepr";

const name = "hello-pepr-global";

export const HelloPeprGlobal = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When, Store } = HelloPeprGlobal;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("noop")
  .Mutate(async request => {
    Log.info({}, "noop")
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("noop")
  .Validate(async request => {
    Log.info({}, "noop")
    return request.Approve()
  });