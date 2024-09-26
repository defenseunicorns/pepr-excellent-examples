import { Capability, a, K8s, kind } from "pepr";

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
  .InNamespaceRegex(/^default/)
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });

// https://regex101.com/r/AiZpo5/1
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/-ns-all$/)
  .Watch(async cm =>  {
    await K8s(kind.ConfigMap).Apply({
      metadata: {
        name: cm.metadata.name,
        namespace: cm.metadata.namespace,
        annotations: {
          ns: "seen",
        },
      },
      data: {
        "cm-uid": cm.metadata.uid,
      },
    });
  });

When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateNon(request) {
    request.SetAnnotation("non", "seen");
  });
