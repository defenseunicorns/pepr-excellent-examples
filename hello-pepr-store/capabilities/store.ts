import { Capability, a, Log } from "pepr";
import { untilTrue } from "helpers/src/general";

const name = "hello-pepr-store";

export const HelloPeprStore = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When, Store } = HelloPeprStore;

const found = key => () => Promise.resolve(!!Store.getItem(key));
const gone = key => () => Promise.resolve(!Store.getItem(key));

Store.onReady(async () => {
  const [key, val] = ["https://onReady", "yep"];

  await Store.setItemAndWait(key, val);
  const value = Store.getItem(key);
  Log.info({ key, value }, "onReady");

  Store.clear();
  await untilTrue(gone(key));
  Log.info({ key }, "onReady");
});

When(a.ConfigMap)
  .IsCreated()
  .WithName("async")
  .Watch(async function asyncWatch() {
    const [key, val] = ["https://async", "yep"];

    Store.setItem(key, val);
    await untilTrue(found(key));
    Log.info({ key, value: val }, "setItem");

    const value = Store.getItem(key);
    Log.info({ key, value }, "getItem");

    Store.removeItem(key);
    await untilTrue(gone(key));
    Log.info({ key }, "removeItem");
  });

When(a.ConfigMap)
  .IsCreated()
  .WithName("sync")
  .Watch(async function syncWatch() {
    const [key, val] = ["https://sync", "yep"];

    await Store.setItemAndWait(key, val);
    Log.info({ key, val }, "setItemAndWait");

    const value = Store.getItem(key);
    Log.info({ key, value }, "getItem");

    await Store.removeItemAndWait(key);
    Log.info({ key }, "removeItemAndWait");
  });

When(a.ConfigMap)
  .IsCreated()
  .WithName("observe")
  .Watch(async function observeWatch() {
    const updates = [];
    const unsubscribe = Store.subscribe(data => updates.push(data));

    Store.setItem("a", "1");
    Store.setItem("b", "2");
    Store.setItem("c", "3");
    await Store.setItemAndWait("https://observed", "yay");

    unsubscribe();

    Log.info({ updates }, "observed");
  });
