# Regex ns bounded

When a Capability defines specific namespaces, `.InNamespaceRegex()` only matches within those bounded namespaces. The regex pattern is applied to the namespace list defined in the Capability, not to all cluster namespaces. This provides both the security of namespace boundaries and the flexibility of pattern matching.

## When to Use

Use `.InNamespaceRegex()` with bounded namespaces for:
- Applying regex patterns within a restricted set of namespaces
- Combining namespace security boundaries with flexible pattern matching
- Multi-tenant environments where capabilities should only operate in specific namespaces
- Matching subsets of namespaces that follow naming patterns within a defined scope

>[!TIP] You can combine `.InNamespaceRegex()` with `.WithNameRegex()` to filter both namespace and resource names for more precise targeting.

## Code Example

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-regex-ns-bounded/capabilities/namespace.ts)

### Match Namespaces Ending with "-alpha"

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/-alpha$/)
  .Mutate(function mutateAlpha(request) {
    request.SetAnnotation("a", "alpha");
  });
```

### Combine Namespace and Resource Name Regex

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/-bravo$/)
  .WithNameRegex(/^two/)
  .Mutate(function mutateBravo(request) {
    request.SetAnnotation("b", "bravo");
  });
```

### Process All Bounded Namespaces

```typescript
When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateCharlie(request) {
    request.SetAnnotation("c", "charlie");
  });
```

>[!TIP] Learn more about [Filters](https://docs.pepr.dev/user-guide/filters/#filters)