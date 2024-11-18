import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprLoad } from "./capabilities/load";

new PeprModule(cfg, [HelloPeprLoad]);
