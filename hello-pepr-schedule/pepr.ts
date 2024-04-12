import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprSchedule } from "./capabilities/schedule";

new PeprModule(cfg, [HelloPeprSchedule]);
