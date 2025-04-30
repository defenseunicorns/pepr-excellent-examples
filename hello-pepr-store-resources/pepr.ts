import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprStoreResources } from "./capabilities/store";

new PeprModule(cfg, [HelloPeprStoreResources]);
