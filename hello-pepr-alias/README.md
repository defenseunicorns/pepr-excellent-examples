# Alias

The `Alias()` function allows you to label actions with meaningful identifiers that appear in logs. This is particularly useful in modules with multiple actions of the same type, making it easier to trace which specific action executed. 

## When to Use

Use `Alias()` when you need to:
- Distinguish between multiple similar actions
- Improve log filtering and searchability
- Debug complex modules with many actions
- Track action execution in production

## Code Examples
View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-alias/capabilities/alias.ts)

**Reconcile with Alias:**
```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-reconcile-create")
  .Alias("alias:create:reconcile")
  .Reconcile(function reconcileCreate(cm, phase, logger) {
    logger.info(
      cm,
      "external api call (reconcile-create-alias): reconcile/callback",
    );
  })
  .Finalize(function finalizeCreate(cm, logger) {
    logger.info(
      cm,
      "external api call (reconcile-create-alias): reconcile/finalize",
    );
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","alias":"alias:create:reconcile","msg":"external api call (reconcile-create-alias): reconcile/callback"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","alias":"alias:create:reconcile","msg":"external api call (reconcile-create-alias): reconcile/finalize"}
```

**Watch with Alias:**
```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-watch-create")
  .Alias("alias:create:watch")
  .Watch(function watchCreate(cm, phase, logger) {
    logger.info(cm, "external api call (watch-create-alias): watch/callback");
  })
  .Finalize(function finalizeCreate(cm, logger) {
    logger.info(cm, "external api call (watch-create-alias): watch/finalize");
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","alias":"alias:create:watch","msg":"external api call (watch-create-alias): watch/callback"}
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","alias":"alias:create:watch","msg":"external api call (watch-create-alias): watch/finalize"}
```

**Validate with Alias:**
```typescript
When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-validate-create")
  .Alias("alias:create:validate")
  .Validate(function validateCreate(cm, logger) {
    logger.info(
      cm,
      "external api call (validate-create-alias): validate/callback",
    );
    return cm.Approve();
  });
```

#### Example pod log output:

```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","alias":"alias:create:validate","msg":"external api call (validate-create-alias): validate/callback"}
```

