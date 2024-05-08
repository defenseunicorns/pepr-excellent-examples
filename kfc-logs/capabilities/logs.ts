import { Capability, Log, a, K8s } from "pepr";


const name = "kfc-logs";

export const KFCLogs = new Capability({
  name: name,
  description: name,
  namespaces: [name],
});
const { OnSchedule } = KFCLogs;

const createCM = async (name: string, data: string) => {
  try {
    await K8s(a.ConfigMap).Apply({
      metadata: { name, namespace: name },
      data: { "sts-logs": data }
    })
  }
  catch(e){
    throw e
  }
}
OnSchedule({
  name: "sts-logs",
  every: 20, unit: "seconds",
  completions: 1,
  run: async () => {
    const logs = await K8s(a.StatefulSet).InNamespace("kfc-logs").Logs("sts-logs")
    await createCM("sts-logs", logs.join("\n"))
    Log.info({logs: "sts"})
  }
});

OnSchedule({
  name: "svc-logs",
  every: 15, unit: "seconds",
  completions: 1,
  run: async () => {
    const logs = await K8s(a.Secret).Logs("svc-logs")
    await createCM("svc-logs", logs.join("\n"))
    Log.info({logs: "svc"})
  }
});

OnSchedule({
  name: "pod-logs",
  every: 10, unit: "seconds",
  completions: 1,
  run: async () => {
    const logs = await K8s(a.Secret).InNamespace("kfc-logs").Logs("sts-logs-0")
    await createCM("po-logs", logs.join("\n"))
    Log.info({logs: "po"})
  }
});
