import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprValidate } from "./capabilities/validate";

new PeprModule(cfg, [HelloPeprValidate]);
