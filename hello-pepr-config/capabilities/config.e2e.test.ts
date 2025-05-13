import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { K8s, kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { halfCreate, fullCreate } from "helpers/src/general";
import { secs, mins, sleep, timed } from 'helpers/src/time';
import { moduleUp, moduleDown, untilLogged, logs } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import cfg from "../package.json";


// kind["ClusterPolicyReport"] = ClusterPolicyReport
// kind["Exemption"] = Exemption

const apply = async res => {
  return await fullCreate(res, kind);
}

const trc = new TestRunCfg(__filename)

describe("config.ts", () => {
  beforeAll(async () => await moduleUp(), mins(4))

  afterAll(async () => await moduleDown(), mins(2))

  describe("respects package.json > pepr key:", () => {

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.config.yaml`
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file)
        const resources_applied = await apply(resources)
  
        await untilLogged('"msg":"noop"')
      })
    })

    afterAll(async () => await clean(trc), mins(5))

    const moduleName = `pepr-${cfg.pepr.uuid}`

    it("webhookTimeout", async () => {
      const mwc = await K8s(kind.MutatingWebhookConfiguration).Get(moduleName)
      const vwc = await K8s(kind.ValidatingWebhookConfiguration).Get(moduleName)

      expect(mwc.webhooks![0].timeoutSeconds).toBe(cfg.pepr.webhookTimeout)
      expect(vwc.webhooks![0].timeoutSeconds).toBe(cfg.pepr.webhookTimeout)
    }, secs(10))

    it("onError", async () => {
      const mwc = await K8s(kind.MutatingWebhookConfiguration).Get(moduleName)
      const vwc = await K8s(kind.ValidatingWebhookConfiguration).Get(moduleName)

      const failurePolicy =
        cfg.pepr.onError == "reject" ? "Fail" :
        cfg.pepr.onError == "ignore" ? "Ignore" : null

      expect(mwc.webhooks![0].failurePolicy).toBe(failurePolicy)
      expect(vwc.webhooks![0].failurePolicy).toBe(failurePolicy)
    }, secs(10))

    it("customLabels", async () => {
      const ns = await K8s(kind.Namespace).Get("pepr-system")
      expect(ns.metadata?.labels).toEqual(
        expect.objectContaining(cfg.pepr.customLabels.namespace)
      )
    }, secs(10))

    it("env", async () => {
      const logz = await logs()
      expect(logz.join("\n")).toMatch(`"ITS":"a bird, a plane, superman"`)
    }, secs(5))

    it("alwaysIgnore", async () => {
      const mutated = await K8s(kind.Namespace).Get("hello-pepr-config")
      const ignored = await K8s(kind.Namespace).Get("hello-pepr-config-ignore")

      expect(mutated.metadata?.annotations).toEqual({
        [`${cfg.pepr.uuid}.pepr.dev/hello-pepr-config`]: 'succeeded',
        pepr: "was here"
      })

      expect(ignored.metadata?.annotations).toBe(undefined)
    }, secs(10))
  })
})
