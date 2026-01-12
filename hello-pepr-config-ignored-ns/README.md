# Configuration: Namespace Exclusions

When you configure namespaces in `alwaysIgnore.namespaces`, Pepr will not process any resources in those namespaces for both admission webhooks (mutate/validate) and watch controllers. 
This completely excludes specific namespaces from all Pepr processing.

## When to Use

Use `alwaysIgnore.namespaces` for:
- Completely excluding certain namespaces from all Pepr processing
- System namespaces where you don't want any Pepr intervention
- Namespaces that should bypass all admission control and watch operations
- Reducing processing overhead by ignoring irrelevant namespaces

>[!IMPORTANT] This applies to ALL actions in the module, regardless of capability or filters. 
Both admission webhooks and watch controllers will ignore these namespaces.

## Code Examples

> **View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-config-ignored-ns)**

**Module Configuration in package.json:**
```json
{
  "pepr": {
    "alwaysIgnore": {
      "namespaces": [
        "ignored"
      ]
    }
  }
}
```

**Actions That Will Be Ignored:**
```typescript
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^invisible/)
  .Watch(async cm => {
    await K8s(kind.ConfigMap).Apply({
      metadata: {
        name: cm.metadata.name,
        namespace: cm.metadata.namespace,
        annotations: {
          not: "seen",
        },
      },
      data: {
        "cm-uid": cm.metadata.uid,
      },
    });
  });

When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^invisible/)
  .Mutate(cm => cm.SetAnnotation("not", "seen"));
```

## Behavior

**ConfigMap named "invisible-*" created in "ignored" namespace:**
- Mutate action: NOT called (namespace is in `alwaysIgnore`)
- Watch action: NOT called (namespace is in `alwaysIgnore`)
- Result: ConfigMap is created without any Pepr modifications or annotations

**ConfigMap named "invisible-*" created in any other namespace:**
- Mutate action: CALLED (adds annotation `not: "seen"`)
- Watch action: CALLED (applies annotation `not: "seen"` and data field `cm-uid`)
- Result: ConfigMap gets Pepr modifications

>[!TIP] Learn more about [Configuration](https://docs.pepr.dev/user-guide/customization/#packagejson-configurations-table)