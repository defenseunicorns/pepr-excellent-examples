import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { secs, mins, sleep, timed } from "helpers/src/time";
import { K8s, kind } from "kubernetes-fluent-client";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
const trc = new TestRunCfg(__filename);

// KUBECONFIG=$(k3d kubeconfig write pexex-hello-pepr-reconcile-e2e) k9s
describe("reconcile.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => await moduleDown(), mins(2))

  const LOG_RESULTS: string[] = ["three", "two", "one"];

  describe("tests reconcile module", () => {
    let logz: string[] = [];
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/reconcile.config.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        await fullCreate(resources, kind);
        await untilLogged("Callback: Reconciling svc-three");
        logz = await logs();
      });
    }, mins(1));
    it("maintains callback order in a queue when execution times vary", async () => {
      for (const l of logz) {
        if (l.includes(`Callback: Reconciling svc-${LOG_RESULTS[LOG_RESULTS.length - 1]}`)) {
          LOG_RESULTS.pop()
        }
      }
      expect(LOG_RESULTS).toHaveLength(0);
    });
  });
});
