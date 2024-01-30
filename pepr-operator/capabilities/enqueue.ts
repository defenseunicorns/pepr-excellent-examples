import { Log } from "pepr";

import { WebApp } from "./crd";
import { reconciler } from "./reconciler";

type QueueItem = {
  instance: WebApp;
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: string) => void;
};

/**
 * Queue is a FIFO queue for reconciling webapps
 */
export class Queue {
  #queue: QueueItem[] = [];
  #pendingPromise = false;

  /**
   * Enqueue adds a webapp to the queue and returns a promise that resolves when the webapp is
   * reconciled.
   *
   * @param pkg The webapp to reconcile
   * @returns A promise that resolves when the instance is reconciled
   */
  enqueue(instance: WebApp) {
    Log.debug(
      `Enqueueing ${instance.metadata!.namespace}/${instance.metadata!.name}`,
    );
    return new Promise<void>((resolve, reject) => {
      this.#queue.push({ instance, resolve, reject });
      return this.#dequeue();
    });
  }

  /**
   * Dequeue reconciles the next webapp in the queue
   *
   * @returns A promise that resolves when the webapp is reconciled
   */
  async #dequeue() {
    // If there is a pending promise, do nothing
    if (this.#pendingPromise) return false;

    // Take the next item from the queue
    const item = this.#queue.shift();

    // If there is no item, do nothing
    if (!item) return false;

    try {
      // Set the pending promise flag to avoid concurrent reconciliations
      this.#pendingPromise = true;

      // Reconcile the webapp
      await reconciler(item.instance);

      item.resolve();
    } catch (e) {
      item.reject(e);
    } finally {
      // Reset the pending promise flag
      this.#pendingPromise = false;

      // After the webapp is reconciled, dequeue the next webapp
      await this.#dequeue();
    }
  }
}
