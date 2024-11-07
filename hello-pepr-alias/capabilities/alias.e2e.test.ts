import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, logs, untilLogged } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

const trc = new TestRunCfg(__filename);

describe("alias.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await clean(trc);
    await moduleDown();
  }, mins(2));

  describe("provides correct alias", () => {
    let logz: string[];
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        const [ns, cmReconcile, cmWatch, cmValidate, cmMutate] =
          await trc.load(file);
        await fullCreate([ns, cmReconcile, cmWatch, cmValidate, cmMutate]);
        await K8s(kind[cmReconcile.kind]).Delete(cmReconcile);
        await K8s(kind[cmWatch.kind]).Delete(cmWatch);
        await K8s(kind[cmValidate.kind]).Delete(cmValidate);
        await K8s(kind[cmMutate.kind]).Delete(cmMutate);
        await untilLogged(
          '"msg":"external api call (reconcile-create-alias): reconcile/finalize"',
        );
        await untilLogged(
          '"msg":"external api call (watch-create-alias): watch/finalize"',
        );
        await untilLogged(
          '"msg":"external api call (validate-create-alias): validate/callback"',
        );
        await untilLogged(
          '"msg":"external api call (mutate-create-alias): mutate/callback"',
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "uses default alias when no alias provided",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (reconcile-create-no-alias):'),
        );

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/no alias provided.*reconcile\/callback/),
          ]),
        );
      },
      secs(10),
    );

    it(
      "uses provided alias with reconcile",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (reconcile-create-alias):'),
        );

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(
              /alias:create:reconcile.*reconcile\/callback/,
            ),
            expect.stringMatching(
              /alias:create:reconcile.*reconcile\/finalize/,
            ),
          ]),
        );
      },
      secs(10),
    );

    it(
      "uses provided alias with watch",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (watch-create-alias):'),
        );

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/alias:create:watch.*watch\/callback/),
            expect.stringMatching(/alias:create:watch.*watch\/finalize/),
          ]),
        );
      },
      secs(10),
    );

    it(
      "uses provided alias with validate",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (validate-create-alias):'),
        );

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/alias:create:validate.*validate\/callback/),
          ]),
        );
      },
      secs(10),
    );

    it(
      "uses provided alias with mutate",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (mutate-create-alias):'),
        );

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/alias:create:mutate.*mutate\/callback/),
          ]),
        );
      },
      secs(10),
    );
  });
});
