import { Capability, Log, a } from "pepr";

export const HelloPeprAlias = new Capability({
  name: "hello-pepr-alias",
  description: "hello-pepr-alias",
  namespaces: [
    "hello-pepr-finalize-create",
    "hello-pepr-finalize-createorupdate",
    "hello-pepr-finalize-update",
    "hello-pepr-finalize-delete",
  ],
});

const { When } = HelloPeprAlias;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-finalize-create")
  .WithName("cm-reconcile-create")
  .Reconcile(function reconcileCreate(cm) {
    Log.info(cm, "external api call (create): reconcile/callback")
  })
  .Finalize(function finalizeCreate(cm) {
    Log.info(cm, "external api call (create): reconcile/finalize")
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-finalize-create")
  .WithName("cm-watch-create")
  .Watch(function watchCreate(cm) {
    Log.info(cm, "external api call (create): watch/callback")
  })
  .Finalize(function finalizeCreate(cm) {
    Log.info(cm, "external api call (create): watch/finalize")
  });

When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-finalize-createorupdate")
  .WithName("cm-watch-createorupdate")
  .Watch(function watchCreateOrUpdate(cm) {
    // delete with finalizer causes an UPDATE with deletionTimestamp; ignore it
    if (cm.metadata?.deletionTimestamp) { return }

    Log.info(cm, "external api call (createorupdate): watch/callback")
  })
  .Finalize(function finalizeCreateOrUpdate(cm) {
    Log.info(cm, "external api call (createorupdate): watch/finalize")
  });

When(a.ConfigMap)
  .IsUpdated()
  .InNamespace("hello-pepr-finalize-update")
  .WithName("cm-watch-update")
  .Watch(function watchUpdate(cm) {
    // delete with finalizer triggers an UPDATE to add deletionTimestamp; ignore it
    if (cm.metadata?.deletionTimestamp) { return }

    Log.info(cm, "external api call (update): watch/callback")
  })
  .Finalize(function finalizeUpdate(cm) {
    Log.info(cm, "external api call (update): watch/finalize")
  });

  When(a.ConfigMap)
  .IsDeleted()
  .InNamespace("hello-pepr-finalize-delete")
  .WithName("cm-watch-delete")
  .Watch(function watchDelete(cm) {
    // Here be dragons!
    //
    // Due to the way kubernetes finalizers work, this deletion callback will fire
    //  AFTER the finalizer callback fires -- be sure to expect & code for this!
    //  (see: https://kubernetes.io/docs/concepts/overview/working-with-objects/finalizers/#how-finalizers-work )
    Log.info(cm, "external api call (delete): watch/callback")
  })
  .Finalize(function finalizeDelete(cm) {
    Log.info(cm, "external api call (delete): watch/finalize")
  });
