import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprGlobal } from "./capabilities/global";

new PeprModule(cfg, [HelloPeprGlobal]);
