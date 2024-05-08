import { PeprModule } from "pepr";
import cfg from "./package.json";

import { KFCLogs } from "./capabilities/logs";

new PeprModule(cfg, [KFCLogs]);
