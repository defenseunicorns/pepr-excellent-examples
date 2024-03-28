import { Capability, Log, a } from "pepr";
export const HelloPeprWatch = new Capability({
  name: "hello-pepr-watch",
  description: "Assert that watch events trigger correctly",
  namespaces: ["pepr-demo"],
});

const { When } = HelloPeprWatch;

When(a.Secret)
  .IsCreated()
  .InNamespace("pepr-demo")
  .Watch(instance => {
    Log.info(`Observed creation of ${instance.metadata?.name}`);
  });
When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace("pepr-demo")
  .Watch((instance, phase) => {
    Log.info(`Observed ${phase} of ${instance.metadata?.name}`);
  });
When(a.Secret)
  .IsUpdated()
  .InNamespace("pepr-demo")
  .Watch(instance => {
    Log.info(`Observed update of ${instance.metadata?.name}`);
  });
When(a.Secret)
  .IsDeleted()
  .InNamespace("pepr-demo")
  .Watch(instance => {
    Log.info(`Observed deletion of ${instance.metadata?.name}`);
  });
