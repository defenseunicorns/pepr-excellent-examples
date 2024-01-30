import { PeprModule } from "pepr";
import cfg from "./package.json";
import { WebAppController } from "./capabilities";

new PeprModule(cfg, [WebAppController]);
