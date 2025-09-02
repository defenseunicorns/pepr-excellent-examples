import { Capability, a } from "pepr";

const name = "hello-pepr-ns-all";

export const HelloPeprNamespace = new Capability({
  name: name,
  description: name,
  namespaces: [],
});
const { When } = HelloPeprNamespace;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("default")
  .Mutate(function mutateDef(request) {
    request.SetAnnotation("def", "seen");
  });

/**
 * This policy prevents pods from sharing the host namespaces.
 *
 * Host namespaces (Process ID namespace, Inter-Process Communication namespace, and network namespace)
 * allow access to shared information and can be used to elevate privileges. Pods should not be allowed
 * access to host namespaces. This policy ensures fields which make use of these host namespaces are
 * set to `false`.
 *
 * @related https://repo1.dso.mil/big-bang/product/packages/kyverno-policies/-/blob/main/chart/templates/disallow-host-namespaces.yaml
 *
 * @lulaStart 123e4567-e89b-12d3-a456-426614174000
 */
When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .Mutate(function mutateNs(request) {
    request.SetAnnotation("ns", "seen");
  });
/**
 * @lulaEnd 123e4567-e89b-12d3-a456-426614174000
 */
When(a.ConfigMap)
  .IsCreated()
  .Mutate(function mutateNon(request) {
    request.SetAnnotation("non", "seen");
  });
