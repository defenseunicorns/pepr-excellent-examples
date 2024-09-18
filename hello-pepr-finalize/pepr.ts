import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprFinalize } from "./capabilities/finalize";

new PeprModule(cfg, [HelloPeprFinalize]);
