import { PeprModule } from "pepr";
import cfg from "./package.json";
import { HelloPeprRegexName } from "./capabilities/regex-name";
new PeprModule(cfg, [HelloPeprRegexName]);
