import { Capability, a, K8s, kind } from "pepr";

const name = "hello-pepr-config-ignored-ns";

export const HelloPeprIgnoredNS = new Capability({
  name: name,
  description: name,
  namespaces: [],
});
const { When } = HelloPeprIgnoredNS;

// https://regex101.com/r/KOGr7r/1
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^invisible/)
  .Watch(async cm => {
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
  .WithNameRegex(/^invisible/)
  .Mutate(cm => cm.SetAnnotation("not", "seen"));
