import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins } from "helpers/src/time";
import {untilTrue } from "helpers/src/general";
import { K8s, kind } from "kubernetes-fluent-client";
import { clean } from "helpers/src/cluster";
import { live } from "helpers/src/resource";
import { moduleUp, moduleDown, untilLogged } from "helpers/src/pepr";
import { CM } from "./schedule"


describe("schedule.ts", () => {
  beforeAll(async () => {
    await moduleUp()
    await untilLogged("Scheduling processed");
  }, mins(4));
  // afterAll(async () => {
  //   await moduleDown();
  //   await clean(trc);
  // }, mins(2));

  /*
   * 2 schedules - 1 updating the count var every 10s for 3 completions
   * and 1 updating a config map after 50s.
   * Assert that after Test Completed is logged, the count is 4,
   * meaning that the 3 completions and the startTime were respected
   */
  it("it respects completions and startTime", async () => {
    await untilLogged("Watched create-me: create");
    await untilTrue(() => live(kind.ConfigMap, CM))
    const countCM = await K8s(kind.ConfigMap).InNamespace(CM.metadata.namespace).Get(CM.metadata.name);
    expect(countCM.data.count).toBe("4");
  }, mins(2));
});
