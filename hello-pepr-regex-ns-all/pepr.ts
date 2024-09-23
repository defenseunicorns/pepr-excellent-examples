import { PeprModule } from "pepr";
import cfg from "./package.json";
import { HelloPeprNamespace } from "./capabilities/namespace";

new PeprModule(cfg, [HelloPeprNamespace]);
