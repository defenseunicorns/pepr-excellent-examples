import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprWatch } from "./capabilities/watch";

new PeprModule(cfg, [HelloPeprWatch]);
