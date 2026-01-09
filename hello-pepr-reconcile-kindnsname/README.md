# Reconcile Kind ns name

The Reconcile action provides ordered, asynchronous processing of Kubernetes resource changes. The `kindNsName` strategy provides the finest granularity—each individual resource gets its own dedicated processing queue, keyed by kind + namespace + name. This is the **recommended strategy** for most real-world scenarios.

## When to Use

Use the `kindNsName` strategy when you need:
- Maximum throughput with parallel processing
- Ordering guarantees for each individual resource
- Independent processing of different resources
- Optimal performance for production workloads
- Prevention of one resource blocking another

**Trade-off**: Multiple events for the same resource are still processed in order, but different resources can process completely independently for maximum parallelism.

## Code Examples

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-reconcile-kindnsname/capabilities/reconcile.ts)

**Module Configuration in package.json:**
```json
{
  "pepr": {
    "env": {
      "PEPR_RECONCILE_STRATEGY": "kindNsName"
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

**With `kindNsName` strategy (recommended):**
- Each unique resource has its own queue
- `cm-slow` (ConfigMap/ns-one/cm-slow) has its own queue
- `cm-fast` (ConfigMap/ns-one/cm-fast) has its own queue
- `se-slow` (Secret/ns-one/se-slow) has its own queue
- `se-fast` (Secret/ns-two/se-fast) has its own queue
- All four can process in parallel

**Example scenario:**
1. `cm-slow` is created → starts processing immediately (500ms)
2. `cm-fast` is created → starts processing immediately in parallel (300ms)
3. `se-slow` is created → starts processing immediately in parallel (500ms)
4. `se-fast` is created → starts processing immediately in parallel (300ms)
5. All four resources reconcile simultaneously

**Processing order guarantee:**
- Multiple updates to `cm-slow` are processed in order
- Multiple updates to `cm-fast` are processed in order (but independently from `cm-slow`)
- Each resource's events are ordered, but different resources never block each other
- Maximum parallelism with per-resource consistency

>[!TIP] Learn more about [Reconcile Queue Configurations](https://docs.pepr.dev/reference/faq/#reconcile-queue-configurations)