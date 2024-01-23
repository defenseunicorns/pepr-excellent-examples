import * as fsP from 'fs/promises';
import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it
} from '@jest/globals';
import { TestRunCfg } from './TestRunCfg';
import {
  mins,
  waitLock,
  resourceGone,
  untilGone
} from "./general";

const trc = new TestRunCfg(__filename)

beforeAll(async () => {
  await waitLock(trc.lockfile(), trc.locktext())
}, mins(10))
afterAll(async () => await fsP.rm(trc.lockfile()))

describe("resourceGone()", () => {
  it("is tested", () => {
    console.log("TODO")
  })
})

describe.skip("untilGone()", () => {
  it("is tested", () => {
    console.log("TODO")
  })
})
