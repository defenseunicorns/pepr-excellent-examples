# Filter: Namespace Name Patterns

When a Capability defines `namespaces: []`, you can use `.InNamespaceRegex()` to match namespace names using regular expressions. This is useful for filtering namespaces by naming patterns without explicitly listing them.

## When to Use `.InNamespaceRegex()`

- Matching namespaces based on naming conventions or patterns
- Applying policies across multiple namespaces that follow a naming standard
- Filtering namespaces without explicitly listing each one
- Enforcing governance on dynamically created namespaces

**Important**: This filter matches namespace names, not resource names. To match resource names, see [regex name](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-regex-name/README.md). The Capability must define `namespaces: []` to enable cluster-wide namespace matching with regex patterns.


## Code Example

>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-regex-ns-all/capabilities/namespace.ts)**

### Match Namespaces Starting with "default"

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/^default/)
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });
```

### Match Namespaces Ending with "-ns-all"

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/-ns-all$/)
  .Watch(async cm => {
    await K8s(kind.ConfigMap).Apply({
      metadata: {
        name: cm.metadata.name,
        namespace: cm.metadata.namespace,
        annotations: {
          ns: "seen",
        },
      },
      data: {
        "cm-uid": cm.metadata.uid,
      },
    });
  });
```

### Process All Namespaces Without Filter

```typescript
When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateNon(request) {
    request.SetAnnotation("non", "seen");
  });
```

>[!TIP] Learn more about [Filters](https://docs.pepr.dev/user-guide/filters/#filters)