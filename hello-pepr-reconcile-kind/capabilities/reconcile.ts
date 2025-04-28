import { Capability, Log, a } from "pepr";

export const HelloPeprReconcile = new Capability({
  name: "hello-pepr-reconcile",
  description: "hello-pepr-reconcile",
  namespaces: ["hello-pepr-reconcile"],
});

const { When } = HelloPeprReconcile;

const log = (name, note, tag) => {
  Log.info(`Callback: Reconciling ${name} ${note}${tag}`);
};

const task = (res, durationMs) =>
  new Promise<void>(resolve => {
    const name = res.metadata.name;
    const note = res.kind === "ConfigMap" ? res.data.note : atob(res.data.note);
    log(name, note, "+");
    setTimeout(() => {
      log(name, note, "-");
      resolve();
    }, durationMs);
  });
const fast = res => task(res, 300);
const slow = res => task(res, 500);
const oops = res => {
  throw `oops: ${res}`;
};

When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-reconcile")
  .Reconcile(function keepsOrder(cm) {
    const { name } = cm.metadata;

    if (name === "kube-root-ca.crt") {
      return;
    }

    return name === "cm-slow"
      ? slow(cm)
      : name === "cm-fast"
        ? fast(cm)
        : oops(cm);
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-reconcile")
  .Reconcile(function keepsOrder(se) {
    const { name } = se.metadata;

    return name === "se-slow"
      ? slow(se)
      : name === "se-fast"
        ? fast(se)
        : oops(se);
  });
