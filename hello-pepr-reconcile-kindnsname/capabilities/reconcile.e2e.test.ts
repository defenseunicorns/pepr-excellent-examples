import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

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
      const file = `${trc.root()}/capabilities/scenario.resources.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ nsOne, nsTwo, cmSlow, cmFast, seSlow, seFast ] = await trc.load(file)
        await fullCreate([nsOne, nsTwo])

        await K8s(kind[cmSlow.kind]).Apply({...cmSlow }) // note "A"
        await K8s(kind[cmFast.kind]).Apply({...cmFast }) // note "D"
        await K8s(kind[seSlow.kind]).Apply({...seSlow }) // note "Q"
        await K8s(kind[seFast.kind]).Apply({...seFast }) // note "T"

        await K8s(kind[cmSlow.kind]).Apply({...cmSlow, data: { note: "B"}})
        await K8s(kind[cmFast.kind]).Apply({...cmFast, data: { note: "E"}})
        await K8s(kind[seSlow.kind]).Apply({...seSlow, stringData: { note: "R"}})
        await K8s(kind[seFast.kind]).Apply({...seFast, stringData: { note: "U"}})

        await K8s(kind[cmSlow.kind]).Apply({...cmSlow, data: { note: "C"}})
        await K8s(kind[cmFast.kind]).Apply({...cmFast, data: { note: "F"}})
        await K8s(kind[seSlow.kind]).Apply({...seSlow, stringData: { note: "S"}})
        await K8s(kind[seFast.kind]).Apply({...seFast, stringData: { note: "V"}})

        await untilLogged("Callback: Reconciling cm-fast F-")
        await untilLogged("Callback: Reconciling se-fast V-")
        await untilLogged("Callback: Reconciling cm-slow C-")
        await untilLogged("Callback: Reconciling se-slow S-")
        logz = await logs();
      });
    }, mins(2));

    it("maintains callback order within a queue, paralellizes across queues", () => {
      // Queue - Resource - 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
      // 
      // 1     - cm-slow  - |+ A          -|+ B          -|+ C         - |
      // 2     - cm-fast  - |+ D    -|+ E    -|+ F    -|
      // 3     - se-slow  - |+ Q          -|+ R          -|+ S         - |
      // 4     - se-fast  - |+ T    -|+ U    -|+ V    -|
      //
      // ^-- read: l-to-r (time), t-to-b (event @ time)
      //     remember: within a queue events complete (-) before subsequents start (+)
      const results = logz.filter(l => l.includes("Callback: Reconciling"))

      let wants = [
        "cm-slow A+",
        "cm-fast D+",
        "se-slow Q+",
        "se-fast T+",
        "cm-fast D-",
        "cm-fast E+",
        "se-fast T-",
        "se-fast U+",
        "cm-slow A-",
        "cm-slow B+",
        "se-slow Q-",
        "se-slow R+",
        "cm-fast E-",
        "cm-fast F+",
        "se-fast U-",
        "se-fast V+",
        "cm-fast F-",
        "se-fast V-",
        "cm-slow B-",
        "cm-slow C+",
        "se-slow R-",
        "se-slow S+",
        "cm-slow C-",
        "se-slow S-",
      ]
      wants.forEach((wanted, atIndex) => {
        expect(results[atIndex]).toContain(wanted)
      })
    }, secs(10));
  });
});
