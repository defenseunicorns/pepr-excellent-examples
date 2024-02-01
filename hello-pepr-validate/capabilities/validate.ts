import { Capability, a } from "pepr";

const ns = "hello-pepr-validate"

export const HelloPeprValidate = new Capability({
  name: ns,
  description: ns,
  namespaces: [ns],
});
const { When } = HelloPeprValidate;


When(a.ConfigMap).IsCreated().InNamespace(ns).Validate(req => {
  const name = req.Raw.data?.name
  const pass = req.Raw.data?.pass

  return pass === "true"
    ? req.Approve()
    : req.Deny(`${name}: pass must be true!`)
})
