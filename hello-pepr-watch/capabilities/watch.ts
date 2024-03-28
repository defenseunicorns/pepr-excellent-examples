import { Capability, Log, a } from "pepr";

const name = "hello-pepr-watch";

export const HelloPeprWatch = new Capability({
  name: name,
  description: "Assert that watch events trigger correctly",
  namespaces: [name],
});

const { When } = HelloPeprWatch;

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .Watch(instance => {
    Log.info(`Observed creation of ${instance.metadata?.name}`);
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .Watch((instance, phase) => {
    Log.info(`Observed ${phase} of ${instance.metadata?.name}`);
  });

When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .Watch(instance => {
    Log.info(`Observed update of ${instance.metadata?.name}`);
  });

When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .Watch(instance => {
    Log.info(`Observed deletion of ${instance.metadata?.name}`);
  });
