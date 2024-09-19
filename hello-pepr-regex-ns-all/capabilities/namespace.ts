import { Capability, a } from "pepr";

const name = "hello-pepr-ns-all";

export const HelloPeprNamespace = new Capability({
  name: name,
  description: name,
  namespaces: [],
});
const { When } = HelloPeprNamespace;

// https://regex101.com/r/xiuiU2/1
When(a.ConfigMap)
  .IsCreated()
  .InRegexNamespace(/^default/)
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });

// https://regex101.com/r/AiZpo5/1
When(a.ConfigMap)
  .IsCreated()
  .InRegexNamespace(/-ns-all$/)
  .Mutate(function mutateNs(request) {
    request.SetAnnotation("ns", "seen");
  });

When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateNon(request) {
    request.SetAnnotation("non", "seen");
  });
