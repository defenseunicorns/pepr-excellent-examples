# Configuration: Controller-Specific Namespace Exclusions

Controller-specific namespace ignoring provides fine-grained control over which controllers process resources in specific namespaces. 
While `alwaysIgnore.namespaces` excludes namespaces from ALL Pepr processing, you can configure controller-specific ignores to exclude namespaces from only admission webhooks or only watch controllers.

## When to Use

Use controller-specific namespace ignoring for:
- Allowing admission control (Mutate/Validate) without watch processing
- Allowing watch processing without admission control
- Fine-grained control over namespace processing per controller type
- Separating concerns between admission and watch behaviors

## Configuration Options

- **`admission.alwaysIgnore.namespaces`** - Excludes namespaces from admission webhooks (Mutate/Validate) only
- **`watch.alwaysIgnore.namespaces`** - Excludes namespaces from watch controllers only

## Code Examples

> **View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-config-ignored-controller-ns)**

**Module Configuration in package.json:**
```json
{
  "pepr": {
    "admission": {
      "alwaysIgnore": {
        "namespaces": ["mutate-ignored"]
      }
    },
    "watch": {
      "alwaysIgnore": {
        "namespaces": ["watch-ignored"]
      }
    }
  }
}
```

**Admission and Watch Actions:**
```typescript
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^mutate-ignored/)
  .Mutate(po => po.SetLabel("not", "seen"));

When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^mutate-ignored/)
  .Watch(async cm => {
    await K8s(kind.ConfigMap).Apply({
      metadata: {
        name: cm.metadata.name,
        namespace: cm.metadata.namespace,
        annotations: {
          been: "seen",
        },
      },
      data: {
        "cm-uid": cm.metadata.uid,
      },
    });
  });
```

## Behavior

**Admission Ignore (`mutate-ignored` namespace):**
- Mutate actions: NOT called
- Watch actions: CALLED

**Watch Ignore (`watch-ignored` namespace):**
- Mutate actions: CALLED
- Watch actions: NOT called

>[!TIP] Learn more about [Configuration](https://docs.pepr.dev/user-guide/customization/#packagejson-configurations-table)