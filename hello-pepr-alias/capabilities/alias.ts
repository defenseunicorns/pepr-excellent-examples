import { Capability, Log, a } from "pepr";

export const HelloPeprAlias = new Capability({
  name: "hello-pepr-alias",
  description: "hello-pepr-alias",
  namespaces: [
    "hello-pepr-alias-create"
  ],
});

const { When } = HelloPeprAlias;
let alias = "";

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
  .Finalize(function finalizeCreate(cm) {
    Log.info(
      cm,
      "external api call (reconcile-create-alias): reconcile/finalize",
    );
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-reconcile-create")
  .Alias("alias:create:reconcile:finalize")
  .Reconcile(function reconcileCreate(cm) {
    Log.info(
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

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-reconcile-create")
  .Reconcile(function reconcileCreate(cm, phase, logger) {
    logger.info(
      cm,
      "external api call (reconcile-create-default-alias): reconcile/callback",
    );
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-reconcile-create")
  .Reconcile(function reconcileCreate(cm) {
    Log.info(
      cm,
      "external api call (reconcile-create-no-child-logger): reconcile/callback",
    );
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-watch-create")
  .Alias("alias:create:watch")
  .Watch(function watchCreate(cm, phase, logger) {
    logger.info(
      cm,
      "external api call (watch-create-alias): watch/callback",
    );
  })
  .Finalize(function finalizeCreate(cm) {
    Log.info(
      cm,
      "external api call (watch-create-alias): watch/finalize",
    );
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-watch-create")
  .Alias("alias:create:watch:finalize")
  .Watch(function watchCreate(cm) {
    Log.info(
      cm,
      "external api call (watch-create-alias): watch/callback",
    );
  })
  .Finalize(function finalizeCreate(cm, logger) {
    logger.info(
      cm,
      "external api call (watch-create-alias): watch/finalize",
    );
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-watch-create")
  .Watch(function watchCreate(cm, phase, logger) {
    logger.info(
      cm,
      "external api call (watch-create-alias): watch/callback",
    );
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-watch-create")
  .Watch(function watchCreate(cm) {
    Log.info(
      cm,
      "external api call (watch-create-no-child-logger): watch/callback",
    );
  });

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

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-reconcile-create")
  .Validate(function validateCreate(cm, logger) {
    logger.info(
      cm,
      "external api call (validate-create-default-alias): validate/callback",
    );
    return cm.Approve();
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-validate-create")
  .Validate(function validateCreate(cm) {
    Log.info(
      cm,
      "external api call (validate-create-no-child-logger): validate/callback",
    );
    return cm.Approve();
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-mutate-create")
  .Alias("alias:create:mutate")
  .Mutate(function mutateCreate(cm, logger) {
    logger.info(
      cm,
      "external api call (mutate-create-alias): mutate/callback",
    );
  })

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-mutate-create")
  .Mutate(function mutateCreate(cm, logger) {
    logger.info(
      cm,
      "external api call (mutate-create-default-alias): mutate/callback",
    );
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-mutate-create")
  .Mutate(function mutateCreate(cm) {
    Log.info(
      cm,
      "external api call (mutate-create-no-child-logger): mutate/callback",
    );
  });