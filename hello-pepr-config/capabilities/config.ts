import { Capability, a, Log } from "pepr";

const name = "hello-pepr-config";

export const HelloPeprConfig = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprConfig;

When(a.Namespace)
  .IsCreated()
  .Mutate(async function mutateAll(request) {
    request.SetAnnotation("pepr", "was here")
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("noop")
  .Mutate(async function mutateEnv(request) {
    Log.info({ITS: process.env.ITS}, "env")
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("noop")
  .Validate(async function validateNoop(request) {
    Log.info({}, "noop")
    return request.Approve()
  });
