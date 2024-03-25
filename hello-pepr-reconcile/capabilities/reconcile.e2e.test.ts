import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { secs, sleep, mins } from 'helpers/src/time';
import { moduleUp, moduleDown } from 'helpers/src/pepr';
import { K8s, kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/";
import { Log as K8sLog, KubeConfig } from "@kubernetes/client-node";
import stream from "stream";
const trc = new TestRunCfg(__filename)

/*
 "jest", [
      "--testPathPattern", ".*\.unit\.test\.ts",
      "--verbose",
      ...passthru
      */
describe("reconcile.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  afterAll(async () => await moduleDown(), mins(2))

  const LOG_RESULTS: string[]  = ["three", "two", "one"];

  it("maintains callback order in a queue when execution time varies", async () => {
    const svcOne = async () => await K8s(kind.Service).Apply({
      metadata: { name: "pass-one", namespace: "pepr-demo" },
      spec: { selector: { app: "pass" }, ports: [{ port: 80 }] },
    })
    const svcTwo = async () => await K8s(kind.Service).Apply({
      metadata: { name: "pass-two", namespace: "pepr-demo" },
      spec: { selector: { app: "pass" }, ports: [{ port: 80 }] },
    })
    const svcThree = async () => await K8s(kind.Service).Apply({
      metadata: { name: "pass-three", namespace: "pepr-demo" },
      spec: { selector: { app: "pass" }, ports: [{ port: 80 }] },
    })

    try {
      await Promise.all([svcOne(), svcTwo(), svcThree()])
    } catch (e) {
      console.error(e)
      expect(e).toBeUndefined()
    }

    await sleep(secs(60))

    const kc = new KubeConfig();
    kc.loadFromDefault();

    const log = new K8sLog(kc);

    const logStream = new stream.PassThrough();

    logStream.on("data", chunk => {
      const targetMessage = "Callback: Reconciling svc-";
      const lines = chunk.toString().split("\n");

      for (const line of lines) {
        if (line.includes(targetMessage)) {
          console.log(line);

          if(line.includes(LOG_RESULTS[LOG_RESULTS.length - 1])) {
            LOG_RESULTS.pop();
          }
        }
      }
    });

    const pods = await K8s(kind.Pod)
      .InNamespace("pepr-system")
      .WithLabel("pepr.dev/controller", "admission")
      .Get();

    const podNames = pods.items.flatMap(pod => pod.metadata!.name) as string[];
    expect(podNames.length).toBeGreaterThan(0);
    if (podNames.length < 1) {
      console.error("No pods found, is module deployed?");
      process.exit(1);
    }

    for (const podName of podNames) {
      await log.log("pepr-system", podName, "server", logStream, {
        // follow: true,
        pretty: false,
        timestamps: false,
      });
    }
  });
})




