import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprDeletionTimestamp } from "./capabilities/deletion";

new PeprModule(cfg, [HelloPeprDeletionTimestamp]);
