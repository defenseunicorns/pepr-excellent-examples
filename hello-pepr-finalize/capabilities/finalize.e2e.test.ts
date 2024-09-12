import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed, sleep } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

const trc = new TestRunCfg(__filename);

describe("finalize.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown()
    await clean(trc)
  }, mins(2))

  describe("tests finalize", () => {
    let logz: string[]

     beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.resources.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ ns, cmWatch, cmReconcile ] = await trc.load(file)
        await fullCreate([ns, cmWatch, cmReconcile])

        // await K8s(kind[cmWatch.kind]).InNamespace(cmWatch.metadata.namespace).Delete(cmWatch.metadata.name)
        // await K8s(kind[cmReconcile.kind]).InNamespace(cmReconcile.metadata.namespace).Delete(cmReconcile.metadata.name)

        await sleep(110);
        // await untilLogged("Removed finalizer: ", 2)
        logz = await logs();
      });
    }, mins(2));

    it("cm-watch", async () => {
      let results = logz.filter(l => l.includes('TODO: '))
      console.log(results)
      await sleep(mins(9))
      expect(true).toBe(false);
    }, mins(10));
    // }, secs(10));

    it.skip("cm-reconcile", () => {
      console.log("TODO")
    }, secs(10));
  });
});
