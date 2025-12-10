# Validate

Pepr `Validate()` action runs **during admission phase** to allow or deny Kubernetes objects before they are persisted. Use it to enforce rules, block invalid configurations, and ensure resources meet required standards.

## When should you use Validate?

- Enforce strict correctness rules on Kubernetes resources.
- Block invalid or dangerous configurations.
- Ensure required labels, annotations, or field conventions are followed.
- Reject requests that do not meet security, compliance, or operational standards.
- Verify that mutated objects remain valid after transformations.

> [!TIP] Use `Validate()` after `Mutate()` if you want to ensure your mutations produce a valid final object.

## Code Snippet Examples

This example validates that Pods include required labels and rejects ones that do not comply.

View additional examples on [GitHub](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-validate/capabilities/validate.ts)


### Create Event

```typescript
When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-yay")
  .Validate(function createYay(request) {
    Log.info("Valid: create-yay");
    return request.Approve();
  });
```

##### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Valid: create-yay"}
```

### Create or Update Event

```typescript
When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-create-oof")
  .Validate(function couCreateOof(request) {
    const failWhen = request.Raw.data.failWhen;
    const operation = request.Request.operation;
    return failWhen === operation
      ? request.Deny("cou-create-oof")
      : request.Approve();
  });
```

#### Example pod log output:

```json
Error from server: error when creating "capabilities/scenario.create-or-update.yaml": admission webhook "pepr-<hostname>.pepr.dev" denied the request: cou-create-oof
```

### Update Event

```typescript
When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-yay")
  .Validate(function updateYay(request) {
    Log.info("Valid: update-yay");
    return request.Approve();
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Valid: update-yay"}
```

### Delete Event

```typescript
When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-yay")
  .Validate(function deleteYay(request) {
    Log.info("Valid: delete-yay");
    return request.Approve();
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","msg":"Valid: delete-yay"}
```