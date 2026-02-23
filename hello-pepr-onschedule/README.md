# OnSchedule Automated Task Execution

This example demonstrates the Pepr `OnSchedule` API for executing code at predefined intervals, providing a simple alternative to Kubernetes CronJobs.
`OnSchedule` enables automated code execution at regular intervals without complex CronJob configuration. 
It runs at the top level within a Capability and is backed by PeprStore to safeguard against schedule loss following pod restarts.

## When to Use

Use `OnSchedule` for:
- Day 2 operations and maintenance tasks
- Periodic health checks or status updates
- Token or credential refresh operations
- Scheduled data cleanup or archival

**Important**: Intervals should be 30 seconds or longer due to the storage mechanism. Jobs should be idempotent.

## Code Examples
>**View full example on [Github](https://github.com/defenseunicorns/pepr-excellent-examples/blob/main/hello-pepr-onschedule/capabilities/onschedule.ts)**

**Run Forever:**
```typescript
OnSchedule({
  name: "forever",
  every: 10,
  unit: "seconds",
  run: async () => {
    Log.info({ schedule: "forever" });
  },
});
```

#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","schedule":"forever"}
{"level":30,"time":<timestamp+10secs>,"pid":<pid>,"hostname":"pepr-<hostname>","schedule":"forever"}
{"level":30,"time":<timestamp+10secs>,"pid":<pid>,"hostname":"pepr-<hostname>","schedule":"forever"}
```

**Run N Times:**
```typescript
OnSchedule({
  name: "n-times",
  every: 10,
  unit: "seconds",
  completions: 2,
  run: async () => {
    Log.info({ schedule: "n-times" });
  },
});
```

#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","schedule":"n-times"}
{"level":30,"time":<timestamp+10secs>,"pid":<pid>,"hostname":"pepr-<hostname>","schedule":"n-times"}
```

**Run Once with Delay:**
```typescript
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
```

#### Example pod log output:
```json
{"level":30,"time":<timestamp>,"pid":<pid>,"hostname":"pepr-<hostname>","schedule":"once-delayed"}
```

>[!TIP] Learn more about [OnSchedule](https://docs.pepr.dev/user-guide/onschedule/)