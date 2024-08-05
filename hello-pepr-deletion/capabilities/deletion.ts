import { Capability, Log, a, sdk, K8s } from "pepr";
import { V1OwnerReference } from "@kubernetes/client-node";

export const HelloPeprDeletionTimestamp = new Capability({
  name: "hello-pepr-deletion-timestamp",
  description: "Testing the deletion timestamp filter.",
  namespaces: ["deletion"],
});

const { When } = HelloPeprDeletionTimestamp;
const { getOwnerRefFrom } = sdk;

const createPodWithOwnerRef = (ownerRef: V1OwnerReference[]) =>
  K8s(a.Pod).Apply({
    metadata: {
      ownerReferences: ownerRef,
      name: "pod-with-finalizer",
      namespace: "deletion",
    },
    spec: {
      containers: [
        {
          name: "nginx",
          image: "nginx",
        },
      ],
    },
  });

When(a.Pod)
  .IsCreated()
  .WithName("owner-pod")
  .Watch(async ownerPod => {
    const ownerRef = getOwnerRefFrom(ownerPod);
    
      await createPodWithOwnerRef(ownerRef);
      new Promise<void>(resolve =>
        setTimeout(() => {
          void K8s(a.Pod)
            .InNamespace("deletion")
            .Delete(ownerPod.metadata.name);
          resolve();
        }, 10000),
      );
  })


When(a.Pod)
  .IsUpdated()
  .WithName("pod-with-finalizer")
  .WithDeletionTimestamp()
  .Watch(po => {
    Log.info(`WithDeletionTimestamp: Watch - ${po.metadata.name}`);
  });

When(a.Pod)
  .IsUpdated()
  .WithName("pod-with-finalizer")
  .WithDeletionTimestamp()
  .Mutate(po => {
    Log.info(`WithDeletionTimestamp: Mutate - ${po.Raw.metadata.name}`);
  });

When(a.Pod)
  .IsUpdated()
  .WithName("pod-with-finalizer")
  .WithDeletionTimestamp()
  .Validate(po => {
    Log.info(`WithDeletionTimestamp: Validate - ${po.Raw.metadata.name}`);
    return po.Approve();
  });

When(a.Pod)
  .IsUpdated()
  .WithName("pod-with-finalizer")
  .WithDeletionTimestamp()
  .Mutate(po =>
    Log.info(`WithDeletionTimestamp: MutateBlock - ${po.Raw.metadata.name}`),
  )
  .Validate(po => {
    Log.info(`WithDeletionTimestamp: ValidateBlock - ${po.Raw.metadata.name}`);
    return po.Approve();
  })
  .Watch(po => {
    Log.info(`WithDeletionTimestamp: WatchBlock - ${po.metadata.name}`);
    Log.info("DONE");
  });
