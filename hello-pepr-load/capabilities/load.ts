import { a, Capability, K8s } from "pepr";

const ns = "hello-pepr-load";

export const HelloPeprLoad = new Capability({
  name: ns,
  description: ns,
  namespaces: [ns],
});
const { When } = HelloPeprLoad;

When(a.Pod)
  .IsCreatedOrUpdated()
  .InNamespace(ns)
  .Reconcile(async pod => {
    await K8s(a.Pod).InNamespace(ns).Delete(pod.metadata.name);
  });
