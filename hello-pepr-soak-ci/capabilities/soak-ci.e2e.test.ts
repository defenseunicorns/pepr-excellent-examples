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

const testMap = (podMap: Map<string, number>) => {
  it("stuck pod should never live beyond the relist window of 30 mins", () => {
    console.log(JSON.stringify(podMap));
    podMap.forEach(value => {
      expect(value).toBeLessThan(2);
      if (value >= 2) {
        process.exit(1);
      }
    });
  });
};

const triggerTest = async (): Promise<void> => {
  const podList = await getPodsInPeprDemo();
  updateMap(PodMap, podList);
  testMap(PodMap);
};

setInterval(
  () => {
    execSync(
      "kubectl exec -it metrics-collector -n watch-auditor -- curl watch-auditor:8080/metrics  | grep watch_controller_failures_total > logs/auditor-log.txt",
    );
    execSync("cat logs/auditor-log.txt");
    execSync(
      "kubectl exec -it metrics-collector -n watch-auditor -- curl -k https://pepr-soak-ci-watcher.pepr-system.svc.cluster.local/metrics  |  egrep -E \"pepr_cache_miss|pepr_resync_failure_count\" > logs/informer-log.txt",
    );
    execSync("cat logs/informer-log.txt");
  },
  5 * 60 * 1000,
);

describe("soak-ci.ts", () => {
  beforeAll(async () => {
    try {
      const output = execSync(
        `kubectl apply -f ${trc.root()}/capabilities/soak-ci.config.yaml`, { stdio: 'inherit' }
      );
      console.log('Command executed successfully:', output.toString());
      execSync(
        `sleep 20`,
      );
      execSync(
        `kubectl wait --for=condition=ready -n istio-system pod -l istio=pilot --timeout=300s`,
      );
      execSync(
        `kubectl wait --for=condition=ready -n istio-system pod -l app=istio-ingressgateway --timeout=300s`,
      );
      execSync(
        `kubectl wait --for=condition=ready -n watch-auditor pod -l app=watch-auditor --timeout=300s`,
      );
      execSync(
        "kubectl run metrics-collector -n watch-auditor --image=nginx --restart=Never --timeout=300s",
      );
    } catch (error) {
      console.error('Error executing command:', error.message);
      console.error('Error code:', error.status);
      console.error('Standard Error output:', error.stderr.toString());
    }

    await moduleUp();
  }, mins(4));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(4));

  it("initial test to satisfy Jest", () => {
    expect(true).toBe(true); // You MUST do this in order to not get hit with "Your test suite must contain at least one test."
  });

  // describe("soak test the informer", () => {
  setTimeout(async () => {
    // first test immediately after 15 mins
    await triggerTest();

    // 4 mmore tests every 30 mins
    Array.from({ length: 4 }).forEach((_, index) => {
      setTimeout(async () => await triggerTest(), mins(30));
    });
  }, mins(15));
  // });
});
