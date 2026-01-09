# Regex ns wrong

Demonstrates incorrect usage where `.InNamespaceRegex()` is used but the regex pattern does not match any of the namespaces defined in the Capability's namespace list. When a Capability defines specific namespaces, `.InNamespaceRegex()` patterns must match at least one namespace in the Capability's list. If the regex pattern does not match any bounded namespaces, the action will never trigger.

This example demonstrates what **not** to do. When using `.InNamespaceRegex()` with bounded namespaces:
- Always verify your regex pattern matches at least one namespace in the Capability's list
- Test your regex patterns before deployment to ensure they match intended namespaces
- Consider using simple namespace filters if exact matching is needed
- Use this pattern as a debugging reference when actions aren't triggering as expected


## Code Example

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-regex-ns-wrong/capabilities/namespace.ts)

### Capability Bound to Specific Namespace

```typescript
export const HelloPeprNamespace = new Capability({
  name: "hello-pepr-namespace",
  description: "hello-pepr-namespace",
  namespaces: ["hello-pepr-namespace"],
});
```

### Regex Pattern That Does Not Match

```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespaceRegex(/^wrong/)
  .Validate(async function validateWrong(request) {
    return request.Approve();
  });
```

#### This action will never trigger because:
1. The Capability is bound to `["hello-pepr-namespace"]`
2. The action uses regex pattern `/^wrong/` which matches namespaces starting with "wrong"
3. The namespace "hello-pepr-namespace" does not start with "wrong", so no match occurs

>[!TIP] Learn more about [Filters](https://docs.pepr.dev/user-guide/filters/#filters)