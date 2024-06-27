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
    // describe("data injection", () => {
    //   let logz

    //   beforeAll(async () => {
    //     await timed("load+clear: default store data", async () => {
    //       await untilLogged('"msg":"onReady"', 4) // 2 actions * 2 controllers = 4 msgs
    //       logz = await logs()
    //     })
    //   }, mins(1))

    //   it("can insert in onReady hook", async () => {
    //     const values = logz
    //       .filter(l => l.includes('"key":"onReady"'))
    //       .map(l => JSON.parse(l))
    //       .map(o => o.value)

    //     // both controller pods + watcher pod run onReady!
    //     expect(values[0]).toBe("yep")
    //     expect(values[1]).toBe("yep")
    //     expect(values[2]).toBe("yep")
    //   }, secs(10))

    //   it("can clear in onReady hook", async () => {
    //     const values = logz
    //       .filter(l => l.includes('"key":"onReady"'))
    //       .map(l => JSON.parse(l))
    //       .map(o => o.value)

    //     // both controller pods + watcher pod run onReady!
    //     expect(values[3]).toBe(null)
    //     expect(values[4]).toBe(null)
    //     expect(values[5]).toBe(null)
    //   }, secs(10))
    // })
    function base64Encode(data: string) {
      return Buffer.from(data).toString("base64");
    }
    
    describe("asynchronous interaction", () => {
      let logz

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.async.yaml`
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file)
          const applied = await apply(resources)
          await untilLogged('"msg":"removeItem"')
          logz = await logs()
        })
      }, mins(1))

      it("key can be written, read, and removed", async () => {
        const messages = logz
          .filter(l => l.includes('"key":"async"'))
          .map(l => JSON.parse(l))
          .map(o => o.msg)

        expect(messages[0]).toBe("setItem")
        expect(messages[1]).toBe("getItem")
        expect(messages[2]).toBe("removeItem")
      }, secs(10))
    })

    describe("synchronous interaction", () => {
      let logz

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.sync.yaml`
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file)
          const applied = await apply(resources)

          await untilLogged('"msg":"removeItemAndWait"')
          // await sleep(240)
          logz = await logs()
          // await writeFileSync('./logz.json', JSON.stringify(logz))
        })
      }, mins(2))
      // }, mins(5))

      it("key can be written, read, and removed", async () => {
        const messages = logz
          .filter(l => l.includes('"key":"sync"'))
          .map(l => JSON.parse(l))
          .map(o => o.msg)

        expect(messages[0]).toBe("setItemAndWait")
        expect(messages[1]).toBe("getItem")
        expect(messages[2]).toBe("removeItemAndWait")
      }, secs(10))
    })

    describe("observed interaction", () => {
      let logz

      beforeAll(async () => {
        const file = `${trc.root()}/capabilities/scenario.observe.yaml`
        await timed(`load: ${file}`, async () => {
          const resources = await trc.load(file)
          const applied = await apply(resources)

          await untilLogged('"msg":"observed"')
          logz = await logs()
        })
      }, mins(1))

      it("sees batched update", async () => {
        const update = logz
          .filter(l => l.includes('"msg":"observed"'))
          .map(l => JSON.parse(l))
          .flatMap(o => o.updates)
          .filter(o => o.hasOwnProperty("observed"))

        // multiple setItems batch into single store update!
        expect(update).toHaveLength(1)
        expect(update[0]).toEqual(
          expect.objectContaining({ [base64Encode("a")]: "1", [base64Encode("b")]: "2", [base64Encode("c")]: "3", [base64Encode("observed")]: "yay"})
        )
      }, secs(10))
    })
  })
})
