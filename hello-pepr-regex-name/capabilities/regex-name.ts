import { Capability, a } from "pepr";

const name = "hello-pepr-regex-name";

export const HelloPeprRegexName = new Capability({
  name: name,
  description: name,
  namespaces: [],
});
const { When } = HelloPeprRegexName;

// https://regex101.com/r/tLkgcf/1
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^default/)
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });

// https://regex101.com/r/IFdxd8/1
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/-default$/)
  .Mutate(function mutateNs(request) {
    request.SetAnnotation("obviously", "seen");
  });
