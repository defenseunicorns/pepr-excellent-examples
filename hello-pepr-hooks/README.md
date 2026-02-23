
# Hooks

Pepr actions (Mutate and Validate) automatically translate to Kubernetes admission webhooks. This example demonstrates which webhook types are triggered for different action configurations.

When you define Pepr actions, they automatically register as Kubernetes admission webhooks:
- `Mutate()` actions → MutatingWebhookConfiguration
- `Validate()` actions → ValidatingWebhookConfiguration

## When to Use

Use this pattern when you need to:
- Understand how Pepr actions map to Kubernetes webhooks
- Debug admission webhook configurations
- Verify which webhook types are registered for your module
- Troubleshoot webhook ordering and execution

## Code Examples
>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-hooks/capabilities/hooks.ts)**

**Mutate and Validate:**
Creates both **MutatingWebhook** and **ValidatingWebhook** entries for the same resource.

```typescript
When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Mutate(function mutateMutVal() {});

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("mutate-and-validate")
  .Validate(function validateMutVal(request) {
    return request.Approve();
  });
```

>[!TIP] Learn more about [Pepr Actions](https://docs.pepr.dev/actions/)