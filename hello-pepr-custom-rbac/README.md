# Custom RBAC Configuration

Pepr modules can be configured with scoped RBAC permissions that follow the principle of least privilege instead of using cluster-admin access.

By default, Pepr modules use admin RBAC mode which grants full cluster access. This example shows how to configure custom, scoped RBAC permissions that follow the principle of least privilege.

## RBAC Modes

Pepr supports two RBAC modes:

**Admin Mode (default):**
```bash
npx pepr build --rbac-mode admin
```
Grants full cluster-admin permissions. Use only for development or when necessary.

**Scoped Mode (recommended):**
```bash
npx pepr build --rbac-mode scoped
```
Grants only the permissions needed for specific actions. This example uses scoped mode with custom ClusterRole definitions.

## When to Use

Use scoped RBAC mode when you need to:
- Follow the principle of least privilege in production environments
- Restrict Pepr module permissions to specific resources and operations
- Comply with security policies that prohibit cluster-admin access
- Audit and control exactly which Kubernetes resources a module can access
- Deploy multiple Pepr modules with different permission requirements

## Code Examples

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-custom-rbac/capabilities/rbac.ts)

This module demonstrates various Pepr features requiring different RBAC permissions:

### Watch Action with K8s SSA
```typescript
When(a.Namespace)
  .IsCreated()
  .WithName("pepr-demo-2")
  .Watch(async ns => {
    Log.info("Namespace pepr-demo-2 was created.");

    try {
      // Apply the ConfigMap using K8s server-side apply
      await K8s(kind.ConfigMap).Apply({
        metadata: {
          name: "pepr-ssa-demo",
          namespace: "pepr-demo-2",
        },
        data: {
          "ns-uid": ns.metadata.uid,
        },
      });
    } catch (error) {
      // You can use the Log object to log messages to the Pepr controller pod
      Log.error(error, "Failed to apply ConfigMap using server-side apply.");
    }

    // You can share data between actions using the Store, including between different types of actions
    Store.setItem("watch-data", "This data was stored by a Watch Action.");
  });
```
#### Example pod log output (success):
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-watcher-<hostname>","msg":"Namespace pepr-demo-2 was created."}
```

### Simple Mutate Action
```typescript
When(a.ConfigMap)
  .IsCreated()
  .Validate(request => {
    if (request.HasAnnotation("evil")) {
      return request.Deny("No evil CM annotations allowed.", 400);
    }

    return request.Approve();
  });

```
#### Example pod log output (approved):
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"ConfigMap approved"}
```

### Mutate & Validate Actions
```typescript
When(a.ConfigMap)
  .IsCreated()
  .WithName("example-2")
  .Mutate(request => {
    // This Mutate Action will mutate the request before it is persisted to the cluster
    // Use `request.Merge()` to merge the new data with the existing data
    request.Merge({
      metadata: {
        labels: {
          pepr: "was-here",
        },
        annotations: {
          "pepr.dev": "annotations-work-too",
        },
      },
    });
  })
  .Validate(request => {
    // This Validate Action will validate the request before it is persisted to the cluster
    // Approve the request if the ConfigMap has the label 'pepr'
    if (request.HasLabel("pepr")) {
      return request.Approve();
    }

    // Otherwise, deny the request with an error message (optional)
    return request.Deny("ConfigMap must have label 'pepr'");
  })
  .Watch((cm, phase) => {
    // This Watch Action will watch the ConfigMap after it has been persisted to the cluster
    Log.info(cm, `ConfigMap was ${phase} with the name example-2`);
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-watcher-<hostname>","msg":"ConfigMap was ADDED with the name example-2"}
```

>[!TIP] Learn more about [RBAC Configuration](https://docs.pepr.dev/user-guide/rbac/)
