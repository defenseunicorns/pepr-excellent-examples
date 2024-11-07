import { Capability, a } from "pepr";

const name = "hello-pepr-ns";
const alpha = `${name}-alpha`;
const bravo = `${name}-bravo`;

export const HelloPeprNamespace = new Capability({
  name: name,
  description: name,
  namespaces: [alpha, bravo],
});
const { When } = HelloPeprNamespace;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(alpha)
  .Mutate(function mutateAlpha(request) {
    request.SetAnnotation("a", "alpha");
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(bravo)
  .Mutate(function mutateBravo(request) {
    request.SetAnnotation("b", "bravo");
  });

When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateCharlie(request) {
    request.SetAnnotation("c", "charlie");
  });
