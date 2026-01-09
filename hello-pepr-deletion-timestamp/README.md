# Deletion Timestamp

The `WithDeletionTimestamp()` filter targets Kubernetes resources that are in the process of being deleted.
When a Kubernetes resource is deleted, it may not be removed immediately if it has [finalizers](https://docs.pepr.dev/actions/finalize). 
During this time, the resource has a `deletionTimestamp` set in its metadata. 
The `WithDeletionTimestamp()` filter allows you to target resources in this state.

## When to Use `WithDeletionTimestamp()`

Use `WithDeletionTimestamp()` when you need to:
- Implement custom cleanup logic before resource deletion
- Work with finalizers that require additional processing
- Monitor or log resources entering deletion state
- Perform validation or mutation on resources being deleted (during UPDATE events)

## Important Notes

**Admission Controllers (Mutate/Validate):**
- `WithDeletionTimestamp()` does **not** work with with `.IsDeleted()` through `Mutate` or `Validate` because the Kubernetes Admission Process does not fire the DELETE event with a deletion timestamp.
- `WithDeletionTimestamp()` **will** match on `.IsUpdated()` events during Admission when pending-deletion changes occur (like removing a finalizer).

**Watch Controllers:**
- `WithDeletionTimestamp()` works with both `.IsUpdated()` and `.IsDeleted()` events
- Watch actions can observe the full deletion lifecycle including the final DELETE event

## Code Examples

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-deletion-timestamp/capabilities/deletion.ts)

### Admission Controller (Mutate)

Triggers when a Pod is updated and has a deletion timestamp (e.g., when finalizers are being removed):
```typescript
When(a.Pod)
  .IsUpdated()
  .InNamespace(namespace1)
  .WithName("ns1-admission")
  .WithDeletionTimestamp()
  .Mutate(po => {
    logSeen(po.Raw.metadata.name);
  });
```

#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"DTS: Saw a pod ns1-admission."}
```

### Watch Controller

Monitors Pods with deletion timestamps in the Watch controller:
```typescript
When(a.Pod)
  .IsUpdated()
  .InNamespace(namespace1)
  .WithName("ns1-watch")
  .WithDeletionTimestamp()
  .Watch(po => logSeen(po.metadata.name));
```

#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-watcher-<hostname>","msg":"DTS: Saw a pod ns1-watch."}
```

### Watch Controller with Delete Event

Responds to Pod deletion events that have deletion timestamps (Watch only):
```typescript
When(a.Pod)
  .IsDeleted()
  .InNamespace(namespace2)
  .WithName("ns2-delete")
  .WithDeletionTimestamp()
  .Watch(po => logSeen(po.metadata.name));
```

#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-watcher-<hostname>","msg":"DTS: Saw a pod ns2-delete."}
```

### Complete Finalizer Workflow

This example shows the complete lifecycle: creating a finalizer, deleting the pod, and removing the finalizer:
```typescript
When(a.Pod)
  .IsCreated()
  .InNamespace(namespace1)
  .WithName("ns1-admission")
  .Watch(async po => {
    await addFinalizer(po.metadata.name);
    await deleteObj(po);
    await removeFinalizer(po.metadata.name);
  });
```

>[!TIP] Learn more about [Pepr Filters](https://docs.pepr.dev/user-guide/filters/)