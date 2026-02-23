# Action: Reconcile - Global Strategy

The Reconcile action provides ordered, asynchronous processing of Kubernetes resource changes. The `global` strategy consolidates all events into one queue, offering maximum ordering guarantees at the cost of throughput.

## When to Use

Use the `global` strategy when you need:
- Strict ordering guarantees across all resources and kinds
- Sequential processing to prevent any race conditions
- Simple coordination across different resource types
- Strong consistency over performance

**Trade-off**: Lower throughput since all events are processed sequentially in a single queue, regardless of resource kind or namespace.

## Code Examples

> **View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-reconcile-global/capabilities/reconcile.ts)**

**Module Configuration in package.json:**
```json
{
  "pepr": {
    "env": {
      "PEPR_RECONCILE_STRATEGY": "global"
    }
  }
}
```

**Reconcile Actions:**
```typescript
When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-reconcile-one")
  .Reconcile(function keepsOrder(cm) {
    const { name } = cm.metadata;

    if (name === "kube-root-ca.crt") {
      return;
    }

    return name === "cm-slow"
      ? slow(cm)
      : name === "cm-fast"
        ? fast(cm)
        : oops(cm);
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-reconcile-one", "hello-pepr-reconcile-two")
  .Reconcile(function keepsOrder(se) {
    const { name } = se.metadata;

    return name === "se-slow"
      ? slow(se)
      : name === "se-fast"
        ? fast(se)
        : oops(se);
  });
```

## Behavior

**With `global` strategy:**
- All ConfigMaps and Secrets share one global queue
- Everything is processed strictly in order
- No parallel processing across any resource types

**Example scenario:**
1. `cm-slow` (ConfigMap) is created → starts processing (500ms)
2. `se-fast` (Secret) is created → waits in global queue
3. `cm-fast` (ConfigMap) is created → waits in global queue
4. `cm-slow` completes → `se-fast` starts processing (300ms)
5. `se-fast` completes → `cm-fast` starts processing (300ms)

**Processing order guarantee:**
- All resources (ConfigMaps, Secrets, everything) are processed in strict FIFO order
- No parallel processing - only one resource is reconciled at a time
- Complete ordering across all resource kinds and namespaces

>[!TIP] Learn more about [Reconcile Queue Configurations](https://docs.pepr.dev/reference/faq/#reconcile-queue-configurations)