import { PeprModule } from "pepr";
import cfg from "./package.json"
import { HelloPeprWarnings } from "./capabilities/warnings";

/**
 * This module demonstrates the use of warnings in validation responses
 */
new PeprModule(
  cfg,
  [HelloPeprWarnings],
);
