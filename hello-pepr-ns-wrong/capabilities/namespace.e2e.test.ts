import { describe, it, expect } from "vitest";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins } from "helpers/src/time";
import { moduleBuild } from "helpers/src/pepr";

const _trc = new TestRunCfg(__filename);

describe("namespace.ts", () => {
  it(
    "error on build: filtering for non-module-owned namespace",
    async () => {
      let stderr = [];
      try {
        await moduleBuild();
      } catch (e) {
        stderr = e.stderr;
      }
      expect(stderr.join("\n")).toMatch(
        "Binding uses namespace not governed by capability:",
      );
    },
    mins(1),
  );
});
