import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { secs, mins, sleep, timed } from "helpers/src/time";
import { K8s, kind } from "kubernetes-fluent-client";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
const trc = new TestRunCfg(__filename);

/*
 * The purpose of this test is to demonstrate that the reconcile module
 * correctly processes resources in the order they are received.
 */


describe("reconcile.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => await moduleDown(), mins(2))

  describe("tests reconcile module", () => {
    let logz: string[] = [];
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/reconcile.config.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        await fullCreate(resources, kind);
        await untilLogged("Callback: Reconciling cm-three");
        logz = await logs();
      });
    }, mins(1));
    it("maintains callback order in a queue when execution times vary", () => {

      const results = logz.filter(l => l.includes("Callback: Reconciling"))
      expect(results[0]).toContain("cm-one")
      expect(results[1]).toContain("cm-two")
      expect(results[2]).toContain("cm-three")

    });
  });
});
