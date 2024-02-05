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
  // .InNamespace(name)
  .Validate(req => {
    const name = req.Raw.metadata.name;
    const pass = req.Raw.data?.pass;

    return pass === "yep" ? req.Approve() : req.Deny(name);
  });
