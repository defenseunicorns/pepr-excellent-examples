# Watch

Watch actions are ideal for asynchronous operations that need to respond to resource changes without timeout constraints. 

## Use Watch when you need to:

- Monitor existing resources in a cluster
- Perform long-running operations without timeout constraints
- React to resource lifecycle events (creation, updates, deletion)


## Code Snippet Examples
This example watches Secret resources and logs different lifecycle events: create, update, delete, and create-or-update.

View full example on [Github](https://github.com/defenseunicorns/pepr-docs/pull/117):

### Watch Create Events

```typescript
When(a.Secret)
.IsCreated()
  .InNamespace(name)
  .WithName("create-me")
  .Watch((instance) => {
    Log.info(`Watched ${instance.metadata?.name}: create`);
  });
```

### Watch Create or Update Events

```typescript
When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("create-or-update-me")
  .Watch((instance, phase) => {
    Log.info(`Watched ${instance.metadata?.name}: ${phase}`);
  });
```

### Watch Update Events

```typescript
When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-me")
  .Watch((instance) => {
    Log.info(`Watched ${instance.metadata?.name}: update`);
  });

```

### Watch Delete Events

```typescript
When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-me")
  .Watch((instance) => {
    Log.info(`Watched ${instance.metadata?.name}: delete`);
  });
```
