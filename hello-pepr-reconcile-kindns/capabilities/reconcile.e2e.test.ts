import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

const trc = new TestRunCfg(__filename);

describe("reconcile.ts", () => {
  beforeAll(async () => await moduleUp(1), mins(4));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  describe("tests reconcile module", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.resources.yaml`;
      await timed(`load: ${file}`, async () => {
        const [nsOne, nsTwo, cmSlow, cmFast, seSlow, seFast] =
          await trc.load(file);
        await fullCreate([nsOne, nsTwo]);

        await K8s(kind[cmSlow.kind]).Apply({ ...cmSlow }); // note "A"
        await K8s(kind[cmFast.kind]).Apply({ ...cmFast }); // note "D"
        await K8s(kind[seSlow.kind]).Apply({ ...seSlow }); // note "Q"
        await K8s(kind[seFast.kind]).Apply({ ...seFast }); // note "T"

        await K8s(kind[cmSlow.kind]).Apply({ ...cmSlow, data: { note: "B" } });
        await K8s(kind[cmFast.kind]).Apply({ ...cmFast, data: { note: "E" } });
        await K8s(kind[seSlow.kind]).Apply({
          ...seSlow,
          stringData: { note: "R" },
        });
        await K8s(kind[seFast.kind]).Apply({
          ...seFast,
          stringData: { note: "U" },
        });

        await K8s(kind[cmSlow.kind]).Apply({ ...cmSlow, data: { note: "C" } });
        await K8s(kind[cmFast.kind]).Apply({ ...cmFast, data: { note: "F" } });
        await K8s(kind[seSlow.kind]).Apply({
          ...seSlow,
          stringData: { note: "S" },
        });
        await K8s(kind[seFast.kind]).Apply({
          ...seFast,
          stringData: { note: "V" },
        });

        await untilLogged("Callback: Reconciling se-fast V-");
        await untilLogged("Callback: Reconciling se-slow S-");
        await untilLogged("Callback: Reconciling cm-fast F-");
        logz = await logs();
      });
    }, mins(2));

    it(
      "maintains callback order within a queue, paralellizes across queues",
      () => {
         
        // Queue : Resource : 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
        //
        // 1     : cm-slow  : |+ A          -|        |+ B          -|        |+ C         - |
        // 1     : cm-fast  :                |+ D    -|              |+ E    -|              |+ F    -|
        // 2     : se-slow  : |+ Q          -|+ R          -|+ S         - |
        // 3     : se-fast  : |+ T    -|+ U    -|+ V    -|
        //
        // ^-- read: l-to-r (time), t-to-b (event @ time)
        //     remember: within a queue events complete (-) before subsequents start (+)
         
        const results = logz.filter(l => l.includes("Callback: Reconciling"));

        const wants = [
          "cm-slow A+",
          "se-slow Q+",
          "se-fast T+",
          "se-fast T-",
          "se-fast U+",
          "cm-slow A-",
          "cm-fast D+",
          "se-slow Q-",
          "se-slow R+",
          "se-fast U-",
          "se-fast V+",
          "cm-fast D-",
          "cm-slow B+",
          "se-fast V-",
          "se-slow R-",
          "se-slow S+",
          "cm-slow B-",
          "cm-fast E+",
          "se-slow S-",
          "cm-fast E-",
          "cm-slow C+",
          "cm-slow C-",
          "cm-fast F+",
          "cm-fast F-",
        ];
        wants.forEach((wanted, atIndex) => {
          expect(results[atIndex]).toContain(wanted);
        });
      },
      secs(10),
    );
  });
});
