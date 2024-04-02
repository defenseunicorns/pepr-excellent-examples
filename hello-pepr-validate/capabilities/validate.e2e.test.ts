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
import { secs, mins, sleep } from 'helpers/src/time';
import { moduleUp, moduleDown, untilLogged, logs } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'pepr';

const trc = new TestRunCfg(__filename)

describe("validate.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  afterAll(async () => {
    await moduleDown()
    await clean(trc)
  }, mins(5))

  describe("validate creates", () => {
    let ns, yay, oof

    beforeAll(async () => {
      [ns, yay, oof] = await trc.load(`${trc.root()}/capabilities/scenario.create.yaml`)
      await fullCreate(ns)
    }, secs(10))

    it("allows valid resources", async () => {
      await fullCreate(yay)

      // no direct assertion -- if message is logged, test succeeds
      await untilLogged(`Valid: ${yay.metadata.name}`)
    }, secs(10))

    it("rejects invalid resources", async () => {
      const reject = await halfCreate(oof).catch(e => e.data.message)
      expect(reject).toMatch(`denied the request: ${oof.metadata.name}`)
    }, secs(10))
  })

  describe("validate create-or-updates", () => {
    let ns, createYay, createOof, updateYay, updateOof

    beforeAll(async () => {
      [ns, createYay, createOof, updateYay, updateOof] =
        await trc.load(`${trc.root()}/capabilities/scenario.create-or-update.yaml`)
      await fullCreate(ns)
    }, secs(10))

    it("allows valid resource creates", async () => {
      await fullCreate(createYay)

      // no direct assertion -- if message is logged, test succeeds
      await untilLogged(`Valid: ${createYay.metadata.name}`)
    }, secs(10))

    it("rejects invalid resource creates", async () => {
      const reject = await halfCreate(createOof).catch(e => e.data.message)
      expect(reject).toMatch(`denied the request: ${createOof.metadata.name}`)
    }, secs(10))

    it("allows valid resource updates", async () => {
      await fullCreate(updateYay)
      let update = { ...updateYay, stringData: { k: "v" }}
      await K8s(kind.Secret).Apply(update)

      // no direct assertion -- if message is logged, test succeeds
      await untilLogged(`Valid: ${updateYay.metadata.name}`, 2)
    }, secs(10))

    it("rejects invalid resource updates", async () => {
      await fullCreate(updateOof)
      let update = { ...updateOof, stringData: { k: "v" }}

      const reject = await K8s(kind.Secret).Apply(update).catch(e => e.data.message)
      expect(reject).toMatch(`denied the request: ${updateOof.metadata.name}`)
    }, secs(10))
  })

  describe("validate updates", () => {
    let ns, yay, oof

    beforeAll(async () => {
      [ns, yay, oof] = await trc.load(`${trc.root()}/capabilities/scenario.update.yaml`)
      await fullCreate(ns)
    }, secs(10))

    it("allows valid resources", async () => {
      await fullCreate(yay)
      let update = { ...yay, stringData: { k: "v" }}
      await K8s(kind.Secret).Apply(update)

      // no direct assertion -- if message is logged, test succeeds
      await untilLogged(`Valid: ${yay.metadata.name}`)
    }, secs(10))

    it("rejects invalid resources", async () => {
      await fullCreate(oof)
      let update = { ...oof, stringData: { k: "v" }}

      const reject = await K8s(kind.Secret).Apply(update).catch(e => e.data.message)
      expect(reject).toMatch(`denied the request: ${oof.metadata.name}`)
    }, secs(10))
  })

  describe("validate deletes", () => {
    let ns, yay, oof

    beforeAll(async () => {
      [ns, yay, oof] = await trc.load(`${trc.root()}/capabilities/scenario.delete.yaml`)
      await fullCreate(ns)
    }, secs(10))

    it("allows valid resources", async () => {
      await fullCreate(yay)
      await K8s(kind.Secret).Delete(yay)

      // no direct assertion -- if message is logged, test succeeds
      await untilLogged(`Valid: ${yay.metadata.name}`)
    }, secs(10))

    it("rejects invalid resources", async () => {
      await fullCreate(oof)

      const reject = await K8s(kind.Secret).Delete(oof).catch(e => e.data.message)
      expect(reject).toMatch(`denied the request: ${oof.metadata.name}`)
    }, secs(10))
  })
})
