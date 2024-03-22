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

const apply = async res => {
  return await fullCreate(res, kind);
}

const trc = new TestRunCfg(__filename)

describe("store.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))

  afterEach(async () => await clean(trc), mins(5))

  afterAll(async () => await moduleDown(), mins(2))

  describe("default module store", () => {
    beforeEach(async () => {
      const file = `${trc.root()}/capabilities/scenario.set-wait.yaml`
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file)
        const resources_applied = await apply(resources)
  
        await untilLogged('"msg":"alphabet copied"')
      })
    }, secs(30))

    it("can be written synchronously, then read from", async () => {
      const getter = await K8s(kind.ConfigMap)
        .InNamespace("hello-pepr-store")
        .Get("getter")

      expect(getter.data?.alphabet).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    }, secs(10))
  })
})