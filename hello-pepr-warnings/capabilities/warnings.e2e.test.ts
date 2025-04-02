import {
  beforeAll,
  describe,
  expect,
  it
} from "@jest/globals";
// Note: spawnSync is required to capture stderr where the warnings end up
import { execSync, spawnSync } from 'child_process';
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { clean } from "helpers/src/cluster";
import { fullCreate } from "helpers/src/general";
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
    let ns, scenarioFile;

    beforeAll(async () => {
      scenarioFile = `${trc.root()}/capabilities/scenario.warnings-approve.yaml`;
      [ns] = await trc.load(`${trc.root()}/capabilities/ns.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("approves resource with warnings", async () => {
      // Delete the resource first to ensure we get a fresh creation with warnings
      execSync(`kubectl delete -f ${scenarioFile} --ignore-not-found`, { encoding: 'utf-8' });

      // Apply the ConfigMap using kubectl and capture stdout and stderr separately
      const result = spawnSync('kubectl', ['apply', '-f', scenarioFile], {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      // Verify that warnings are present in stderr
      expect(result.stderr).toContain("Warning: The 'deprecated-field' is being used");
      expect(result.stderr).toContain("Warning: Best practice is to include an 'app' label");
      expect(result.stderr).toContain("Warning: Large number of configuration items detected");

      // Verify that the resource was created successfully in stdout
      expect(result.stdout).toContain("configmap/warnings-approve created");

      // Also verify that the warnings are logged
      await untilLogged("Approving request with warnings");
    }, secs(15));
  });

  describe("warnings with denial", () => {
    let ns, scenarioFile;

    beforeAll(async () => {
      scenarioFile = `${trc.root()}/capabilities/scenario.warnings-deny.yaml`;
      [ns] = await trc.load(`${trc.root()}/capabilities/ns.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("denies resource with warnings", async () => {
      // Apply the ConfigMap using kubectl and expect it to fail
      const result = spawnSync('kubectl', ['apply', '-f', scenarioFile], {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      // Verify that the denial message is in stderr
      expect(result.stderr).toContain("ConfigMap contains dangerous settings that are not allowed");

      // Verify that warnings are present in stderr
      expect(result.stderr).toContain("Warning: The 'dangerous-setting' field is set to 'true'");
      expect(result.stderr).toContain("Consider using a safer configuration option");

      // Verify that the resource was denied (error code in stderr, no success in stdout)
      expect(result.stderr).toContain("Error from server");
      expect(result.stdout).not.toContain("configmap/warnings-deny created");
      expect(result.status).not.toBe(0); // Non-zero exit code indicates failure

      // Also verify that the warnings are logged
      await untilLogged("Denying request with warnings");
    }, secs(15));
  });

  describe("multiple warnings in approval", () => {
    let ns, scenarioFile;

    beforeAll(async () => {
      scenarioFile = `${trc.root()}/capabilities/scenario.warnings-multiple.yaml`;
      [ns] = await trc.load(`${trc.root()}/capabilities/ns.yaml`);
      await fullCreate(ns);
    }, secs(10));

    it("approves resource with multiple warnings", async () => {
      // Delete the resource first to ensure we get a fresh creation with warnings
      execSync(`kubectl delete -f ${scenarioFile} --ignore-not-found`, { encoding: 'utf-8' });

      // Apply the ConfigMap using kubectl and capture stdout and stderr separately
      const result = spawnSync('kubectl', ['apply', '-f', scenarioFile], {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      // Verify that warnings are present in stderr
      expect(result.stderr).toContain("Warning: The value 'deprecated' for 'setting1' is deprecated");
      expect(result.stderr).toContain("Warning: The value 'insecure' for 'setting2' is not recommended");
      expect(result.stderr).toContain("Warning: Missing 'environment' label");
      expect(result.stderr).toContain("Warning: Missing 'app' label");

      // Verify that the resource was created successfully in stdout
      expect(result.stdout).toContain("configmap/warnings-multiple created");

      // Also verify that the warnings are logged
      await untilLogged("Approving request with multiple warnings");
    }, secs(15));
  });
});
