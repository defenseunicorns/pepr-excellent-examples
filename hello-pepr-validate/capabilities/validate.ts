import { a, Capability, Log } from "pepr";

const name = "hello-pepr-validate";

export const HelloPeprValidate = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { When } = HelloPeprValidate;

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-yay")
  .Validate(function createYay(request) {
    Log.info("Valid: create-yay");
    return request.Approve();
  });

When(a.Secret)
  .IsCreated()
  .InNamespace(name)
  .WithName("create-oof")
  .Validate(function createOof(request) {
    return request.Deny("create-oof");
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-create-yay")
  .Validate(function couCreateYay(request) {
    Log.info("Valid: cou-create-yay");
    return request.Approve();
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-create-oof")
  .Validate(function couCreateOof(request) {
    const failWhen = request.Raw.data.failWhen;
    const operation = request.Request.operation;
    return failWhen === operation
      ? request.Deny("cou-create-oof")
      : request.Approve();
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-update-yay")
  .Validate(function couUpdateYay(request) {
    Log.info("Valid: cou-update-yay");
    return request.Approve();
  });

When(a.Secret)
  .IsCreatedOrUpdated()
  .InNamespace(name)
  .WithName("cou-update-oof")
  .Validate(function couUpdateOof(request) {
    const failWhen = request.Raw.data.failWhen;
    const operation = request.Request.operation;
    return failWhen === operation
      ? request.Deny("cou-update-oof")
      : request.Approve();
  });

When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-yay")
  .Validate(function updateYay(request) {
    Log.info("Valid: update-yay");
    return request.Approve();
  });

When(a.Secret)
  .IsUpdated()
  .InNamespace(name)
  .WithName("update-oof")
  .Validate(function updateOof(request) {
    return request.Deny("update-oof");
  });

When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-yay")
  .Validate(function deleteYay(request) {
    Log.info("Valid: delete-yay");
    return request.Approve();
  });

When(a.Secret)
  .IsDeleted()
  .InNamespace(name)
  .WithName("delete-oof")
  .Validate(function deleteOof(request) {
    return request.Deny("delete-oof");
  });
