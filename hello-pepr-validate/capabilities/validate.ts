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
  .WithName("yay")
  .Validate(function createYay(request) {
    return request.Approve()
  });

  When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("oof")
  .Validate(function createOof(request) {
    return request.Deny()
  });
