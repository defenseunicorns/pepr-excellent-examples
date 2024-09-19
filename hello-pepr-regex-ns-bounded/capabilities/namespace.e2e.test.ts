import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { kind, K8s } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { secs, mins, timed } from 'helpers/src/time';
import { moduleUp, moduleDown } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { live } from 'helpers/src/resource';

const apply = async res => {
  return await fullCreate(res, kind);
}

const trc = new TestRunCfg(__filename)

describe("namespace.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))

  afterAll(async () => await moduleDown(), mins(2))

  describe("module-owned namespaces", () => {
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.namespace.yaml`
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file)
        const resources_applied = await apply(resources)

        const last = resources_applied[resources_applied.length-1]
        await live(kind.ConfigMap, last)
      })
    })

    afterAll(async () => await clean(trc), mins(5))

    it("handles: in-scope resources with filtered namespaces", async () => {
      const one = await K8s(kind.ConfigMap).InNamespace("hello-pepr-ns-alpha").Get("one")
      expect(one.metadata?.annotations).toEqual(expect.objectContaining({a: "alpha"}))

      const two = await K8s(kind.ConfigMap).InNamespace("hello-pepr-ns-bravo").Get("two")
      expect(two.metadata?.annotations).toEqual(expect.objectContaining({b: "bravo"}))
    }, secs(10))

    it("handles: in-scope resources without filtered namespaces", async () => {
      const one = await K8s(kind.ConfigMap).InNamespace("hello-pepr-ns-alpha").Get("one")
      expect(one.metadata?.annotations).toEqual(expect.objectContaining({c: "charlie"}))

      const two = await K8s(kind.ConfigMap).InNamespace("hello-pepr-ns-bravo").Get("two")
      expect(two.metadata?.annotations).toEqual(expect.objectContaining({c: "charlie"}))
    })
    
    it("ignores: out-of-scope resource without filtered namespaces", async () => {
      const three = await K8s(kind.ConfigMap).InNamespace("default").Get("three")
      expect(three.metadata?.annotations).not.toBeDefined()
    }, secs(10))
  })
})