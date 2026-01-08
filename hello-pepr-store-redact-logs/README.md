# Store Redact Logs

When storing sensitive information like passwords or secrets in the Pepr Store, you should avoid logging the raw values. The Store itself does not automatically redact values in logs. This example shows how to retrieve sensitive data from the Store and transform it before logging to prevent exposing secrets in pod logs.

## Code Example

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-store-redact-logs/capabilities/store.ts)

```typescript
Store.onReady(async () => {
  const [key, val] = ["password", "***SECRET***"];
  Store.clear();
  await Store.setItemAndWait(key, val);
  const value = Store.getItem(key);
  Log.info(
    { password: `${value.replace("SECRET", "DECLASSIFIED")}` },
    "getItem",
  );

  Store.clear();
  await untilTrue(gone(key));
  Log.info("DONE");
});
```
