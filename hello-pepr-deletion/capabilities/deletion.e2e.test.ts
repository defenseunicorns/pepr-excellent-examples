import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { kind } from "kubernetes-fluent-client";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";

const trc = new TestRunCfg(__filename);

describe("deletion.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  describe("tests deletion module", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/deletion.config.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        await fullCreate(resources, kind);
        await untilLogged("DONE");
        logz = await logs();
      });
    }, mins(1));

    it(
      "Runs WithDeletionTimestamp on Watch, Mutate, Validate",
      () => {
        const results = logz.filter(l => l.includes("WithDeletionTimestam"));
        expect(results).toContain("WithDeletionTimestamp: Watch");
        expect(results).toContain("WithDeletionTimestamp: Mutate");
        expect(results).toContain("WithDeletionTimestamp: Validate");
        expect(results).toContain("WithDeletionTimestamp: MutateBlock");
        expect(results).toContain("WithDeletionTimestamp: ValidateBlock");
        expect(results).toContain("WithDeletionTimestamp: WatchBlock");
      },
      secs(30),
    );
  });
});
