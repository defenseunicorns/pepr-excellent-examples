import { K8s, Log, kind } from "pepr";

import { WebAppCRD } from "./source/webapp.crd";

export const RegisterCRD = () => {
  K8s(kind.CustomResourceDefinition)
    .Apply(WebAppCRD, { force: true })
    .then(() => Log.info("WebApp CRD registered"))
    .catch(err => {
      Log.error(err);
      process.exit(1);
    });
};
(() => RegisterCRD())();
