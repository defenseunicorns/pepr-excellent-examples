import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprAlias } from "./capabilities/alias";

new PeprModule(cfg, [HelloPeprAlias]);
