import { Capability, a } from "pepr";

export const HelloPeprAlias = new Capability({
  name: "hello-pepr-alias",
  description: "hello-pepr-alias",
  namespaces: ["hello-pepr-alias-create"],
});

const { When } = HelloPeprAlias;

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

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("hello-pepr-alias-create")
  .WithName("cm-reconcile-create")
  .Reconcile(function reconcileCreate(cm, phase, logger) {
    logger.info(
      cm,
      "external api call (reconcile-create-no-alias): reconcile/callback",
    );
  });

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
  .WithName("cm-mutate-create")
  .Alias("alias:create:mutate")
  .Mutate(function mutateCreate(cm, logger) {
    logger.info(cm, "external api call (mutate-create-alias): mutate/callback");
  });
