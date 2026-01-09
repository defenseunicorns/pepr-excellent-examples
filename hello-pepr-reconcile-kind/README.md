# Reconcile Kind

The Reconcile action provides ordered, asynchronous processing of Kubernetes resource changes. The `kind` strategy creates one queue per resource kind (e.g., all ConfigMaps share one queue, all Secrets share another), allowing different kinds to be processed in parallel while maintaining order within each kind.

## When to Use

Use the `kind` strategy when you need:
- Ordering guarantees within each resource type
- Parallel processing across different resource kinds
- Balance between throughput and ordering
- Simpler queue management (default behavior)

**Trade-off**: All instances of the same kind share a queue, so high activity on one resource can delay processing of other resources of the same kind.

## Code Examples

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-reconcile-kind/capabilities/reconcile.ts)

**Module Configuration in package.json:**
```json
{
  "pepr": {
    "env": {
      "PEPR_RECONCILE_STRATEGY": "kind"
    }
  }
}
```

**Reconcile Actions:**
```typescript
When(a.ConfigMap)
  .IsCreatedOrUpdated()
  .InNamespace("hello-pepr-reconcile")
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
  .InNamespace("hello-pepr-reconcile")
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

**With `kind` strategy:**
- All ConfigMaps are processed in one queue (in order)
- All Secrets are processed in a separate queue (in order)
- ConfigMaps and Secrets can be processed in parallel

**Example scenario:**
1. `cm-slow` is created → starts processing (500ms)
2. `cm-fast` is created → waits in ConfigMap queue
3. `se-slow` is created → starts processing in parallel (500ms, separate Secret queue)
4. `cm-slow` completes → `cm-fast` starts processing

**Processing order guarantee:**
- ConfigMaps are always processed in the order they were received
- Secrets are always processed in the order they were received
- But ConfigMaps and Secrets process independently

>[!TIP] Learn more about [Reconcile Queue Configurations](https://docs.pepr.dev/reference/faq/#reconcile-queue-configurations)
