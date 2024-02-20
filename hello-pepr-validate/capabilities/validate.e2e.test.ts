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
import { moduleUp, moduleDown } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';

const trc = new TestRunCfg(__filename)

describe("validate.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  afterAll(async () => await moduleDown(), mins(2))

  afterEach(async () => await clean(trc), mins(5))

  it("prevents bad examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.fail.yaml`)

    let rejects = (await Promise.all(resources.map(r => {
      return halfCreate(r).then(() => '').catch(e => e.data.message)}
    ))).filter(f => f)

    // Pepr-namespaced requests are rejected directly
    expect(rejects).toHaveLength(2)
    expect(rejects).toEqual(
      expect.arrayContaining([
        expect.stringMatching("denied the request: fail-oof"),
        expect.stringMatching("denied the request: fail-missing"),
      ])
    )
  }, secs(10))
  
  it("allows good examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.pass.yaml`)
    await fullCreate(resources)

    // fullCreate will wait until resources are Get-able from cluster, hence
    //  no need for expect()s -- test succeeds if it doesn't error/timeout
  }, secs(10))
})