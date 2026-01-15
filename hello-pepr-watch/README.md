# Action: Watch

Pepr `Watch()` actions are ideal for asynchronous operations that need to respond to resource changes without timeout constraints. 

## Use Watch when you need to:

- Monitor existing resources in a cluster
- Perform long-running operations without timeout constraints
- React to resource lifecycle events (creation, updates, deletion)


## Code Snippet Examples
This example watches Secret resources and logs different lifecycle events: create, update, delete, and create-or-update.

>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-watch/capabilities/watch.ts)**

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
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Watched create-me: create"}
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
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Watched create-or-update-me: ADDED"}
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
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Watched create-or-update-me: update"}
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
#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Watched create-or-update-me: delete"}
```
>[!TIP] Learn more about the [Watch Action](https://docs.pepr.dev/actions/watch/)