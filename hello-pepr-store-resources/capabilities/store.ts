import { Capability, a, Log } from "pepr";

const name = "hello-pepr-store-resources";

export const HelloPeprStoreResources = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When, Store } = HelloPeprStoreResources;

When(a.ConfigMap)
  .IsCreated()
  .WithName("observe")
  .Watch(async function observeWatch() {
    Store.setItem("a", "1");
    Store.setItem("b", "2");
    Store.setItem("c", "3");
    await Store.setItemAndWait("https://observed", "yay");

    Log.info("observed");
  });
