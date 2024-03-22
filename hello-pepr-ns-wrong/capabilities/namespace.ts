import { Capability, a } from "pepr";

const name = "hello-pepr-namespace";

export const HelloPeprNamespace = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprNamespace;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace("wrong")
  .Validate(async function validateWrong(request) {
    return request.Approve();
  });
