import { Capability, a, Log } from "pepr";
import { untilTrue } from "helpers/src/general";

const name = "hello-pepr-store";
const ssoURL = "sso-client-http://bin";
export const HelloPeprStore = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When, Store } = HelloPeprStore;

const found = key => () => Promise.resolve(!!Store.getItem(key));
const gone = key => () => Promise.resolve(!Store.getItem(key));

Store.onReady(async () => {
  const [key, val] = ["onReady", "yep"];
  const [key2, val2] = [ssoURL, "yep2"];

  await Store.setItemAndWait(key, val);
  let value = Store.getItem(key);
  Log.info({ key, value }, "onReady");

  await Store.setItemAndWait(key2, val2);
  let value2 = Store.getItem(key2);
  if (value2 === val2) {
    Log.info({ key2, value2 }, "onReady2");
  }

  Store.clear();
  await untilTrue(gone(key));
  await untilTrue(gone(key2));
  value = Store.getItem(key);
  value2 = Store.getItem(key2);
  Log.info({ key, value }, "onReady");
  if (value2 !== val2) {
    Log.info({ key2, value2 }, "onReady2");
  }

  Log.info("DONE!")
});

When(a.ConfigMap)
  .IsCreated()
  .WithName("async")
  .Watch(async function asyncWatch() {
    const [key, val] = ["async", "yep"];
    const [key2, val2] = [`async-${ssoURL}`, "yep2"];

    Store.setItem(key, val);
    await untilTrue(found(key));
    Log.info({ key, val }, "setItem");

    Store.setItem(key2, val2);
    await untilTrue(found(key2));
    Log.info({ key2, val2 }, "setItem2");

    const value = Store.getItem(key);
    Log.info({ key, value }, "getItem");

    const value2 = Store.getItem(key2);
    if (value2 === val2) {
      Log.info({ key2, value2 }, "getItem2");
    }

    Store.removeItem(key);
    await untilTrue(gone(key));
    Log.info({ key }, "removeItem");

    Store.removeItem(key2);
    await untilTrue(gone(key2));
    const updatedValue2 = Store.getItem(key2);
    if (updatedValue2 !== val2) {
      Log.info({ key2 }, "removeItem2");
    }
  });

When(a.ConfigMap)
  .IsCreated()
  .WithName("sync")
  .Watch(async function syncWatch() {
    const [key, val] = ["sync", "yep"];
    const [key2, val2] = [`sync-${ssoURL}`, "yep2"];

    await Store.setItemAndWait(key, val);
    Log.info({ key, val }, "setItemAndWait");
    await Store.setItemAndWait(key2, val2);
    Log.info({ key2, val2 }, "setItemAndWait2");

    const value = Store.getItem(key);
    Log.info({ key, value }, "getItem");
    const value2 = Store.getItem(key2);
    if (value2 === val2) {
      Log.info({ key2, value2 }, "getItem2");
    }

    await Store.removeItemAndWait(key);
    Log.info({ key }, "removeItemAndWait");
    await Store.removeItemAndWait(key2);
    const updatedValue2 = Store.getItem(key2);
    if (updatedValue2 !== val2) {
      Log.info({ key2 }, "removeItemAndWait2");
    }
  });

When(a.ConfigMap)
  .IsCreated()
  .WithName("observe")
  .Watch(async function observeWatch() {
    const key = `observed-${ssoURL}`;
    const updates = [];
    const unsubscribe = Store.subscribe(data => updates.push(data));

    Store.setItem("a", "1");
    Store.setItem("b", "2");
    Store.setItem("c", "3");
    await Store.setItemAndWait("observed", "yay");
    await Store.setItemAndWait(key, "asd-123-xyz");
    const item = Store.getItem(key);
    if (item == "asd-123-xyz") {
      Log.info({ item }, "got correct item");
    }

    unsubscribe();


    Log.info({ updates }, "final-observed");

  });
