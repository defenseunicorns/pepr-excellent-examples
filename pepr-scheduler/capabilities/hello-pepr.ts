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
const {  OnSchedule } = Schedule;

OnSchedule({
  name: "Hello World",
  every: 10,
  unit: "seconds",
  startTime: new Date(new Date().getTime() + 1000 * 30),
  run: async () => {
    Log.info("Wait 10 seconds and create/update a secret");
  },
});
