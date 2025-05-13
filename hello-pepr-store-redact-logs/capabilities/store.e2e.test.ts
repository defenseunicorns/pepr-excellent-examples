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

  describe("module default store redact logs", () => {
    describe("data injection", () => {
      let logz;

      beforeAll(async () => {
        await timed("load+clear: redacts store values", async () => {
          await untilLogged('"msg":"DONE"');
          logz = await logs();
        });
      }, mins(1));

      it("does not display store values in logs", () => {
          expect(logz).not.toContain("***SECRET***");
        },secs(10));
      });
    });
});
