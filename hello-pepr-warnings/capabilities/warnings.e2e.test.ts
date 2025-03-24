import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate, halfCreate } from "helpers/src/general";
import { secs, mins } from 'helpers/src/time';
import { moduleUp, moduleDown, untilLogged, logs } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'pepr';

const trc = new TestRunCfg(__filename);

describe("warnings.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(5));

  describe("validate with approval and warnings", () => {
    let ns, warningsApprove;

    beforeAll(async () => {
      [ns, warningsApprove] = await trc.load(`${trc.root()}/capabilities/scenario.warnings-approve.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("approves resources with warnings", async () => {
      await fullCreate(warningsApprove);

      // Check that the approval with warnings was logged
      await untilLogged("Approving request with warnings:");
      
      // Check for specific warnings in the logs
      const logOutput = await logs();
      expect(logOutput).toContain("deprecated-field");
      expect(logOutput).toContain("app' label");
      expect(logOutput).toContain("Large number of configuration items");
    }, secs(10));
  });

  describe("validate with denial and warnings", () => {
    let ns, warningsDeny;

    beforeAll(async () => {
      [ns, warningsDeny] = await trc.load(`${trc.root()}/capabilities/scenario.warnings-deny.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("denies resources with warnings", async () => {
      // This should be denied with warnings
      const reject = await halfCreate(warningsDeny).catch(e => {
        // Check the error message
        expect(e.data.message).toMatch("ConfigMap contains dangerous settings that are not allowed");
        
        // Check for warnings in the response
        if (e.data.warnings) {
          expect(e.data.warnings).toContain("Warning: The 'dangerous-setting' field is set to 'true'");
          expect(e.data.warnings).toContain("Consider using a safer configuration option");
        }
        
        return e.data.message;
      });

      // Check that the denial with warnings was logged
      await untilLogged("Denying request with warnings:");
      
      // Check for specific warnings in the logs
      const logOutput = await logs();
      expect(logOutput).toContain("dangerous-setting");
    }, secs(10));
  });

  describe("validate with multiple warnings", () => {
    let ns, warningsMultiple;

    beforeAll(async () => {
      [ns, warningsMultiple] = await trc.load(`${trc.root()}/capabilities/scenario.warnings-multiple.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("approves resources with multiple warnings", async () => {
      await fullCreate(warningsMultiple);

      // Check that the approval with multiple warnings was logged
      await untilLogged("Approving request with multiple warnings:");
      
      // Check for specific warnings in the logs
      const logOutput = await logs();
      expect(logOutput).toContain("deprecated");
      expect(logOutput).toContain("insecure");
      expect(logOutput).toContain("environment");
      expect(logOutput).toContain("app");
    }, secs(10));
  });
});
