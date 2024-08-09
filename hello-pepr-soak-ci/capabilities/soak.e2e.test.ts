import { beforeAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins } from "helpers/src/time";
import { kind } from "kubernetes-fluent-client";
import { K8s } from "pepr";
import { execSync } from "child_process";

const trc = new TestRunCfg(__filename);
const PodMap = new Map<string, number>();

const getPodsInPeprDemo = async () => {
  const pods = await K8s(kind.Pod).InNamespace("pepr-demo").Get();
  return pods.items;
};

const testMap = (podMap: Map<string, number>) => {
  describe("relist window", () => {
    it("stuck pod should never live beyond the relist window", () => {
      podMap.forEach(value => {
        expect(value).toBeLessThan(2);
        if (value >= 2) {
          process.exit(1);
        }
      });
    });
  });
};

const triggerTest = () => {
  return new Promise<void>(resolve => {
    return getPodsInPeprDemo().then(podList => {
      testMap(updateMap(PodMap, podList));
      resolve();
    });
  });
};
const updateMap = (podMap: Map<string, number>,podList: kind.Pod[]) => {
  for (const pod of podList) {
    const name = pod.metadata.name;
    !podMap.has(name)
      ? podMap.set(name, 0)
      : podMap.set(name, podMap.get(name)! + 1);
  }

  return podMap;
};
describe("soak.ts", () => {
  beforeAll(() => execSync(`kubectl apply -f ${trc.root()}/capabilities/soak.config.yaml`),mins(2));

  describe("soak test the informer", () => {
    // Delay 15 mins before running the test every 30  mins for 2 hours
    setTimeout(() => {
      // Run first test
      triggerTest();
      // Run the rest of the tests
      Array.from(Array(4).keys()).map(() => setTimeout(() => triggerTest(), mins(30)));
    }, mins(15));
  });
});
