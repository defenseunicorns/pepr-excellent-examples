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
  .Watch(function createApi(cm) {
    Log.info(cm)
    Log.info("TODO: external (mock) api call: create")
  })
  .Finalize(function deleteApi(cm) {
    Log.info(cm)
    Log.info("TODO: external (mock) api call: create")
  });
