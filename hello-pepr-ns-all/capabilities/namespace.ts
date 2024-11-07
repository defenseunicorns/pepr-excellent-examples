import { Capability, a } from "pepr";

const name = "hello-pepr-ns-all";

export const HelloPeprNamespace = new Capability({
  name: name,
  description: name,
  namespaces: [],
});
const { When } = HelloPeprNamespace;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("default")
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .Mutate(function mutateNs(request) {
    request.SetAnnotation("ns", "seen");
  });

When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateNon(request) {
    request.SetAnnotation("non", "seen");
  });
