# Namespace: Bounded

When a capability defines specific namespaces like `namespaces: ["alpha", "bravo"]`, the module only processes resources in those namespaces. 
This provides an important security boundary, ensuring actions only trigger within the defined namespace scope.

## When to Use

Use bounded namespaces for:
- Security-sensitive operations that should only affect specific namespaces
- Multi-tenant environments where capabilities must be isolated to certain tenants
- Development/staging/production namespace separation
- Limiting the blast radius of mutations or validations

**Important**: All actions within the capability, even those without `.InNamespace()` filters, will only trigger for resources in the bounded namespaces. 
You can use `.InNamespace()` to further filter within those bounds.


## Code Example

>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-ns-bounded/capabilities/namespace.ts)**

### Filter for Alpha Namespace

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace(alpha)
  .Mutate(function mutateAlpha(request) {
    request.SetAnnotation("a", "alpha");
  });
```

### Filter for Bravo Namespace

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace(bravo)
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

>[!TIP]Learn more about [Pepr Filters](https://docs.pepr.dev/user-guide/filters)
