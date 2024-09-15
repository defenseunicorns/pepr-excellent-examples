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
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ ns, cmWatch, cmReconcile ] = await trc.load(file)
        await fullCreate([ns, cmWatch, cmReconcile])

        await K8s(kind[cmWatch.kind]).Delete(cmWatch)
        await K8s(kind[cmReconcile.kind]).Delete(cmReconcile)

        await untilLogged("Removed finalizer: ", 2)
        logz = await logs();
      });
    }, mins(2));

    it("create", async () => {
      let results = logz.filter(l => l.includes('"msg":"external api call:'))

      expect(results).toEqual(expect.arrayContaining([
        expect.stringMatching("watch/create"),
        expect.stringMatching("reconcile/create"),
        expect.stringMatching("watch/delete"),
        expect.stringMatching("reconcile/delete")
      ]))
    }, secs(10));
  });
});
