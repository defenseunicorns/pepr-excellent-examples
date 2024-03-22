import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { mins } from 'helpers/src/time';
import { moduleUp, moduleDown } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import cfg from '../package.json';

const trc = new TestRunCfg(__filename)

describe("mutate.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  afterAll(async () => await moduleDown(), mins(2))

  describe("pass", () => {
    let applied

    beforeAll(async () => {
      const resources = await trc.load(`${trc.here()}/${trc.name()}.pass.yaml`)
      applied = await fullCreate(resources)
    })
    afterAll(async () => await clean(trc), mins(5))

    it("ignores Pepr-disinterested resources when they hit the cluster", async () => {
      const actual = applied.filter(f => f.metadata.name === "pass-unconcerned" )[0]
      expect(actual.data['glass-is-half']).toBe("empty")
    })
    
    it("updates Pepr-interested resources before they hit the cluster", async () => {
      const actual = applied.filter(f => f.metadata.name === "pass-full" )[0]
      expect(actual.data['glass-is-half']).toBe("full")
    })

    it("annotates mutated resources", async () => {
      const actual = applied.filter(f => f.metadata.name === "pass-full" )[0]
      const annote = `${cfg.pepr.uuid}.pepr.dev/hello-pepr-mutate`
      expect(actual.metadata.annotations[annote]).toBe('succeeded')
    })
  })
})