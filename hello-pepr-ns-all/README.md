# Namespace: Cluster-Wide Binding

When a Capability defines `namespaces: []`, the module can process resources in any namespace cluster-wide. You can use `.InNamespace()` to filter for specific namespaces, or omit namespace filters entirely to process all namespaces.

## When to Use

Use `namespaces: []` for:
- Cluster-wide policies that need to apply everywhere
- Platform-level capabilities that monitor or modify resources across all namespaces
- Cross-namespace operations and reporting
- Dynamic environments where namespaces are frequently created and destroyed

**Important**: With `namespaces: []`, you have maximum flexibility but also maximum scope. Use `.InNamespace()` filters when you need to target specific namespaces to limit the scope of your actions.

## Code Example

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-ns-all/capabilities/namespace.ts)

### Filter for Specific Namespace

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace("default")
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });
```

### Process All Namespaces

```typescript
When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateNon(request) {
    request.SetAnnotation("non", "seen");
  });
```

>[!TIP] Learn more about [Pepr Filters](https://docs.pepr.dev/user-guide/filters)
