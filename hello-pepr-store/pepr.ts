import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprStore } from "./capabilities/store";

new PeprModule(cfg, [HelloPeprStore]);
