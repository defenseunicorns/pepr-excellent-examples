import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

const trc = new TestRunCfg(__filename);

describe("deletion.ts", () => {
  beforeAll(async () => await moduleUp(3), mins(4));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  describe("tests WithDeletionTimestamp across admission and watch bindings", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.resources.yaml`;
      await timed(`load: ${file}`, async () => {
        const [
          ns1,
          ns2,
          ns1Admission,
          n1Watch,
          ns2Admission,
          ns2Watch,
          ns2Delete,
        ] = await trc.load(file);

        await fullCreate([
          ns1,
          ns2,
          ns1Admission,
          n1Watch,
          ns2Admission,
          ns2Watch,
          ns2Delete,
        ]);
        await K8s(kind.Pod)
          .InNamespace("hello-pepr-deletion-timestamp2")
          .Delete("ns2-delete");
        await untilLogged("DTS: Saw a pod ns1-admission.");
        await untilLogged("DTS: Saw a pod ns1-watch.");
        await untilLogged("DTS: Saw a pod ns2-delete.");
        logz = await logs();
      });
    }, mins(2));

    it(
      "tests that the filters match for watch and admission on update event",
      () => {
        const results = logz.filter(l => l.includes("DTS:"));
        const wants = [
          "DTS: Saw a pod ns1-admission.",
          "DTS: Saw a pod ns1-watch.",
        ];
        wants.forEach(wanted => {
          expect(JSON.stringify(results)).toContain(wanted);
        });
      },
      secs(10),
    );

    it(
      "tests that the filters do not match for watch and admission on update even with no deletionTimestamp",
      () => {
        const results = logz.filter(l => l.includes("DTS:"));
        const wants = [
          "DTS: Saw a pod ns2-admission.",
          "DTS: Saw a pod ns2-watch.",
        ];
        wants.forEach(wanted => {
          expect(JSON.stringify(results)).not.toContain(wanted);
        });
      },
      secs(10),
    );

    it(
      "tests that the filters match for watch on delete even with deletionTimestamp",
      () => {
        const results = logz.filter(l => l.includes("DTS:"));
        const wants = ["DTS: Saw a pod ns2-delete."];
        wants.forEach(wanted => {
          expect(JSON.stringify(results)).toContain(wanted);
        });
      },
      secs(10),
    );
  });
});
