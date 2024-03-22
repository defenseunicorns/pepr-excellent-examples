import { Capability, a } from "pepr";

const name = "hello-pepr-validate";

export const HelloPeprValidate = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprValidate;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .Validate(function validateAll(request) {
    const name = request.Raw.metadata.name;
    if (name === "kube-root-ca.crt") { return request.Approve() }

    const pass = request.Raw.data?.pass;
    return pass === "yep" ? request.Approve() : request.Deny(name)
  });
