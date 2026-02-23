# Store: Resources

Pepr Store is backed by Kubernetes Custom Resources that can be accessed directly as `PeprStore` objects. 
Behind the scenes, the Pepr Store API (`Store.setItem()`, `Store.getItem()`, etc.) uses a Custom Resource Definition called `PeprStore` to persist data in the cluster. 
This example demonstrates how Store operations create and update PeprStore resources in Kubernetes.

## Key Points

- All Store operations for a capability are persisted in a single PeprStore CRD
- The PeprStore resource lives in the `pepr-system` namespace
- Store keys can include special characters like `://` (e.g., URLs)
- Store data is stored as key-value string pairs in the `data` field
- Store updates are batched and sent to the Kubernetes API at 5-second intervals
- The Store is eventually consistent, backed by etcd through Kubernetes

## When to Use

Use this pattern when you need to:
- Inspect Store data directly using kubectl for debugging
- Understand how Store operations map to Kubernetes resources
- Verify that Store data is being persisted correctly
- Access Store data from outside your Pepr module
- Troubleshoot Store-related issues by examining the underlying CRD

## Code Example

>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-store-resources/capabilities/store.ts)**

```typescript
When(a.ConfigMap)
  .IsCreated()
  .WithName("observe")
  .Watch(async function observeWatch() {
    Store.setItem("a", "1");
    Store.setItem("b", "2");
    Store.setItem("c", "3");
    await Store.setItemAndWait("https://observed", "yay");
    Log.info("observed");
  });
```

#### Example pod log output:
```json
{"level":30,"time":1726798504518,"pid":16,"hostname":"pepr-watcher-6dc69654c9-5ql6b","msg":"observed"}
```

## Viewing the PeprStore Resource

You can inspect the PeprStore Custom Resources using kubectl:
```bash
# List all PeprStore resources
kubectl get peprstores -n pepr-system

# Get detailed YAML output for a specific store
kubectl get peprstore <store-name> -n pepr-system -o yaml
```

### Example PeprStore YAML:

After the Store operations execute, the PeprStore resource will contain:
```yaml
apiVersion: pepr.dev/v1
kind: PeprStore
metadata:
  name: pepr-<module-uuid>-store-hello-pepr-store-resources
  namespace: pepr-system
data:
  a: "1"
  b: "2"
  c: "3"
  https://observed: "yay"
```
>[!TIP] Learn more about the [Pepr Store](https://docs.pepr.dev/user-guide/store/)