import {
  beforeAll,
  describe,
  expect,
  it
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { clean } from 'helpers/src/cluster';
import { fullCreate, halfCreate } from "helpers/src/general";
import { moduleDown, moduleUp, untilLogged } from 'helpers/src/pepr';
import { mins, secs } from 'helpers/src/time';

const trc = new TestRunCfg(__filename);

describe("warnings.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(5));

  describe("warnings with approval", () => {
    let ns, warningsApprove;

    beforeAll(async () => {
      [ns, warningsApprove] = await trc.load(`${trc.root()}/capabilities/scenario.warnings-approve.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("approves resource with warnings", async () => {
      // Create the ConfigMap that should trigger warnings but still be approved
      await fullCreate(warningsApprove);

      // todo: these should be "in the response" somewhere - how do we get them?
      await untilLogged("Warning: The 'deprecated-field' is being used");
      await untilLogged("Warning: Best practice is to include an 'app' label");
      await untilLogged("Warning: Large number of configuration items detected");

      // Verify that the resource was approved despite warnings
      await untilLogged("Approving request with warnings");
    }, secs(15));
  });

  describe("warnings with denial", () => {
    let ns, warningsDeny;

    beforeAll(async () => {
      [ns, warningsDeny] = await trc.load(`${trc.root()}/capabilities/scenario.warnings-deny.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("denies resource with warnings", async () => {
      // Attempt to create the ConfigMap that should be denied with warnings
      const reject = await halfCreate(warningsDeny).catch(e => e.data);

      // Verify that the request was denied
      expect(reject.message).toMatch("ConfigMap contains dangerous settings that are not allowed");

      // Verify the status code is 422
      expect(reject.code).toBe(422);

      // Verify that the denial with warnings was logged
      await untilLogged("Denying request with warnings");
      // todo: these should be "in the response" somewhere - how do we get them?
      await untilLogged("Warning: The 'dangerous-setting' field is set to 'true'");
      await untilLogged("Consider using a safer configuration option");
    }, secs(15));
  });

  describe("multiple warnings in approval", () => {
    let ns, warningsMultiple;

    beforeAll(async () => {
      [ns, warningsMultiple] = await trc.load(`${trc.root()}/capabilities/scenario.warnings-multiple.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("approves resource with multiple warnings", async () => {
      // Create the ConfigMap that should trigger multiple warnings but still be approved
      await fullCreate(warningsMultiple);

      // todo: these should be "in the response" somewhere - how do we get them?
      await untilLogged("Warning: The value 'deprecated' for 'setting1' is deprecated");
      await untilLogged("Warning: The value 'insecure' for 'setting2' is not recommended");
      await untilLogged("Warning: Missing 'environment' label");
      await untilLogged("Warning: Missing 'app' label");

      // Verify that the resource was approved despite multiple warnings
      await untilLogged("Approving request with multiple warnings");
    }, secs(15));
  });
});
