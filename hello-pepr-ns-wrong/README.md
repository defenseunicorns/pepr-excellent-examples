# Namespace: Filter Mismatch

When a Capability defines specific namespaces, actions cannot use `.InNamespace()` with namespaces outside that list. The action will never trigger because the namespace filter references a namespace the Capability is not bound to.

This example demonstrates what **not** to do. When using `.InNamespace()` with bounded namespaces:
- Always verify the namespace in your `.InNamespace()` filter exists in the Capability's namespace list
- Double-check your Capability's `namespaces` array includes all namespaces you're filtering for
- Use `namespaces: []` if you need to operate across all cluster namespaces
- Use this pattern as a debugging reference when actions aren't triggering as expected

Always ensure `.InNamespace()` filters reference namespaces that are either in the Capability's namespace list or use `namespaces: []` to allow all namespaces.

## Code Example

>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-ns-wrong/capabilities/namespace.ts)**

### Capability Bound to Specific Namespace

```typescript
export const HelloPeprNamespace = new Capability({
  name: "hello-pepr-namespace",
  description: "hello-pepr-namespace",
  namespaces: ["hello-pepr-namespace"],
});
```

### Action Using Wrong Namespace

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace("wrong")
  .Validate(async function validateWrong(request) {
    return request.Approve();
  });
```

#### This action will never trigger because:
1. The Capability is bound to `["hello-pepr-namespace"]`
2. The action tries to filter for namespace `"wrong"`
3. Since `"wrong"` is not in the Capability's namespace list, this action can never process any resources

>[!TIP] Learn more about [Pepr Filters](https://docs.pepr.dev/user-guide/filters)