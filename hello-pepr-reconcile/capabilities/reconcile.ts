import { Capability, Log, a } from "pepr";

export const HelloPeprReconcile = new Capability({
  name: "hello-pepr-reconcile",
  description: "A Kubernetes Operator that manages WebApps",
  namespaces: ["pepr-demo"],
});

const { When } = HelloPeprReconcile;

let i = 0;
When(a.Service)
  .IsCreatedOrUpdated()
  .InNamespace("pepr-demo")
  .Reconcile(async instance => {
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
  });
