import { beforeAll, describe, it, expect, afterAll } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins } from "helpers/src/time";
import { kind } from "kubernetes-fluent-client";
import { K8s } from "pepr";
import { execSync } from "child_process";
import { moduleUp, moduleDown } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";

const trc = new TestRunCfg(__filename);

const PodMap: Map<string, number> = new Map();

const getPodsInPeprDemo = async () => {
  const pods = await K8s(kind.Pod).InNamespace("pepr-demo").Get();
  return pods.items;
};

const updateMap = (
  podMap: Map<string, number>,
  podList: kind.Pod[],
): Map<string, number> => {
  for (const pod of podList) {
    const name = pod.metadata.name;
    podMap.set(name, (podMap.get(name) ?? 0) + 1);
  }
  return podMap;
};

const runCommand = (command: string) => {
  try {
    const output = execSync(command, { stdio: "inherit" });
    console.log("Command executed successfully:", output);
  } catch (error) {
    console.error("Error executing command:", error.message);
  }
};

describe("soak-ci.ts", () => {
  beforeAll(async () => {
    try {
      runCommand(
        `kubectl apply -f ${trc.root()}/capabilities/soak-ci.config.yaml`,
      );
      execSync(`sleep 20`);
      runCommand(
        `kubectl wait --for=condition=ready -n istio-system pod -l istio=pilot`,
      );
      runCommand(
        `kubectl wait --for=condition=ready -n istio-system pod -l app=istio-ingressgateway`,
      );
      runCommand(
        `kubectl wait --for=condition=ready -n watch-auditor pod -l app=watch-auditor`,
      );
      runCommand(
        "kubectl run metrics-collector -n watch-auditor --image=nginx --restart=Never",
      );
    } catch (error) {
      console.error("Error during setup:", error.message);
    }

    await moduleUp();
  }, mins(5));

  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(4));

  it("initial test to satisfy Jest", () => {
    expect(true).toBe(true);
  });

  const testIntervals = [1, 30, 60, 90, 120]; // times in minutes
  testIntervals.forEach((interval, index) => {
    it(`test run ${index + 1} after ${interval} minutes`, async () => {
      await new Promise(resolve => setTimeout(resolve, mins(interval)));

      const podList = await getPodsInPeprDemo();
      updateMap(PodMap, podList);

      PodMap.forEach(value => {
        expect(value).toBeLessThan(2);
      });

      // Run additional commands
      runCommand(
        "kubectl exec -it metrics-collector -n watch-auditor -- curl watch-auditor:8080/metrics  | grep watch_controller_failures_total >> logs/auditor-log.txt",
      );
      runCommand("cat logs/auditor-log.txt");

      runCommand(
        'kubectl exec -it metrics-collector -n watch-auditor -- curl -k https://pepr-soak-ci-watcher.pepr-system.svc.cluster.local/metrics  | egrep -E "pepr_cache_miss|pepr_resync_failure_count" >> logs/informer-log.txt',
      );
      runCommand("cat logs/informer-log.txt");
    });
  });
});
