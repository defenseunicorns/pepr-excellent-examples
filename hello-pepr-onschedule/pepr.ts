import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprOnSchedule } from "./capabilities/onschedule";

new PeprModule(cfg, [HelloPeprOnSchedule]);
