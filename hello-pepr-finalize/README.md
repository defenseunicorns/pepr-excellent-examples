# Action: Finalize

Pepr `Finalize()` action runs after a Kubernetes resource is deleted but before it is fully removed. 
Use it to perform any required pre-deletion logic—cleanup external resources, update systems, or gracefully teardown dependent processes.
Finalizers run *after* a delete request but before the object is removed. 

## When should you use Finalize?

- Clean up external resources tied to a Kubernetes object (cloud assets, external systems, files, credentials, etc.).

- Perform teardown steps before the object is permanently removed.

- Ensure that dependent systems are updated or notified upon deletion.

- Delay final resource removal until cleanup is safely completed.

- Implement lightweight cleanup behaviors without writing a full Kubernetes operator.

>[!TIP] `Finalize()` can only be accessed after a `Watch()` or `Reconcile()`

## Code Snippet Examples

This example registers a finalizer on a Deployment and performs cleanup when the resource is deleted.

>**View full example on [GitHub](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-finalize/capabilities/finalize.ts)**

### Create Event
```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-finalize-create")
  .WithName("cm-reconcile-create")
  .Reconcile(function reconcileCreate(cm) {
    Log.info(cm, "external api call (create): reconcile/callback");
  })
  .Finalize(function finalizeCreate(cm) {
    Log.info(cm, "external api call (create): reconcile/finalize");
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","metadata":<ConfigMap object>,"msg":"external api call (create): reconcile/callback"}

{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","metadata":<ConfigMap object>,"msg":"external api call (create): reconcile/finalize"}
```
**Note:** The log includes the full ConfigMap object that triggered the action, making it useful for debugging which specific resource was reconciled or finalized.

### Create or Update Event
```typescript
When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-finalize-createorupdate")
  .WithName("cm-watch-createorupdate")
  .Watch(function watchCreateOrUpdate(cm) {
    if (cm.metadata?.deletionTimestamp) {
      return;
    }

    Log.info(cm, "external api call (createorupdate): watch/callback");
  })
  .Finalize(function finalizeCreateOrUpdate(cm) {
    Log.info(cm, "external api call (createorupdate): watch/finalize");
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (createorupdate): watch/callback"}

 {"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (createorupdate): watch/finalize"}
```
**Note:** The log includes the full ConfigMap object that triggered the action, making it useful for debugging which specific resource was reconciled or finalized.

### Update Event
```typescript
When(a.ConfigMap)
  .IsUpdated()
  .InNamespace("hello-pepr-finalize-update")
  .WithName("cm-watch-update")
  .Watch(function watchUpdate(cm) {
    // delete with finalizer triggers an UPDATE to add deletionTimestamp; ignore it
    if (cm.metadata?.deletionTimestamp) {
      return;
    }

    Log.info(cm, "external api call (update): watch/callback");
  })
  .Finalize(function finalizeUpdate(cm) {
    Log.info(cm, "external api call (update): watch/finalize");
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr--watcher-","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (update): watch/callback"}

{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (update): watch/finalize"}
```
### Update Opt Out Event
```typescript
When(a.ConfigMap)
  .IsUpdated()
  .InNamespace("hello-pepr-finalize-update-opt-out")
  .WithName("cm-watch-update-opt-out")
  .Watch(function watchUpdateOptOut(cm) {
    // delete with finalizer triggers an UPDATE to add deletionTimestamp; ignore it
    if (cm.metadata?.deletionTimestamp) {
      return;
    }

    Log.info(cm, "external api call (update-opt-out): watch/callback");
  })
  .Finalize(function finalizeUpdateOptOut(cm) {
    Log.info(cm, "external api call (update-opt-out): watch/pre-finalize");
    return false;
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (update-opt-out): watch/callback"}

{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (update-opt-out): watch/pre-finalize"}
```
### Delete Event
```typescript
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
    Log.info(cm, "external api call (delete): watch/callback");
  })
  .Finalize(function finalizeDelete(cm) {
    Log.info(cm, "external api call (delete): watch/finalize");
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (delete): watch/finalize"}

{"level":30,"time":<timestamp>:,"pid":<pid>,"hostname":"pepr-<hostname>-watcher-<hostname>","kind":"ConfigMap","apiVersion":"v1","metadata":<ConfigMap object>,"msg":"external api call (delete): watch/callback"}

```

>[!TIP] Learn more about the [Finalize action](https://docs.pepr.dev/actions/finalize/)