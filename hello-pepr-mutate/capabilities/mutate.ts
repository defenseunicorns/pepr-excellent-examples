import { a, Capability, Log } from "pepr";

const name = "hello-pepr-mutate";

export const HelloPeprMutate = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprMutate;


When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-yay")
  .Mutate(function createYay(request) {
    Log.info("Mutate: create-yay");
  });

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-oof")
  .Mutate(function createOof(request) {
    throw "Mutate: create-oof";
  });


When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-create-yay")
  .Mutate(function couCreateYay(request) {
    Log.info("Mutate: cou-create-yay");
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-create-oof")
  .Mutate(function couCreateOof(request) {
    throw "Mutate: cou-create-oof";
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-update-yay")
  .Mutate(function couUpdateYay(request) {
    const operation = request.Request.operation;
    if (operation === "UPDATE") {
      Log.info("Mutate: cou-update-yay");
    }
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-update-oof")
  .Mutate(function couUpdateOof(request) {
    const operation = request.Request.operation;
    if (operation === "UPDATE") {
      throw "Mutate: cou-update-oof";
    }
  });


When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-yay")
  .Mutate(function updateYay(request) {
    Log.info("Mutate: update-yay");
  });

When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-oof")
  .Mutate(function updateOof(request) {
    throw "Mutate: update-oof";
  });


When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-yay")
  .Mutate(function deleteYay(request) {
    Log.info("Mutate: delete-yay");
  });

When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-oof")
  .Mutate(function deleteOof(request) {
    throw "Mutate: delete-oof";
  });
