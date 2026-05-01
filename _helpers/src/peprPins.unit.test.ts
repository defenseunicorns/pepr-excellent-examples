import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as pfs from "fs/promises";
import * as os from "os";
import { existsSync } from "fs";
import { rewriteWorkspacePeprPins, restoreWorkspacePeprPins } from "./peprPins";

const writeJson = async (path: string, content: object) =>
  pfs.writeFile(path, JSON.stringify(content, null, 2) + "\n");

const readJson = async (path: string) => JSON.parse(await pfs.readFile(path, "utf8"));

describe("peprPins", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await pfs.mkdtemp(`${os.tmpdir()}/peprPins-`);
    await writeJson(`${rootDir}/package.json`, {
      name: "fixture-root",
      workspaces: ["wsA", "wsB", "wsC", "wsDev", "_helpers", "missing-on-disk"],
    });
    await pfs.mkdir(`${rootDir}/wsA`, { recursive: true });
    await pfs.mkdir(`${rootDir}/wsB`, { recursive: true });
    await pfs.mkdir(`${rootDir}/wsC`, { recursive: true });
    await pfs.mkdir(`${rootDir}/wsDev`, { recursive: true });
    await pfs.mkdir(`${rootDir}/_helpers`, { recursive: true });

    await writeJson(`${rootDir}/wsA/package.json`, {
      name: "wsA",
      dependencies: { pepr: "1.1.5", "kubernetes-fluent-client": "^3.0.0" },
      devDependencies: { typescript: "5.8.3" },
    });
    await writeJson(`${rootDir}/wsB/package.json`, {
      name: "wsB",
      devDependencies: { typescript: "5.8.3" },
    });
    await writeJson(`${rootDir}/wsC/package.json`, {
      name: "wsC",
      peerDependencies: { pepr: "^1.0.0" },
    });
    await writeJson(`${rootDir}/wsDev/package.json`, {
      name: "wsDev",
      devDependencies: { pepr: "1.0.0" },
    });
    await writeJson(`${rootDir}/_helpers/package.json`, {
      name: "helpers",
      devDependencies: { vitest: "*" },
    });
  });

  afterEach(async () => {
    await pfs.rm(rootDir, { recursive: true, force: true });
  });

  describe("rewriteWorkspacePeprPins()", () => {
    it("rewrites `pepr` in dependencies and creates a sidecar backup", async () => {
      const rewritten = rewriteWorkspacePeprPins(rootDir, "file:/tmp/p.tgz");

      expect(rewritten).toEqual(expect.arrayContaining(["wsA"]));

      const updated = await readJson(`${rootDir}/wsA/package.json`);
      expect(updated.dependencies.pepr).toBe("file:/tmp/p.tgz");
      expect(updated.dependencies["kubernetes-fluent-client"]).toBe("^3.0.0");
      expect(updated.devDependencies.typescript).toBe("5.8.3");

      const backup = await readJson(`${rootDir}/wsA/package.json.peprPin.bak`);
      expect(backup.dependencies.pepr).toBe("1.1.5");
    });

    it("rewrites `pepr` in peerDependencies", async () => {
      rewriteWorkspacePeprPins(rootDir, "file:/tmp/p.tgz");
      const updated = await readJson(`${rootDir}/wsC/package.json`);
      expect(updated.peerDependencies.pepr).toBe("file:/tmp/p.tgz");
    });

    it("rewrites `pepr` in devDependencies", async () => {
      rewriteWorkspacePeprPins(rootDir, "latest");
      const updated = await readJson(`${rootDir}/wsDev/package.json`);
      expect(updated.devDependencies.pepr).toBe("latest");
    });

    it("skips workspaces without a `pepr` dep entry", async () => {
      const rewritten = rewriteWorkspacePeprPins(rootDir, "file:/tmp/p.tgz");
      expect(rewritten).not.toContain("wsB");
      expect(rewritten).not.toContain("_helpers");
      expect(existsSync(`${rootDir}/wsB/package.json.peprPin.bak`)).toBe(false);
      expect(existsSync(`${rootDir}/_helpers/package.json.peprPin.bak`)).toBe(false);
    });

    it("ignores workspaces whose dir or package.json is missing", () => {
      const rewritten = rewriteWorkspacePeprPins(rootDir, "file:/tmp/p.tgz");
      expect(rewritten).not.toContain("missing-on-disk");
    });

    it("returns the list of rewritten workspaces", () => {
      const rewritten = rewriteWorkspacePeprPins(rootDir, "file:/tmp/p.tgz");
      expect(rewritten.sort()).toEqual(["wsA", "wsC", "wsDev"]);
    });

    it("is idempotent — second call does not stomp the original backup", async () => {
      rewriteWorkspacePeprPins(rootDir, "file:/tmp/first.tgz");
      const firstBackup = await readJson(`${rootDir}/wsA/package.json.peprPin.bak`);
      rewriteWorkspacePeprPins(rootDir, "file:/tmp/second.tgz");
      const secondBackup = await readJson(`${rootDir}/wsA/package.json.peprPin.bak`);
      expect(secondBackup.dependencies.pepr).toBe(firstBackup.dependencies.pepr);
      expect(secondBackup.dependencies.pepr).toBe("1.1.5");

      const updated = await readJson(`${rootDir}/wsA/package.json`);
      expect(updated.dependencies.pepr).toBe("file:/tmp/second.tgz");
    });
  });

  describe("restoreWorkspacePeprPins()", () => {
    it("restores files from sidecar backups", async () => {
      rewriteWorkspacePeprPins(rootDir, "file:/tmp/p.tgz");
      const restored = restoreWorkspacePeprPins(rootDir);

      expect(restored.sort()).toEqual(["wsA", "wsC", "wsDev"]);

      const wsA = await readJson(`${rootDir}/wsA/package.json`);
      expect(wsA.dependencies.pepr).toBe("1.1.5");
      expect(existsSync(`${rootDir}/wsA/package.json.peprPin.bak`)).toBe(false);

      const wsC = await readJson(`${rootDir}/wsC/package.json`);
      expect(wsC.peerDependencies.pepr).toBe("^1.0.0");
    });

    it("returns an empty list when nothing was rewritten", () => {
      const restored = restoreWorkspacePeprPins(rootDir);
      expect(restored).toEqual([]);
    });

    it("does not touch workspaces without a backup", async () => {
      rewriteWorkspacePeprPins(rootDir, "file:/tmp/p.tgz");
      restoreWorkspacePeprPins(rootDir);
      const wsB = await readJson(`${rootDir}/wsB/package.json`);
      expect(wsB.devDependencies.typescript).toBe("5.8.3");
      expect(wsB).not.toHaveProperty("dependencies.pepr");
    });
  });
});
