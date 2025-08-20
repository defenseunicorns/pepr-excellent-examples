import { Capability, Log, a } from "pepr";

const name = "hello-pepr-generic-kind";

export const HelloPeprGenericKind = new Capability({
  name: name,
  description: "Assert that generic kinds work through admission and watch",
  namespaces: [name],
});

const { When } = HelloPeprGenericKind;

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

When(a.GenericKind, {
  group: "pepr.dev",
  version: "v1",
  kind: "Unicorn",
})
  .IsCreatedOrUpdated()
  .WithName("create-or-update")
  .Mutate(() => {
    Log.info("GenericKind created or updated and mutated");
  })
  .Validate(instance => {
    Log.info("GenericKind created or updated and validated");
    return instance.Approve();
  })
  .Watch(() => {
    Log.info("GenericKind created or updated and watched");
  });

When(a.GenericKind, {
  group: "pepr.dev",
  version: "v1",
  kind: "Unicorn",
})
  .IsUpdated()
  .WithName("update")
  .Mutate(() => {
    Log.info("GenericKind updated and mutated");
  })
  .Validate(instance => {
    Log.info("GenericKind updated and validated");
    return instance.Approve();
  })
  .Watch(() => {
    Log.info("GenericKind updated and watched");
  });

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
