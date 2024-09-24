import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed, sleep } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind, Log } from "pepr";

const trc = new TestRunCfg(__filename);

describe("alias.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await clean(trc);
    await moduleDown();
  }, mins(2));

  describe("create - reconcile - finalize", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ns, cmReconcile, cmWatch] = await trc.load(file);
        await fullCreate([ns, cmReconcile, cmWatch]);

        await K8s(kind[cmReconcile.kind]).Delete(cmReconcile);
        await K8s(kind[cmWatch.kind]).Delete(cmWatch);

        await untilLogged(
          "Removed finalizer 'pepr.dev/finalizer' from 'hello-pepr-finalize-create/",
          2,
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "uses provided alias",
      async () => {
        let results = logz.filter(l =>
          l.includes('"msg":"external api call (reconcile-create-alias):'),
        );

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching("alias:create:reconcile"),
            expect.stringMatching("alias:create:reconcile:finalize"),
          ]),
        );
      },
      secs(10),
    );

    it(
      "uses default alias",
      async () => {
        let results = logz.filter(l =>
          l.includes(
            '"msg":"external api call (reconcile-create-default-alias):',
          ),
        );

        expect(results).toEqual(
          expect.arrayContaining([expect.stringMatching("no alias provided")]),
        );
      },
      secs(10),
    );

    it(
      "does not log alias if alias child logger not used",
      async () => {
        let results = logz.filter(l =>
          l.includes(
            '"msg":"external api call (reconcile-create-no-child-logger):',
          ),
        );

        expect(results).toEqual(
          expect.not.arrayContaining([expect.stringMatching('\"alias\":')]),
        );
      },
      secs(10),
    );
  });
});
