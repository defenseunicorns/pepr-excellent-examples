import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprStoreRedactLogs } from "./capabilities/store";

new PeprModule(cfg, [HelloPeprStoreRedactLogs]);
