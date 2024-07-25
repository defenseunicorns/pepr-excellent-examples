import { Capability, a, K8s } from "pepr";

export const HelloPeprSoak = new Capability({
  name: "hello-pepr-soak",
  description: "soak test",
  namespaces: ["pepr-demo"],
});

const { When } = HelloPeprSoak;

const deletePod = async (name: string) => {
  await K8s(a.Pod).InNamespace("pepr-demo").Delete(name);
};

When(a.Pod)
  .IsCreatedOrUpdated()
  .InNamespace("pepr-demo")
  .Reconcile(async instance => {
    await deletePod(instance.metadata.name);
  });
