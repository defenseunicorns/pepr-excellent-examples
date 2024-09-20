import { Capability, a, kind, K8s } from "pepr";

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
  .WithRegexName(/^default/)
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });

// https://regex101.com/r/IFdxd8/1
When(a.ConfigMap)
  .IsCreated()
  .WithRegexName(/-default$/)
  .Mutate(function mutateNs(request) {
    request.SetAnnotation("obviously", "seen");
  });
// https://regex101.com/r/KOGr7r/1
When(a.ConfigMap)
  .IsCreated()
  .WithRegexName(/^invisible/)
  .Watch(async (cm)=> {
    await K8s(kind.ConfigMap).Apply({
      metadata: {
        name: cm.metadata.name,
        namespace: cm.metadata.namespace,
        annotations: {
          not: "seen",
        },
      },
      data: {
        "cm-uid": cm.metadata.uid,
      },
    });
  });

  // https://regex101.com/r/KOGr7r/1
When(a.ConfigMap)
.IsCreated()
.WithRegexName(/^invisible/)
.Mutate(cm=> cm.SetAnnotation("not", "seen"));
