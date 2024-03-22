import { Capability, a, Log } from "pepr";
import { untilTrue } from "helpers/src/general"

const name = "hello-pepr-store";

export const HelloPeprStore = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When, Store } = HelloPeprStore;

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("setter")
  .Validate(async function validateSetter(request) {
    const alphabet = request.Raw.data.alphabet
    await Store.setItemAndWait("alphabet", alphabet)
    return request.Approve()
  });

When(a.ConfigMap)
  .IsCreated()
  .InNamespace(name)
  .WithName("getter")
  .Mutate(async function mutateGetter(request) {
    let alphabet
    const found = () => {
      alphabet = Store.getItem("alphabet")
      return Promise.resolve(Boolean(alphabet))
    }
    await untilTrue(found)

    request.Raw.data.alphabet = alphabet
    Log.info({alphabet}, "alphabet copied")
  });
