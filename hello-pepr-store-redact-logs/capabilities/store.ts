import { Capability, a, Log } from "pepr";
import { untilTrue } from "helpers/src/general";

const name = "hello-pepr-store-redact-logs";

export const HelloPeprStoreRedactLogs = new Capability({
  name: name,
  description: "Pepr feature: Store Redact Values in Logs"
});
const { Store } = HelloPeprStoreRedactLogs;

const gone = key => () => Promise.resolve(!Store.getItem(key));

Store.onReady(async () => {
  const [key, val] = ["password", "***SECRET***"];
  Store.clear();
  await Store.setItemAndWait(key, val);
  const value = Store.getItem(key);
  Log.info({ password: `${value.replace("SECRET","DECLASSIFIED")}` }, "getItem");

  Store.clear();
  await untilTrue(gone(key));
  Log.info("DONE");
});
