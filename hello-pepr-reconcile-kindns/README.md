# Reconcile Kind ns

The Reconcile action provides ordered, asynchronous processing of Kubernetes resource changes. The `kindNs` strategy creates one queue per kind within each namespace, allowing resources in different namespaces to be processed in parallel while maintaining order within each kind-namespace combination.

## When to Use

Use the `kindNs` strategy when you need:
- Ordering guarantees within each kind per namespace
- Parallel processing across namespaces
- Isolation between namespace workloads
- Multi-tenant environments where namespace isolation is important

**Trade-off**: Resources of the same kind in the same namespace share a queue, but different namespaces can process independently in parallel.

## Code Examples

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-reconcile-kindns/capabilities/reconcile.ts)

**Module Configuration in package.json:**
```json
{
  "pepr": {
    "env": {
      "PEPR_RECONCILE_STRATEGY": "kindNs"
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

**With `kindNs` strategy:**
- ConfigMaps in `hello-pepr-reconcile-one` have their own queue
- Secrets in `hello-pepr-reconcile-one` have their own queue
- Secrets in `hello-pepr-reconcile-two` have their own queue
- All three queues can process in parallel

**Example scenario:**
1. `cm-slow` (ConfigMap in ns-one) is created → starts processing (500ms)
2. `se-slow` (Secret in ns-one) is created → starts processing in parallel (500ms, different queue)
3. `se-fast` (Secret in ns-two) is created → starts processing in parallel (300ms, different namespace queue)
4. All three process simultaneously

**Processing order guarantee:**
- ConfigMaps in `hello-pepr-reconcile-one` are processed in order
- Secrets in `hello-pepr-reconcile-one` are processed in order (independently from ConfigMaps)
- Secrets in `hello-pepr-reconcile-two` are processed in order (independently from ns-one)
- Namespace boundaries provide natural parallelization

>[!TIP] Learn more about [Reconcile Queue Configurations](https://docs.pepr.dev/reference/faq/#reconcile-queue-configurations)