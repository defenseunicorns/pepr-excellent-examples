import { Capability, Log } from "pepr";

const name = "hello-pepr-onschedule";

export const HelloPeprOnSchedule = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});

const { OnSchedule } = HelloPeprOnSchedule;

OnSchedule({
  name: "forever",
  every: 10,
  unit: "seconds",
  run: async () => {
    Log.info({ schedule: "forever" });
  },
});

OnSchedule({
  name: "n-times",
  every: 10,
  unit: "seconds",
  completions: 2,
  run: async () => {
    Log.info({ schedule: "n-times" });
  },
});

OnSchedule({
  name: "once-asap",
  every: 10,
  unit: "seconds",
  completions: 1,
  run: async () => {
    Log.info({ schedule: "once-asap" });
  },
});

const want = new Date(Date.now());

OnSchedule({
  name: "once-delayed",
  every: 10,
  unit: "seconds",
  startTime: want,
  completions: 1,
  run: async () => {
    Log.info({
      schedule: "once-delayed",
      want: want.valueOf(),
    });
  },
});
