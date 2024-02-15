import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprMutate } from "./capabilities/mutate";

new PeprModule(cfg, [HelloPeprMutate]);
