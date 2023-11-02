import { Capability, K8s, Log, kind } from "pepr";

/**
 *  The HelloPepr Capability is an example capability to demonstrate some general concepts of Pepr.
 *  To test this capability you run `pepr dev`and then run the following command:
 *  `kubectl apply -f capabilities/hello-pepr.samples.yaml`
 */
export const Schedule = new Capability({
  name: "on-schedule",
  description: "Usage of the OnSchedule feature.",
  namespaces: [],
});

// Use the 'When' function to create a new action, use 'Store' to persist data
const { Store, OnSchedule } = Schedule;

OnSchedule({
  store: Store,
  every: 10,
  unit: "seconds",
  run: async () => {
    Log.info("Wait 30 seconds and create/update a secret");
    const count = Store.getItem("currentCount") || "0";
    const countInt = parseInt(count) + 1;

    try {
      await K8s(kind.ConfigMap).Apply({
        metadata: {
          name: "current-interation",
          namespace: "pepr-demo",
        },
        data: {
          count: countInt.toString(),
        },
      });
      Store.setItem("currentCount", countInt.toString());
    } catch (error) {
      // You can use the Log object to log messages to the Pepr controller pod
      Log.error(error, "Failed to apply ConfigMap using server-side apply.");
    }
  },
});

OnSchedule({
  every: 10,
  unit: "seconds",
  startTime: new Date(new Date().getTime() + 1000 * 30),
  run: async () => {
    Log.info("Wait 30 seconds call this function 3 times");
  },
  completions: 3,
});
