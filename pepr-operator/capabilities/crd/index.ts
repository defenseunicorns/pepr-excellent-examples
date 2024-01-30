import { V1OwnerReference } from "@kubernetes/client-node";
export { WebApp, Phase, Status } from "./generated/webapp-v1alpha1";
import { WebApp } from "./generated/webapp-v1alpha1";

export function getOwnerRef(instance: WebApp): V1OwnerReference[] {
  const { name, uid } = instance.metadata!;

  return [
    {
      apiVersion: instance.apiVersion!,
      kind: instance.kind!,
      uid: uid!,
      name: name!,
    },
  ];
}
