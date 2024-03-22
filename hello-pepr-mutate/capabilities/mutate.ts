import { Capability, a } from "pepr";

const name = "hello-pepr-mutate";

export const HelloPeprMutate = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprMutate;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .Mutate(function mutateStuff(request) {
    if (Object.hasOwn(request.Raw.data, 'oof')) {
      throw "oof"
    }
    if (request.Raw.data['glass-is-half'] === 'empty') {
      request.Merge({ data: { ['glass-is-half']: 'full' } })
    }
  });
