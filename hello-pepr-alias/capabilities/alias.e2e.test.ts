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

  describe("reconcile - finalize", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ns, cmReconcile] = await trc.load(file);
        await fullCreate([ns, cmReconcile]);
        await K8s(kind[cmReconcile.kind]).Delete(cmReconcile);
        await untilLogged(
          '"msg":"external api call (reconcile-create-alias): reconcile/finalize"',
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
      "uses default alias when no alias provided",
      async () => {
        let results = logz.filter(l =>
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
  });

  /* describe("create - watch - finalize", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ns, cmWatch] = await trc.load(file);
        await fullCreate([ns, cmWatch]);
        await K8s(kind[cmWatch.kind]).Delete(cmWatch);
        await untilLogged(
          '"msg":"external api call (watch-create-alias): watch/finalize"',
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "uses provided alias",
      async () => {
        let results = logz.filter(l =>
          l.includes('"msg":"external api call (watch-create-alias):'),
        );

        console.log("watch results: ", results);

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/alias:create:watch.*watch\/callback/),
            expect.stringMatching(/alias:create:watch.*watch\/finalize/),
          ]),
        );
      },
      secs(10),
    );
  }); */

  /* describe("create - validate", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ns, cmValidate] = await trc.load(file);
        await fullCreate([ns, cmValidate]);
        await K8s(kind[cmValidate.kind]).Delete(cmValidate);
        await untilLogged(
          '"msg":"external api call (validate-create-alias): validate/callback"',
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "uses provided alias",
      async () => {
        let results = logz.filter(l =>
          l.includes('"msg":"external api call (validate-create-alias):'),
        );

        console.log("validate results: ", results);

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/alias:create:validate.*validate\/callback/),
          ]),
        );
      },
      secs(10),
    );
  }); */

  /* describe("create - mutate", () => {
    let logz: string[];
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ns, cmMutate] =
          await trc.load(file);
        await fullCreate([ns, cmMutate]);
        await K8s(kind[cmMutate.kind]).Delete(cmMutate);
        await untilLogged(
          '"msg":"external api call (mutate-create-alias): mutate/callback"',
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "uses provided alias",
      async () => {
        let results = logz.filter(l =>
          l.includes('"msg":"external api call (mutate-create-alias):'),
        );

        console.log("mutate results: ", results);

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/alias:create:mutate.*mutate\/callback/),
          ]),
        );
      },
      secs(10),
    );
  }); */
});
