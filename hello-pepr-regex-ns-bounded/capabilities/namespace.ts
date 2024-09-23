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

// https://regex101.com/r/MGlq5l/1
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/-alpha$/)
  .Mutate(function mutateAlpha(request) {
    request.SetAnnotation("a", "alpha");
  });

// https://regex101.com/r/09FplD/1
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/-bravo$/)
  .WithNameRegex(/^two/)
  .Mutate(function mutateBravo(request) {
    request.SetAnnotation("b", "bravo");
  });

When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateCharlie(request) {
    request.SetAnnotation("c", "charlie");
  });
