import { Capability, Log, a } from "pepr";

export const HelloPeprFinalize = new Capability({
  name: "hello-pepr-finalize",
  description: "hello-pepr-finalize",
  namespaces: ["hello-pepr-finalize"],
});

const { When } = HelloPeprFinalize;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-finalize")
  .WithName("cm-watch")
  .Watch(function createApi(cm) {
    Log.info(cm, "external api call: watch/create")
  })
  .Finalize(function deleteApi(cm) {
    Log.info(cm, "external api call: watch/delete")
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-finalize")
  .WithName("cm-reconcile")
  .Reconcile(function createApi(cm) {
    Log.info(cm, "external api call: reconcile/create")
  })
  .Finalize(function deleteApi(cm) {
    Log.info(cm, "external api call: reconcile/delete")
  });

  //TODO:
  // When(a.ConfigMap)
  // .IsCreatedOrUpdated()

  // When(a.ConfigMap)
  // .IsUpdated()

  // When(a.ConfigMap)
  // .IsDeleted()