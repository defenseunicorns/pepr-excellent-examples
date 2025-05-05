import { PeprModule } from "pepr";
import cfg from "./package.json";
import { HelloPeprIgnoredNS } from "./capabilities/ignored-controller-ns";
new PeprModule(cfg, [HelloPeprIgnoredNS]);
