import { Capability, Log, K8s, kind } from "pepr";

const name = "hello-pepr-schedule";

export const HelloPeprSchedule = new Capability({
  name,
  description: "Assert that schedule works as expected",
  namespaces: [name],
});

const { OnSchedule } = HelloPeprSchedule;

let count: number = 0;

export const CM = {
  apiVersion: "v1",
  kind: "ConfigMap",
  metadata: {
    name,
    namespace: name,
  },
}

OnSchedule({
  name: "Waits 50 seconds and executes updating the ConfigMap",
  every: 10,
  unit: "seconds",
  completions: 1,
  startTime: new Date(new Date().getTime() + 1000 * 50),
  run: async () => {
    await K8s(kind.ConfigMap).Apply({
      ...CM,
      data: { count: `${++count}` },
    });
    Log.info("Test Completed")
  },
});

OnSchedule({
  name: "Executes job 3 times",
  every: 10,
  unit: "seconds",
  completions: 3,
  run: async () => {
    Log.info(`Completion: ${++count}`);
  },
});
