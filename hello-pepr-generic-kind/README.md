# Generic Kind

`GenericKind` is the base class for working with any Kubernetes resource without requiring generated types. 
When working with Custom Resources (CRDs) that don't have pre-generated TypeScript types, you can use `a.GenericKind` with the resource's GVK (Group, Version, Kind) to create Pepr actions. 
This is especially useful for quick iteration or when type definitions aren't available yet.

## When to Use

Use `GenericKind` when:
- Working with CRDs without TypeScript types
- Testing CRDs during development
- Handling dynamic or third-party Custom Resources

For production use with well-defined CRDs, consider generating TypeScript types using `kubernetes-fluent-client` for better type safety.

## Code Example

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-generic-kind/capabilities/genericKind.ts)

```typescript
When(a.GenericKind, {
  group: "pepr.dev",
  version: "v1",
  kind: "Unicorn",
})
  .IsCreated()
  .WithName("create")
  .Mutate(() => {
    Log.info("GenericKind created and mutated");
  })
  .Validate(instance => {
    Log.info("GenericKind created and validated");
    return instance.Approve();
  })
  .Watch(() => {
    Log.info("GenericKind created and watched");
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"GenericKind deleted mutated"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"GenericKind deleted validated"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-watcher-<hostname>","msg":"GenericKind deleted watched"}
```

```typescript
When(a.GenericKind, {
  group: "pepr.dev",
  version: "v1",
  kind: "Unicorn",
})
  .IsDeleted()
  .WithName("delete")
  .Mutate(() => {
    Log.info("GenericKind deleted mutated");
  })
  .Validate(instance => {
    Log.info("GenericKind deleted validated");
    return instance.Approve();
  })
  .Watch(() => {
    Log.info("GenericKind deleted watched");
  });
```
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"GenericKind deleted mutated"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"GenericKind deleted validated"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-watcher-<hostname>","msg":"GenericKind deleted watched"}
```
>[!TIP] Learn more about [Custom Resources](https://docs.pepr.dev/user-guide/custom-resources/)
