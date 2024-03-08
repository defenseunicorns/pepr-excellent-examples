import { PeprModule, Log, PeprMutateRequest } from "pepr";
import { AdmissionRequest, MutateResponse, ValidateResponse } from "pepr/src/lib/k8s";
import cfg from "./package.json";
import { HelloPeprHooks } from "./capabilities/hooks";

function beforeHook(request: AdmissionRequest) {
  Log.info({ request }, "AdmissionRequest --> beforeHook")
}

function afterHook(response: MutateResponse | ValidateResponse) {
  if (Object.keys(response).sort().toString() === "allowed,uid"){
    Log.info({ response }, "ValidateResponse --> afterHook")

  } else {
    Log.info({ response }, "MutateResponse --> afterHook")
  }
}

new PeprModule(cfg, [HelloPeprHooks], { beforeHook, afterHook });
