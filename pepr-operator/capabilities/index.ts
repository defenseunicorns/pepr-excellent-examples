import { Capability, a, Log } from "pepr";
import { WebApp } from "./crd";
import { validator } from "./crd/validator";
import { Queue } from "./enqueue";
import { WebAppCRD } from "./crd/source/webapp.crd";
import { RegisterCRD } from "./crd/register";
import "./crd/register";
import Deploy from "./controller/generators";

export const WebAppController = new Capability({
  name: "webapp-controller",
  description: "A Kubernetes Operator that manages WebApps",
  namespaces: [],
});

const { When, Store } = WebAppController;

const queue = new Queue();

const RECONCILE_SECONDS = 5;

/*
 * Description:
 * This function is a higher order function that takes a number of seconds and returns a function that takes a function and a set of arguments.
 * The returned function will wait for the number of seconds before calling the function with the provided arguments.
 *
 * Reason:
 * When you delete the instance of WebApp, the operator removes the instance of the WebApp from the store.
 * Kubernetes then does a cascade deletion on the resources that the WebApp instance created by the ownerReference.
 * Upon Deletion of the resources, the operator will then reconcile to bring those resources back into the cluster if the instace of WebApp is still in the store.
 * The delay gives the instance time to be deleted from the store operator will have time to process the deletion of the resources before they are deleted.
 */
function reconcileWithDelay(seconds: number) {
  return async function <T, A extends unknown[]>(
    fn: (...args: A) => Promise<T>,
    ...args: A
  ): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    return fn(...args);
  };
}

const handleReconcile = reconcileWithDelay(RECONCILE_SECONDS);

// When instance is created or updated, validate it and enqueue it for processing
When(WebApp)
  .IsCreatedOrUpdated()
  .Validate(validator)
  .Watch(async instance => {
    try {
      Store.setItem(instance.metadata.name, JSON.stringify(instance));
      await queue.enqueue(instance);
    } catch (error) {
      Log.info(`Error enqueing instance of WebApp`);
    }
  });

When(WebApp)
  .IsDeleted()
  .Mutate(instance => {
    Store.removeItem(instance.Raw.metadata.name);
    instance.SetAnnotation("deletionTimestamp", new Date().toISOString());
  });

// Don't let the CRD get deleted
When(a.CustomResourceDefinition)
  .IsDeleted()
  .WithName(WebAppCRD.metadata.name)
  .Watch(() => {
    RegisterCRD();
  });

// // Don't let them be deleted
When(a.Deployment)
  .IsDeleted()
  .WithLabel("pepr.dev/operator")
  .Watch(async deploy => {
    await handleReconcile(async (): Promise<void> => {
      const instance = JSON.parse(
        Store.getItem(deploy.metadata!.labels["pepr.dev/operator"]),
      ) as a.GenericKind;
      await Deploy(instance);
    });
  });
When(a.Service)
  .IsDeleted()
  .WithLabel("pepr.dev/operator")
  .Watch(async svc => {
    await handleReconcile(async (): Promise<void> => {
      const instance = JSON.parse(
        Store.getItem(svc.metadata!.labels["pepr.dev/operator"]),
      ) as a.GenericKind;
      await Deploy(instance);
    });
  });
When(a.ConfigMap)
  .IsDeleted()
  .WithLabel("pepr.dev/operator")
  .Watch(async cm => {
    await handleReconcile(async (): Promise<void> => {
      const instance = JSON.parse(
        Store.getItem(cm.metadata!.labels["pepr.dev/operator"]),
      ) as a.GenericKind;
      await Deploy(instance);
    });
  });
