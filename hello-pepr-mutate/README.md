# Action: Mutate

Pepr `Mutate()` action is used to modify Kubernetes objects during admission. 
Mutations allow you to enforce defaults, apply standard labels/annotations, or clean up unwanted metadata before the resource is persisted.


## When should you use Mutate?

Use `Mutate()` when you need to:

- Apply default labels or annotations to resources as they are created.
- Remove unwanted metadata automatically (labels, annotations, fields).
- Normalize user input so objects follow your standards.
- Enforce consistent cluster hygiene by modifying objects before they are stored.
- Transform objects while still allowing them through.

> [!TIP] Consider adding a matching `Validate()` to detect invalid >post-mutation states.

## Code Snippet Examples

This example mutates Secret resources and logs different lifecycle events: create, update, delete, and create-or-update.

>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-mutate/capabilities/mutate.ts)**

### Create Event

```typescript
When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-yay")
  .Mutate(function createYay() {
    Log.info("Mutate: create-yay");
  });
```

##### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Mutate: create-yay"}
```

### Create or Update Event

```typescript
When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-create-yay")
  .Mutate(function couCreateYay() {
    Log.info("Mutate: cou-create-yay");
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Mutate: cou-create-yay"}      
```

### Update Event

```typescript
When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-yay")
  .Mutate(function updateYay() {
    Log.info("Mutate: update-yay");
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Mutate: update-yay"}
```

### Delete Event

```typescript
When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-yay")
  .Mutate(function deleteYay() {
    Log.info("Mutate: delete-yay");
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Mutate: delete-yay"}
```
>[!TIP] Learn more about the [Mutate action](http://localhost:4321/actions/mutate/)