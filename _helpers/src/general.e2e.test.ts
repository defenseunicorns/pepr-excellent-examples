import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it
} from '@jest/globals';
import { TestRunCfg } from './TestRunCfg';
import {
  mins,
  lock,
  unlock,
  resourceGone,
  untilGone
} from "./general";

const trc = new TestRunCfg(__filename)

beforeAll(async () => { await lock(trc) }, mins(10))
 afterAll(async () => { await unlock(trc) })

describe.skip("resourceGone()", () => {
  it("is tested", () => {
    console.log("TODO")
  })
})

describe.skip("untilGone()", () => {
  it("is tested", () => {
    console.log("TODO")
  })
})
