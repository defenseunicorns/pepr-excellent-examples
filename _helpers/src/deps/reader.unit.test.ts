import {
  afterEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import * as sut from './reader';

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
    readFile: jest.fn() as jest.MockedFunction<typeof fs.readFile>,
    access: jest.fn()
  }
})
const { readFile, access } = jest.mocked(fs);

import * as general from '../general';
jest.mock('../general');
const { nearestAncestor } = jest.mocked(general);

const pkg = (obj) => ({ devDependencies: obj })
const buffered = (obj) => Buffer.from(JSON.stringify(obj), 'utf-8')
const resolved = (obj) => ((path) => Promise.resolve(buffered(obj))) as typeof fs.readFile

describe("reader()", () => {
  afterEach(() => { jest.resetAllMocks() })

  it("rejects when not given an absolute path", async () => {
    isAbsolute.mockImplementation(() => false)

    const result = sut.reader('what/ever')

    await expect(result).rejects.toMatch(/Arg error: 'path' must be absolute/)
  })

  it("rejects when not given an existing path", async () => {
    isAbsolute.mockImplementation(() => true)
    access.mockImplementation(() => Promise.reject())

    const result = sut.reader('/what/ever')

    await expect(result).rejects.toMatch(/Arg error: 'path' must exist/)
  })

  it("returns a found-dependency set", async () => {
    const them = "/out/there"
    const theirs = { abc: '1.2.3' }
    const theirPkg = pkg(theirs)
    const me = "/in/here"
    const mine = { xyz: '7.8.9' }
    const myPkg = pkg(mine)

    isAbsolute.mockImplementation(() => true)
    resolve.mockImplementation(p => p)
    access.mockImplementation(p => Promise.resolve())
    nearestAncestor.mockImplementation((f, d) => me)
    readFile
      .mockImplementationOnce(resolved(theirPkg))
      .mockImplementationOnce(resolved(myPkg))

    const result = await sut.reader(them)

    expect(result).toEqual({
      me: { path: me, content: myPkg },
      mine,
      them: { path: them, content: theirPkg },
      theirs
    })
  })
})
