import { PeprModule } from "pepr";
import cfg from "./package.json";
import { HelloPeprRBAC } from "./capabilities/rbac";

new PeprModule(cfg, [HelloPeprRBAC]);
