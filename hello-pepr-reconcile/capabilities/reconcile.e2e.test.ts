import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { kind } from "kubernetes-fluent-client";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster"
import { execSync } from "child_process";

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
        execSync(`sh ${trc.root()}/capabilities/script.sh`);
        await untilLogged("Callback: Reconciling cm-three");
        logz = await logs();
      });
    }, mins(2));

    it("maintains callback order even when execution times vary", () => {
      const results = logz.filter(l => l.includes("Callback: Reconciling"))
      expect(results[0]).toContain("cm-one")
      expect(results[1]).toContain("cm-two")
      expect(results[2]).toContain("cm-three")
    }, secs(10));

    it("assert that each Queue still runs in order and that they run independent", () => {
      const allResults = logz.filter(l => l.includes("Pod with name"))
      const aStack: string[] = ["Pod with name a has color red", "Pod with name a has color green", "Pod with name a has color blue","Pod with name a has color yellow"]
      const bStack: string[] = ["Pod with name b has color red", "Pod with name b has color green", "Pod with name b has color blue"]
      
      /* 
       * Background - Tests that each stack run independently.
       * all aStack results should be before bStack results
       * even though they were created at the same time.
       * 
       * aStack and bStack independently should run in the order they were created in the queue.
       */

      // Combine results in the order in quick they should be processed
      const abStack = [...aStack, ...bStack]
      allResults.forEach((result) => {
        if(result.includes(abStack[0])) {
          abStack.shift()
        }
      })
      expect(abStack.length).toEqual(0)


    }, mins(3));
  });
});
