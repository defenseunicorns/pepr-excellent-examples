import { Capability, a } from "pepr";

const name = "hello-pepr-namespace";

export const HelloPeprNamespace = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprNamespace;

// https://regex101.com/r/sQUD4f/1
When(a.ConfigMap)
  .IsCreated()
  .InRegexNamespace(/^wrong/)
  .Validate(async function validateWrong(request) {
    return request.Approve();
  });
