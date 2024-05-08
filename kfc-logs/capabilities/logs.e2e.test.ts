import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { mins, secs, timed } from 'helpers/src/time';
import { moduleUp, moduleDown, untilLogged } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import cfg from '../package.json';
import { K8s, kind } from "kubernetes-fluent-client";

const trc = new TestRunCfg(__filename)

describe("logs.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  // afterAll(async () => await moduleDown(), mins(2))

  describe("different kubernetes objects", () => {
    let applied
    const pod0 = "[pod/sts-logs-0]"
    const pod1 = "[pod/sts-logs-1]"
    const pod2 = "[pod/sts-logs-2]"
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/logs.yaml`
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file)
        applied = await fullCreate(resources)
      })
    })
    // afterAll(async () => await clean(trc), mins(5))

    it("gets replicaSet logs", async () => {
      const needle = `"logs":"sts"`
      await untilLogged(needle)
      
      // get sts logs
      let stsCM = await K8s(kind.ConfigMap).InNamespace("kfc-logs").Get("sts-logs")
      expect(stsCM.data!["sts-logs"]).toContain(pod0)
      expect(stsCM.data!["sts-logs"]).toContain(pod1)
      expect(stsCM.data!["sts-logs"]).toContain(pod2)
    }, secs(30))

    it("gets service logs", async () => {
      const needle = `"logs":"svc"`
      await untilLogged(needle)
      
      // get svc logs
      let svcCM = await K8s(kind.ConfigMap).InNamespace("kfc-logs").Get("svc-logs")
      expect(svcCM.data!["sts-logs"]).toContain(pod0)
      expect(svcCM.data!["sts-logs"]).toContain(pod1)
      expect(svcCM.data!["sts-logs"]).toContain(pod2)
    }, secs(30))

    it("gets pod logs", async () => {
      const needle = `"logs":"po"`
      await untilLogged(needle)
      
      // get pod logs
      let poCM = await K8s(kind.ConfigMap).InNamespace("kfc-logs").Get("po-logs")
      expect(poCM.data!["sts-logs"]).toContain(pod0)
    }, secs(30))

  
  })

})
