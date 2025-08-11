import { Capability, Log, a } from "pepr";

const name = "hello-pepr-watch";

export const HelloPeprWatch = new Capability({
  name: name,
  description: "Assert that watch events trigger correctly",
  namespaces: [name],
});

const { When } = HelloPeprWatch;
When(a.Pod)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-me")
  .Watch(instance => {
    Log.info(`Watched ${instance.metadata?.name}: create`);
  });
When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-me")
  .Watch(instance => {
    Log.info(`Watched ${instance.metadata?.name}: create`);
  });
When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-me")
  .Watch(instance => {
    Log.info(`Watched ${instance.metadata?.name}: create`);
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("create-or-update-me")
  .Watch((instance, phase) => {
    Log.info(`Watched ${instance.metadata?.name}: ${phase}`);
  });

When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-me")
  .Watch(instance => {
    Log.info(`Watched ${instance.metadata?.name}: update`);
  });

When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-me")
  .Watch(instance => {
    Log.info(`Watched ${instance.metadata?.name}: delete`);
  });
