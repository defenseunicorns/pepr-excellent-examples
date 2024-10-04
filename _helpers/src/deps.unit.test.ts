import {
  afterEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { Command } from 'commander';
import * as sut from './deps';

import * as path from 'node:path';
jest.mock('node:path', () => {
  const original = jest.requireActual('node:path') as object;
  return { ...original, isAbsolute: jest.fn(), resolve: jest.fn() }
})
const { isAbsolute, resolve } = jest.mocked(path);

import * as fs from 'node:fs/promises';
jest.mock('node:fs/promises', () => {
  const original = jest.requireActual('node:fs/promises') as object;
  return {
    ...original,
    readFile: jest.fn() as jest.MockedFunction<typeof fs.readFile>
  }
})
const { readFile } = jest.mocked(fs);

const deps = (obj) => ({ devDependencies: obj })

const buffered = (obj) => Buffer.from(JSON.stringify(obj), 'utf-8')
const resolved = (obj) => ((path) => Promise.resolve(buffered(obj))) as typeof fs.readFile

describe("depsHandler()", () => {
  afterEach(() => { jest.resetAllMocks() })

  it("rejects when not given an absolute path", async () => {
    isAbsolute.mockImplementation(() => false)

    let result = sut.depsHandler('what/ever', {}, {})

    await expect(result).rejects.toMatch(/Arg error: 'path' must be absolute/)
  })

  it("skips pinned deps that are current", async () => {
    const theirs = deps({ typescript: '5.3.3' })
    const mine = deps({ typescript: '5.3.3' })

    isAbsolute.mockImplementation(() => true)
    resolve.mockImplementation(p => p)
    readFile
      .mockImplementationOnce(resolved(theirs))
      .mockImplementationOnce(resolved(mine))

    let result = await sut.depsHandler('/what/ever', {}, {})

    expect(result.updates).toEqual([])
  })

  it("updates pinned deps that are not current", async () => {
    const theirs = deps({
      lscript: '1.0.1',
      mscript: '2.0.1',
      hscript: '3.0.1'
    })
    const mine = deps({
      lscript: '1.0.0',
      mscript: '2.0.1',
      hscript: '3.0.2'
    })
    isAbsolute.mockImplementation(() => true)
    resolve.mockImplementation(p => p)
    readFile
      .mockImplementationOnce(resolved(theirs))
      .mockImplementationOnce(resolved(mine))

    let result = await sut.depsHandler('/what/ever', {}, {})

    expect(result.updates).toHaveLength(2)
    expect(result.updates).toEqual([
      { from: '1.0.0', to: '1.0.1', name: 'lscript' },
      { from: '3.0.2', to: '3.0.1', name: 'hscript' }
    ])
  })

  it.skip("TODO: updates non-pinned deps via remote lookup ", async () => {
    // const theirs = deps({ typescript: '5.3.3' })
    // const mine = deps({ typescript: '5.3.3' })

    // isAbsolute.mockImplementation(() => true)
    // resolve.mockImplementation(p => p)
    // readFile
    //   .mockImplementationOnce(resolved(theirs))
    //   .mockImplementationOnce(resolved(mine))

    // let result = await sut.depsHandler('/what/ever', {}, {})

    // expect(result.updates).toEqual([])
  })

  describe("@types/node", () => {
    it.skip("updates based on version of 'typescript' dep", async () => {})
    // npm view @types/node --json
    // {
    //   "dist-tags": {
    //     "ts4.9": "22.7.4",
    //     "ts5.3": "22.7.4",
    //     "ts5.7": "22.7.4",
    //     "latest": "22.7.4"
    //   }
    // }
  })
})
