import { a, Capability, Log } from "pepr";

export const PeprReport = new Capability({
  name: "pepr-report",
  description: "pepr-report",
  namespaces: []
});

const { When } = PeprReport;

Log.info('--> asdf')

// When(a.ConfigMap)
//   .IsCreated()
//   .Validate(async request => {
//     const name = request.Raw.metadata.name
//     if (name === "fail") { return request.Deny(name) }
//     return request.Approve()
// });