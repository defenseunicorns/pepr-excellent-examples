# Store: Persistent Key-Value Storage
Pepr `Store` is a built-in key-value storage mechanism that persists and shares data within the cluster. 
It solves the challenge of sharing data between different actions (Mutate, Validate, and Watch) without manually creating and managing Kubernetes resources.

The Store is backed by a single Custom Resource Definition (CRD) per Pepr Module, automatically created at deployment. 
Data is shared automatically across all replicas of the admission and watch controllers..

## When should you use Store?

Use `Store` when you need to share data between admission controllers and watch operations. 
The Store provides:

- Asynchronous key-value storage backed by Kubernetes Custom Resources
- Data persistence that survives pod restarts
- Multiple operation modes: async (`setItem`/`removeItem`) and sync (`setItemAndWait`/`removeItemAndWait`)
- Reactive updates through `subscribe()` for monitoring store changes
- Initialization hooks via `onReady()` for setup before watches begin processing

## Code Snippet Examples

This example demonstrates the core Store API patterns: initialization in `onReady`, asynchronous operations, and synchronous operations with guaranteed persistence.

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-store/capabilities/store.ts)

### Store Initialization

```typescript
Store.onReady(async () => {
  const [key, val] = ["https://onReady", "yep"];
  // Ensure Store.clear() in an empty store creates no errors
  Store.clear();
  await Store.setItemAndWait(key, val);
  // Ensure you can set the same key again
  await Store.setItemAndWait(key, val);
  const value = Store.getItem(key);
  Log.info({ key, value }, "onReady");

  Store.clear();
  await untilTrue(gone(key));
  Log.info({ key }, "onReady");
});
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://onReady","value":"yep","msg":"onReady"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://onReady","msg":"onReady"}
```

### Asynchronous Store Operations

```typescript
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
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://async","value":"yep","msg":"setItem"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://async","value":"yep","msg":"getItem"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://async","msg":"removeItem"}
```

### Synchronous Store Operations

```typescript
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
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://sync","val":"yep","msg":"setItemAndWait"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://sync","value":"yep","msg":"getItem"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","key":"https://sync","msg":"removeItemAndWait"}
```
