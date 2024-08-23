import { Capability, Log, a } from "pepr";

export const HelloPeprReconcile = new Capability({
  name: "hello-pepr-reconcile",
  description: "A Kubernetes Operator that manages WebApps",
  namespaces: ["hello-pepr-reconcile"],
});

const { When } = HelloPeprReconcile;

const log = (name, note, tag) => {
  Log.info(`Callback: Reconciling ${name} ${note}${tag}`);
}

const task = (cm, durationMs) => new Promise<void>(resolve => {
  const name = cm.metadata.name
  const note = cm.data.note
  log(name, note, "+")
  setTimeout(() => { log(name, note, "-") ; resolve() }, durationMs)
});
const fast = (cm) => task(cm, 300)
const slow = (cm) => task(cm, 500)
const oops = (cm) => { throw `oops: ${cm}` }

When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-reconcile")
  .Reconcile(function keepsOrder(cm) {
    const { name } = cm.metadata;

    if (name === "kube-root-ca.crt") { return }

    return (
      name === "cm-slow" ? slow(cm) :
      name === "cm-fast" ? fast(cm) :
      oops(cm)
    )
  });
