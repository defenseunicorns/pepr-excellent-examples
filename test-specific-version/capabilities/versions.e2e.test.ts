import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { getPeprAlias } from "../../_helpers/src/pepr";
import { existsSync, readFileSync, rmSync } from "fs";

describe("version tests", () => {
  const examplePeprVersion = getPeprVersionFromBackup();
  const localDevelopmentPeprVersion = "0.0.0-development";

  describe(`when pepr version is defined the example's package.json (v${examplePeprVersion})`, () => {
    it("shows the correct version", () => {
      rmSync("node_modules/pepr", { recursive: true, force: true });
      execSync(`npm install pepr@${examplePeprVersion}`);
      const result = execSync(`npx pepr --version`).toString().trim(); //Use a published copy when PEPR_PACKAGE is not set
      // https://regex101.com/r/7be4fk/1
      const cleanVersion = examplePeprVersion.replace(/^[~^]/, "");
      expect(result).toContain(cleanVersion);
    });
  });
  describe("when pepr is a development copy (--local-package or --custom-package)", () => {
    it("shows the correct version", () => {
      if (process.env.PEPR_PACKAGE) {
        expect(existsSync(`${process.env.PEPR_PACKAGE}`)).toBe(true);
        const result = execSync(`npx --yes ${getPeprAlias()} --version`).toString();
        expect(result).toContain(`${localDevelopmentPeprVersion}`);
      } else {
        //Skip this test, since we conclude we're not using a local copy if PEPR_PACKAGE was not set
      }
    });
  });
});

function getPeprVersionFromBackup() {
  const packageJson = JSON.parse(readFileSync("package.json.bak", "utf8"));
  return packageJson.dependencies?.pepr
    ? packageJson.dependencies.pepr
    : "ERR_PACKAGE_IMPORT_NOT_DEFINED";
}
