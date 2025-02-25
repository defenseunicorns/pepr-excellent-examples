import { PeprModule } from "pepr";
import cfg from "./package.json";

import { HelloPeprGenericKind } from "./capabilities/genericKind";

new PeprModule(cfg, [HelloPeprGenericKind]);
