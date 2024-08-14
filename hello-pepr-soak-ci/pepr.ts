import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprSoak } from "./capabilities/soak";


new PeprModule(cfg, [HelloPeprSoak]);
