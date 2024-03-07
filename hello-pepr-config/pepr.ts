import { PeprModule, Log } from "pepr";
import cfg from "./package.json";
import { HelloPeprConfig } from "./capabilities/config";

new PeprModule(cfg, [HelloPeprConfig]);
