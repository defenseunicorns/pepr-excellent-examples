import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { secs, mins, timed, sleep } from 'helpers/src/time';
import { moduleUp, moduleDown, untilLogged, logs } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';

const apply = async res => {
  return await fullCreate(res, kind);
}

const trc = new TestRunCfg(__filename)

describe("store.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))

  afterAll(async () => {
    await moduleDown()
    await clean(trc)
  }, mins(5))

  describe("module default store", () => {
    describe("data injection", () => {
      let logz

      beforeAll(async () => {
        await timed("load+clear: default store data", async () => {
          await untilLogged('"msg":"DONE!"', 1)
          logz = await logs()
        })
      }, mins(1))

      it("can insert in onReady hook", async () => {
        const values = logz
          .filter(l => l.includes('"key":"onReady"'))
          .map(l => JSON.parse(l))
          .map(o => o.value)
        const values2 = logz
          .filter(l => l.includes('"key2":"sso-client-http://bin"'))
          .map(l => JSON.parse(l))
          .map(o => o.value2)
        // both controller pods + watcher pod run onReady!
        expect(values[0]).toBe("yep")
        expect(values[1]).toBe("yep")
        expect(values[2]).toBe("yep")

        expect(values2[0]).toBe("yep2")
        expect(values2[1]).toBe("yep2")
        expect(values2[2]).toBe("yep2")

      }, secs(10))


      it("can clear in onReady hook", async () => {
        const values = logz
          .filter(l => l.includes('"key":"onReady"'))
          .map(l => JSON.parse(l))
          .map(o => o.value)
        const values2 = logz
          .filter(l => l.includes('"key2":"sso-client-http://bin"'))
          .map(l => JSON.parse(l))
          .map(o => o.value2)

        // both controller pods + watcher pod run onReady!
        expect(values[3]).toBe(null)
        expect(values[4]).toBe(null)
        expect(values[5]).toBe(null)
        expect(values2[3]).toBe(null)
        expect(values2[4]).toBe(null)
        expect(values2[5]).toBe(null)
      }, secs(10))
    })


    describe("asynchronous interaction", () => {
      let logz

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.async.yaml`
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file)
          const applied = await apply(resources)
          await untilLogged('"msg":"removeItem2"')
          logz = await logs()
        })
      }, mins(1))

      it("key can be written, read, and removed", async () => {
        const messages = logz
          .filter(l => l.includes('"key":"async"'))
          .map(l => JSON.parse(l))
          .map(o => o.msg)
        const messages2 = logz
          .filter(l => l.includes('"key2":"async-sso-client-http://bin"'))
          .map(l => JSON.parse(l))
          .map(o => o.msg)


        expect(messages[0]).toBe("setItem")
        expect(messages[1]).toBe("getItem")
        expect(messages[2]).toBe("removeItem")

        expect(messages2[0]).toBe("setItem2")
        expect(messages2[1]).toBe("getItem2")
        expect(messages2[2]).toBe("removeItem2")
      }, secs(10))
    })


    describe("synchronous interaction", () => {
      let logz

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.sync.yaml`
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file)
          const applied = await apply(resources)

          await untilLogged('"msg":"removeItemAndWait2"')
          logz = await logs()
        })
      }, mins(2))

      it("key can be written, read, and removed", async () => {

        const messages = logz
          .filter(l => l.includes('"key":"sync"'))
          .map(l => JSON.parse(l))
          .map(o => o.msg)
        const messages2 = logz
          .filter(l => l.includes('"key2":"sync-sso-client-http://bin"'))
          .map(l => JSON.parse(l))
          .map(o => o.msg)
        expect(messages[0]).toBe("setItemAndWait")
        expect(messages[1]).toBe("getItem")
        expect(messages[2]).toBe("removeItemAndWait")
        expect(messages2[0]).toBe("setItemAndWait2")
        expect(messages2[1]).toBe("getItem2")
        expect(messages2[2]).toBe("removeItemAndWait2")
      }, secs(10))
    })

    describe("observed interaction", () => {
      let logz

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.observe.yaml`
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file)
          const applied = await apply(resources)

          await untilLogged('"msg":"final-observed"')
          logz = await logs()
        })
      }, mins(1))

      it("sees batched update", async () => {
        const getItem = logz.filter(l => l.includes('"msg":"got correct item"'))
        const update = logz
          .filter(l => l.includes('"msg":"final-observed"'))
          .map(l => JSON.parse(l))
          .flatMap(o => o.updates)
          .filter(o => o.hasOwnProperty("v2-observed-sso-client-http://bin"))

          let filteredData = update.map(obj => {
            let filteredObj = {};
            Object.keys(obj).forEach(key => {
              if (!key.startsWith('v2-async') && !key.startsWith('v2-sync')) {
                filteredObj[key] = obj[key];
              }
            });
            return filteredObj;
          });
          
        // multiple setItems batch into single store update!
        expect(filteredData).toHaveLength(1)
 
        expect(filteredData[0]).toEqual(
          expect.objectContaining({ "v2-a": "1", "v2-b": "2", "v2-c": "3", "v2-observed": "yay", "v2-observed-sso-client-http://bin": "asd-123-xyz" })
        )
       
        expect(getItem).toHaveLength(1)
      }, secs(10))
    })
  })
})

