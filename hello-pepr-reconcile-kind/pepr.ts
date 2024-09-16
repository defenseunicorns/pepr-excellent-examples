import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprReconcile } from "./capabilities/reconcile";

new PeprModule(cfg, [HelloPeprReconcile]);
