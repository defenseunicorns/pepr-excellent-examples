import { afterAll, beforeAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, sleep } from "helpers/src/time";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";

new TestRunCfg(__filename);

const delta = (one, two, firstRunDelay = secs(10)) => {
  // firstRunDelay --> { every: 10, unit: "seconds" }
  //  because schedule waits "every" period before firing first time

  const duration = two - one;
  const milliseconds = duration - firstRunDelay;
  const seconds = milliseconds / 1000;
  return { milliseconds, seconds };
};

describe("schedule.ts", () => {
  beforeAll(async () => {
    await moduleUp();
  }, mins(3));
  afterAll(async () => {
    await moduleDown();
  }, mins(2));

  it(
    "runs forever",
    async () => {
      const needle = `"schedule":"forever"`;
      await untilLogged(needle);

      // long enough to catch arbitrarily-many add'l scheduled runs
      await sleep(20);

      const expected = 1 + 20 / 10; // first + <wait seconds> / <rescheduled delay>
      const count = (await logs()).filter(f => f.includes(needle)).length;
      expect(count).toBe(expected);
    },
    secs(45),
  );

  it(
    "runs n times",
    async () => {
      const needle = `"schedule":"n-times"`;
      await untilLogged(needle, 2);

      // long enough to catch add'l scheduled run (should it occur)
      await sleep(15);

      const count = (await logs()).filter(f => f.includes(needle)).length;
      expect(count).toBe(2);
    },
    secs(45),
  );

  it(
    "runs once, asap",
    async () => {
      const needle = `"schedule":"once-asap"`;
      await untilLogged(needle);

      const logz = await logs();
      const { hostname: host, time: run } = JSON.parse(
        logz.filter(f => f.includes(needle))[0],
      );
      const { time: startup } = JSON.parse(
        logz.filter(
          f =>
            f.includes(`"msg":"✅ Scheduling processed"`) &&
            f.includes(`"hostname":"${host}"`),
        )[0],
      );
      const { seconds } = delta(startup, run);

      expect(seconds).toBeLessThan(5);
    },
    secs(30),
  );

  it(
    "runs once, delayed",
    async () => {
      const needle = `"schedule":"once-delayed"`;
      await untilLogged(needle);

      const logz = await logs();
      const { time: got, want } = JSON.parse(
        logz.filter(f => f.includes(needle))[0],
      );

      const { seconds } = delta(want, got);
      expect(seconds).toBeLessThan(10);
    },
    secs(30),
  );
});
