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

// Helper function to check if any log entry contains the given text
function logsContainText(logs: string[], text: string): boolean {
  for (const logStr of logs) {
    try {
      const log = JSON.parse(logStr);
      if (log.msg && log.msg.includes(text)) {
        return true;
      }
    } catch (e) {
      // If we can't parse the log as JSON, check it as a string
      if (logStr.includes(text)) {
        return true;
      }
    }
  }
  return false;
}

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
      
      // Get the logs
      const logOutput = await logs();
      
      // Verify logs contain our warning messages or the request was approved with warnings
      expect(logsContainText(logOutput, "Approving request with warnings:")).toBe(true);
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
      
      // Get the logs
      const logOutput = await logs();
      
      // Verify logs contain our warning message about denial
      expect(logsContainText(logOutput, "Denying request with warnings:")).toBe(true);
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
      
      // Get the logs
      const logOutput = await logs();
      
      // Verify logs contain our warning message about multiple warnings
      expect(logsContainText(logOutput, "Approving request with multiple warnings:")).toBe(true);
    }, secs(10));
  });
});
