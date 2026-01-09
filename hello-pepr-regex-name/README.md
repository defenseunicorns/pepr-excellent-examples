# Regex Name

`.WithNameRegex()` filters resources by their name using regular expressions instead of namespace names. 
This is useful for matching resources based on naming conventions without explicitly listing each name. 
Note that this matches the resource name itself, not the namespace name.

## Usage

Use `.WithNameRegex()` to match resource names, not namespace names. 

Do **not** use to match resource namespace names. To match with namespace names, see [regex namespace-all](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-regex-ns-all/README.md).

## Code Examples

View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-regex-name/capabilities/regex-name.ts)

### Match Resource Names Starting with "default"

```typescript
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/^default/)
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });
```

### Match Resource Names Ending with "-default"

```typescript
When(a.ConfigMap)
  .IsCreated()
  .WithNameRegex(/-default$/)
  .Mutate(function mutateNs(request) {
    request.SetAnnotation("obviously", "seen");
  });
```

>[!TIP] Learn more about [Filters](https://docs.pepr.dev/user-guide/filters/#filters)