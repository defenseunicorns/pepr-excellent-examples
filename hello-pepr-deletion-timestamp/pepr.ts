import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprDeletion } from "./capabilities/deletion";

new PeprModule(cfg, [HelloPeprDeletion]);
