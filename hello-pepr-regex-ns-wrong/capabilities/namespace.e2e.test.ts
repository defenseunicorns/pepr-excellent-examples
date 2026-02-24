import { describe, it, expect } from "vitest";
import { mins } from "helpers/src/time";
import { moduleBuild } from "helpers/src/pepr";

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
      console.log(stderr.join("\n"));
      expect(stderr.join("\n")).toMatch(
        "Ignoring Watch Callback: Object namespace does not match any capability namespace with regex ^wrong.",
      );
    },
    mins(1),
  );
});
