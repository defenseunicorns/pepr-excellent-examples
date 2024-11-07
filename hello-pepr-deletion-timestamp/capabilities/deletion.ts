import { Capability, K8s, Log, a } from "pepr";
import { GenericKind } from "kubernetes-fluent-client";
import { Operation } from "fast-json-patch";
/**
 * Test two different filters for deletion timestamp.
 * Validate that shouldSkipRequest works for admission requests.
 * Validate that filterNoMatchReason works for watch processor
 */

const namespace1 = "hello-pepr-deletion-timestamp1";
const namespace2 = "hello-pepr-deletion-timestamp2";

export const HelloPeprDeletion = new Capability({
  name: "hello-pepr-deletion-timestamp",
  description: "e2e deletion timestamp filter.",
  namespaces: [namespace1, namespace2],
});

const { When } = HelloPeprDeletion;

/*
 * Module Helpers
 */
const addFinalizer = async (name: string) => {
  const patchOperations: Operation[] = [
    {
      op: "add",
      path: "/metadata/finalizers",
      value: ["example.com/my-finalizer"],
    },
  ];
  try {
    await K8s(a.Pod, { name, namespace: namespace1 }).Patch(patchOperations);
  } catch (e) {
    Log.error(
      `DTS: Error adding finalizer to pod ${name}: ${JSON.stringify(e)}`,
    );
  }
};

const removeFinalizer = async (name: string) => {
  const patchOperations: Operation[] = [
    { op: "remove", path: "/metadata/finalizers" },
  ];
  try {
    await K8s(a.Pod, { name, namespace: namespace1 }).Patch(patchOperations);
  } catch (e) {
    Log.error(
      `DTS: Error removing finalizer from pod ${name}: ${JSON.stringify(e)}`,
    );
  }
};

const updateObj = async (obj: GenericKind) => {
  const patchOperations: Operation[] = [
    {
      op: "add",
      path: "/metadata/labels/app",
      value: "testing",
    },
  ];
  try {
    await K8s(a.Pod, { name: obj.metadata.name, namespace: namespace2 }).Patch(
      patchOperations,
    );
  } catch (e) {
    Log.error(
      `DTS: Error updating pod ${obj.metadata.name}: ${JSON.stringify(e)}`,
    );
  }
};
const deleteObj = async (obj: GenericKind) => {
  try {
    await K8s(a.Pod).InNamespace(namespace1).Delete(obj.metadata.name);
  } catch (e) {
    Log.error(
      `DTS: Error deleting pod ${obj.metadata.name}: ${JSON.stringify(e)}`,
    );
  }
};

const logSeen = (name: string) => {
  Log.info(`DTS: Saw a pod ${name}.`);
};

/*
 * Namespace 1 - Tests
 * Description: Trigger deletion timestamps by creating a finalizer and deleting the pod.
 */
When(a.Pod)
  .IsCreated()
  .InNamespace(namespace1)
  .WithName("ns1-admission")
  .Watch(async po => {
    await addFinalizer(po.metadata.name);
    await deleteObj(po);
    await removeFinalizer(po.metadata.name);
  });

When(a.Pod)
  .IsCreated()
  .InNamespace(namespace1)
  .WithName("ns1-watch")
  .Watch(async po => {
    await addFinalizer(po.metadata.name);
    await deleteObj(po);
    await removeFinalizer(po.metadata.name);
  });

/*
 * Description: Test WithDeletionTimestamp Filter for an Admission Processor
 */
When(a.Pod)
  .IsUpdated()
  .InNamespace(namespace1)
  .WithName("ns1-admission")
  .WithDeletionTimestamp()
  .Mutate(po => {
    logSeen(po.Raw.metadata.name);
  });

/*
 * Description: Test WithDeletionTimestamp Filter for a Watch/Reconcile Processor
 */
When(a.Pod)
  .IsUpdated()
  .InNamespace(namespace1)
  .WithName("ns1-watch")
  .WithDeletionTimestamp()
  .Watch(po => logSeen(po.metadata.name));

/*
 * Namespace 2 - Tests
 * Description: Trigger an update and without trigger withDeletionTimestamp.
 */
When(a.Pod)
  .IsCreated()
  .InNamespace(namespace2)
  .WithName("ns2-admission")
  .Watch(async po => await updateObj(po));

When(a.Pod)
  .IsCreated()
  .InNamespace(namespace2)
  .WithName("ns2-watch")
  .Watch(async po => await updateObj(po));

/*
 * Description WithDeletionTimestamp Filter should not be called - Admission Processor
 */
When(a.Pod)
  .IsUpdated()
  .InNamespace(namespace2)
  .WithName("ns2-admission")
  .WithDeletionTimestamp()
  .Mutate(po => logSeen(po.Raw.metadata.name));

/*
 * Description: WithDeletionTimestamp Filter should not be called - Watch/Reconcile Processor
 */
When(a.Pod)
  .IsUpdated()
  .InNamespace(namespace2)
  .WithName("ns2-watch")
  .WithDeletionTimestamp()
  .Watch(po => logSeen(po.metadata.name));

/*
 * Description: WithDeletionTimestamp Filter should  be called - Watch/Reconcile Processor
 */
When(a.Pod)
  .IsDeleted()
  .InNamespace(namespace2)
  .WithName("ns2-delete")
  .WithDeletionTimestamp()
  .Watch(po => logSeen(po.metadata.name));
