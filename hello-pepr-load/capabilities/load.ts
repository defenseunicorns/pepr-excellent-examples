import { a, Capability, K8s } from "pepr";

const ns = "hello-pepr-load";

export const HelloPeprLoad = new Capability({
  name: ns,
  description: ns,
  namespaces: [ns],
});
const { When } = HelloPeprLoad;

When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace(ns)
  .Reconcile(async function immediatelyDelete(cm) {
    const { name } = cm.metadata;
    if (name === "kube-root-ca.crt") {
      return;
    }

    await K8s(a.ConfigMap).InNamespace(ns).Delete(name);
  });
