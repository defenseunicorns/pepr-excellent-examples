import {
  beforeAll,
  beforeEach,
  afterEach,
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

describe("global.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))

  // afterEach(async () => await clean(trc), mins(5))

  // afterAll(async () => await moduleDown(), mins(2))

  describe("package.json > pepr", () => {
    let mwc: kind.MutatingWebhookConfiguration
    let vwc: kind.ValidatingWebhookConfiguration

    beforeAll(async () => {
      const name = `pepr-${cfg.pepr.uuid}`
      mwc = await K8s(kind.MutatingWebhookConfiguration).Get(name)
      vwc = await K8s(kind.ValidatingWebhookConfiguration).Get(name)
    }, secs(10))

    // will pass once release is cut that includes fix:
    //  https://github.com/defenseunicorns/pepr/pull/616
    it.skip("webhookTimeout is respected", async () => {
      expect(mwc.webhooks![0].timeoutSeconds).toBe(cfg.pepr.webhookTimeout)
      expect(vwc.webhooks![0].timeoutSeconds).toBe(cfg.pepr.webhookTimeout)
    }, secs(10))
  })
})