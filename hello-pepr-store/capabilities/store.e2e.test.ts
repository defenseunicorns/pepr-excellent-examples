import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { secs, mins, timed, sleep } from "helpers/src/time";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";

const apply = async res => {
  return await fullCreate(res, kind);
};

const trc = new TestRunCfg(__filename);

describe("store.ts", () => {
  beforeAll(async () => await moduleUp(), mins(4));

  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(5));

  describe("module default store", () => {
    describe("data injection", () => {
      let logz;

      beforeAll(async () => {
        await timed("load+clear: default store data", async () => {
          await untilLogged('"msg":"onReady"', 4);
          logz = await logs();
        });
      }, mins(1));

      it(
        "can insert in onReady hook",
        async () => {
          const values = logz
            .filter(l => l.includes('"key":"https://onReady"'))
            .map(l => JSON.parse(l))
            .map(o => o.value)
            .slice(0, 3);

          expect(values).toEqual(["yep", "yep", "yep"]);
        },
        secs(10),
      );

      it(
        "can clear in onReady hook",
        async () => {
          const values = logz
            .filter(l => l.includes('"key":"https://onReady"'))
            .map(l => JSON.parse(l))
            .map(o => o.value)
            .slice(3);

          // both controller pods + watcher pod run onReady!
          expect(values).toEqual([
            undefined,
            undefined,
            undefined
          ]);
        },
        secs(10),
      );
    });

    describe("asynchronous interaction", () => {
      let logz;

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.async.yaml`;
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file);
          const applied = await apply(resources);
          await untilLogged('"msg":"removeItem"');
          logz = await logs();
        });
      }, mins(1));

      it(
        "key can be written, read, and removed",
        async () => {
          const messages = logz
            .filter(l => l.includes('"key":"https://async"'))
            .map(l => JSON.parse(l))
            .map(o => ({ msg: o.msg, value: o.value }));

          expect(messages).toStrictEqual([
            { msg: "setItem", value: "yep" },
            { msg: "getItem", value: "yep" },
            { msg: "removeItem", value: undefined },
          ]);
        },
        secs(10),
      );
    });

    describe("synchronous interaction", () => {
      let logz;

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.sync.yaml`;
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file);
          const applied = await apply(resources);

          await untilLogged('"msg":"removeItemAndWait"');
          logz = await logs();
        });
      }, mins(2));

      it(
        "key can be written, read, and removed",
        async () => {
          const messages = logz
            .filter(l => l.includes('"key":"https://sync"'))
            .map(l => JSON.parse(l))
            .map(o => ({ msg: o.msg, value: o.value }));

          expect(messages).toStrictEqual([
            { msg: "setItemAndWait", value: undefined },
            { msg: "getItem", value: "yep" },
            { msg: "removeItemAndWait", value: undefined },
          ]);
        },
        secs(10),
      );
    });

    describe("observed interaction", () => {
      let logz;

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.observe.yaml`;
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file);
          const applied = await apply(resources);

          await untilLogged('"msg":"observed"');
          logz = await logs();
        });
      }, mins(1));

      it(
        "sees batched update",
        async () => {
          const update = logz
            .filter(l => l.includes('"msg":"observed"'))
            .map(l => JSON.parse(l))
            .flatMap(o => o.updates)
            .filter(o => o.hasOwnProperty("v2-https://observed"));

          expect(update).toHaveLength(1);

          expect(update[0]).toEqual(
            expect.objectContaining({
              "v2-a": "1",
              "v2-b": "2",
              "v2-c": "3",
              "v2-https://observed": "yay",
            }),
          );
        },
        secs(10),
      );
    });
  });
});
