import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { halfCreate, fullCreate } from "helpers/src/general";
import { secs, mins } from 'helpers/src/time';
import { moduleUp, moduleDown, untilLogged, logs } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { kind } from 'pepr';

const trc = new TestRunCfg(__filename)

describe("validate.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  afterAll(async () => {
    await moduleDown()
    await clean(trc)
  }, mins(5))

  // validate
  //  create
  //    pass & fail
  //  createOrUpdate
  //    pass & fail
  //  update
  //    pass & fail
  //  delete
  //    pass & fail

  describe("validates creates", () => {
    let ns, yay, oof

    beforeAll(async () => {
      [ns, yay, oof] = await trc.load(`${trc.root()}/capabilities/scenario.create.yaml`)
      await fullCreate(ns)
    })

    it("allows valid resources", async () => {
      await fullCreate(yay)

      // no direct assertion -- if message is logged, test succeeds
      console.log(await logs())
      await untilLogged("???");
    })

    it("rejects invalid resources", async () => {
      // returns an error to caller

      // shows error message in logs
    })
  })

  describe("validates create-or-updates", () => {})

  describe("validates updates", () => {})

  describe("validates deletes", () => {})
})


// describe("validate.ts", () => {
//   beforeAll(async () => await moduleUp(), mins(2))
//   afterAll(async () => await moduleDown(), mins(2))

//   afterEach(async () => await clean(trc), mins(5))

//   it("prevents bad examples", async () => {
//     const resources = await trc.load(`${trc.here()}/${trc.name()}.fail.yaml`)

//     let rejects = (await Promise.all(resources.map(r => {
//       return halfCreate(r).then(() => '').catch(e => e.data.message)}
//     ))).filter(f => f)

//     // Pepr-namespaced requests are rejected directly
//     expect(rejects).toHaveLength(2)
//     expect(rejects).toEqual(
//       expect.arrayContaining([
//         expect.stringMatching("denied the request: fail-oof"),
//         expect.stringMatching("denied the request: fail-missing"),
//       ])
//     )
//   }, secs(10))
  
//   it("allows good examples", async () => {
//     const resources = await trc.load(`${trc.here()}/${trc.name()}.pass.yaml`)
//     await fullCreate(resources)

//     // fullCreate will wait until resources are Get-able from cluster, hence
//     //  no need for expect()s -- test succeeds if it doesn't error/timeout
//   }, secs(10))
// })