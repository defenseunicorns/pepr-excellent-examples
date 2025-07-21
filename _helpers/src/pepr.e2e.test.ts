import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { kind } from "kubernetes-fluent-client";
import { mins, secs } from "./time";
import { gone } from "./resource";
import { chdir, cwd } from "node:process";
import { TestRunCfg } from "./TestRunCfg";
import { Cmd } from "./Cmd";
import { clean } from "./cluster";
import { readFile, rm, writeFile } from "node:fs/promises";
import { peprVersion, moduleUp, moduleDown, getPeprAlias } from "./pepr";

const trc = new TestRunCfg(__filename);

describe("module lifecycle", () => {
  const wipeMod = async mod => {
    await rm(mod, { recursive: true, force: true });
  };

  const readPkg = async mod => {
    const pkg = `${mod}/package.json`;
    return JSON.parse((await readFile(pkg)).toString());
  };

  const writePkg = async (mod, cfg) => {
    const pkg = `${mod}/package.json`;
    await writeFile(pkg, JSON.stringify(cfg, null, 2));
  };

  const makeMod = async (mod, ver, verbose = false) => {
    const env = { TEST_MODE: true, TS_NODE_PROJECT: `${mod}/tsconfig.json` };

    const cmd = `npx --yes ${getPeprAlias()} init --skip-post-init`;
    console.time(cmd);
    const init = await new Cmd({ env, cmd }).run();
    if (verbose) {
      console.log(init);
    }

    const cfg = await readPkg(mod);
    cfg.dependencies.pepr = ver;
    cfg.pepr.uuid = "00000000-0000-0000-0000-000000000000";
    await writePkg(mod, cfg);
    console.timeEnd(cmd);
  };

  const npmInst = async (mod, verbose = false) => {
    const cmd = "npm install";
    console.time(cmd);
    const original = cwd();
    chdir(mod);
    const install = await new Cmd({ cmd }).run();
    if (verbose) {
      console.log(install);
    }
    chdir(original);
    console.timeEnd(cmd);
  };

  const module = `${trc.root()}/pepr-test-module`;
  let version: string;

  beforeAll(async () => {
    version = await peprVersion();
    await wipeMod(module);
    await makeMod(module, version);
    await npmInst(module);
  }, mins(2));

  afterEach(async () => await clean(trc), mins(5));

  describe("moduleUp()", () => {
    it(
      "builds, deploys, and waits for local Pepr Module to come up",
      async () => {
        const timeEnd = vi.spyOn(console, "timeEnd");

        const original = cwd();
        chdir(module);
        await moduleUp(1, { version });
        chdir(original);

        expect(timeEnd).toHaveBeenCalledWith(`pepr@${version} ready (total time)`);

        timeEnd.mockRestore();
      },
      mins(2),
    );
  });

  // assumes moduleUp() has already run!
  describe("moduleDown()", () => {
    beforeAll(async () => {
      const original = cwd();
      chdir(module);
      await moduleDown();
      chdir(original);
    }, mins(5));

    it(
      'removes the "pepr-system" namespace',
      async () => {
        const name = "pepr-system";

        expect(await gone(kind.Namespace, { metadata: { name } })).toBe(true);
      },
      secs(10),
    );

    it(
      'removes the "peprstores.pepr.dev" custom resource definition',
      async () => {
        const name = "peprstores.pepr.dev";

        expect(await gone(kind.CustomResourceDefinition, { metadata: { name } })).toBe(true);
      },
      secs(10),
    );

    it(
      'removes the "pepr-${module-uuid}" cluster role binding',
      async () => {
        const cfg = await readPkg(module);
        const name = `pepr-${cfg.pepr.uuid}`;

        expect(await gone(kind.ClusterRoleBinding, { metadata: { name } })).toBe(true);
      },
      secs(10),
    );

    it(
      'removes the "pepr-${module-uuid}" cluster role',
      async () => {
        const cfg = await readPkg(module);
        const name = `pepr-${cfg.pepr.uuid}`;

        expect(await gone(kind.ClusterRole, { metadata: { name } })).toBe(true);
      },
      secs(10),
    );
  });
});
