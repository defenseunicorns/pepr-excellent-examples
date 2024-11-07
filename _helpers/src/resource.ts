import { GenericClass, K8s, KubernetesObject } from "kubernetes-fluent-client";

export async function live(k: GenericClass, o: KubernetesObject) {
  const ns = o.metadata.namespace ? o.metadata.namespace : "";

  try {
    await K8s(k).InNamespace(ns).Get(o.metadata.name);
  } catch (e) {
    if (e.status === 404) {
      return false;
    } else {
      throw e;
    }
  }
  return true;
}

export async function gone(k: GenericClass, o: KubernetesObject) {
  const ns = o.metadata.namespace ? o.metadata.namespace : "";

  try {
    await K8s(k).InNamespace(ns).Get(o.metadata.name);
  } catch (e) {
    if (e.status === 404) {
      return Promise.resolve(true);
    }
  }
  return Promise.resolve(false);
}
