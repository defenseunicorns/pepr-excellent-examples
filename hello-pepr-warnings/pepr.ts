import { PeprModule } from "pepr";
import { HelloPeprWarnings } from "./capabilities/warnings";

/**
 * This module demonstrates the use of warnings in validation responses
 */
new PeprModule({
  name: "hello-pepr-warnings",
  description: "Testing warnings in validation responses",
  capabilities: [HelloPeprWarnings],
});
