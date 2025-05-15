import { Capability, a, kind, K8s } from "pepr";

const name = "hello-pepr-config-ignored-ns";

export const HelloPeprIgnoredNS = new Capability({
  name: name,
  description: name,
  namespaces: [],
});
const { When } = HelloPeprIgnoredNS;

// https://regex101.com/r/JsQ8AT/1
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^mutate-ignored/)
  .Mutate(po => po.SetLabel("not", "seen"));

// https://regex101.com/r/JsQ8AT/1
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^mutate-ignored/)
  .Watch(async cm => {
    await K8s(kind.ConfigMap).Apply({
      metadata: {
        name: cm.metadata.name,
        namespace: cm.metadata.namespace,
        annotations: {
          been: "seen",
        },
      },
      data: {
        "cm-uid": cm.metadata.uid,
      },
    });
  });

// https://regex101.com/r/rnXli6/1
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^watch-ignored/)
  .Mutate(cm => cm.SetLabel("can", "see"));

// https://regex101.com/r/rnXli6/1
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^watch-ignored/)
  .Watch(async cm => {
    await K8s(kind.ConfigMap).Apply({
      metadata: {
        name: cm.metadata.name,
        namespace: cm.metadata.namespace,
        labels: {
          been: "seen",
        },
      },
      data: {
        "cm-uid": cm.metadata.uid,
      },
    });
  });
