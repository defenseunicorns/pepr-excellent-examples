import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
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
        // let [ ns, slow, fast ] = await trc.load(file)

        // await fullCreate([ns, slow, fast])  // slow = A, fast = X

        // await K8s(kind[slow.kind]).Apply({...slow, data: { note: "B"}})
        // await K8s(kind[slow.kind]).Apply({...slow, data: { note: "C"}})

        // await K8s(kind[fast.kind]).Apply({...fast, data: { note: "Y"}})
        // await K8s(kind[fast.kind]).Apply({...fast, data: { note: "Z"}})

        // await untilLogged("Callback: Reconciling cm-slow C-")
        // await untilLogged("Callback: Reconciling cm-fast Z-")
        logz = await logs();
      });
    }, mins(2));

    it.skip("cm-watch", () => {
      console.log("TODO")

      // verify that only Watch OR Finalize callbacks are called -- not both
    }, secs(10));

    it.skip("cm-reconcile", () => {
      console.log("TODO")

      // verify that only Reconcile OR Finalize callbacks are called -- not both
    }, secs(10));
  });
});
