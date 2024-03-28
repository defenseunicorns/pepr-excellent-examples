import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { kind } from "kubernetes-fluent-client";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster"

const trc = new TestRunCfg(__filename);

describe("reconcile.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown()
    await clean(trc)
  }, mins(2))

  describe("tests reconcile module", () => {
    let logz: string[]

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/reconcile.config.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        await fullCreate(resources, kind);
        await untilLogged("Callback: Reconciling cm-three");
        logz = await logs();
      });
    }, mins(1));

    it("maintains callback order even when execution times vary", () => {
      const results = logz.filter(l => l.includes("Callback: Reconciling"))
      expect(results[0]).toContain("cm-one")
      expect(results[1]).toContain("cm-two")
      expect(results[2]).toContain("cm-three")
    }, secs(10));
  });
});
