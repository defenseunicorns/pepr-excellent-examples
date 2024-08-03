import { Capability, Log, a } from "pepr";

export const HelloPeprReconcile = new Capability({
  name: "hello-pepr-reconcile",
  description: "A Kubernetes Operator that manages WebApps",
  namespaces: ["pepr-demo"],
});

const { When } = HelloPeprReconcile;

let i = 0;
When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace("pepr-demo")
  .Reconcile(async instance => {
    if (instance.metadata?.name !== "kube-root-ca.crt") {
      return new Promise(resolve => {
        const timeOut = i++ % 2 == 0 ? 20000 : 5000;
        setTimeout(() => {
          Log.info(
            `Callback: Reconciling ${instance.metadata.name} after ${
              timeOut / 1000
            }s`,
          );
          resolve();
        }, timeOut);
      });
    }
  });

const logPod = (name: string, color: string) => {
  Log.info(`Pod with name ${name} has color ${color}.`);
};
When(a.Pod)
  .IsCreatedOrUpdated()
  .Reconcile(po => {
    const { labels, name } = po.metadata;

    switch (name) {
      case "a":
        setTimeout(() => logPod(name, labels.color), 1000);
        break;
      case "b":
        setTimeout(() => logPod(name, labels.color), 10000);
        break;
    }
  });
