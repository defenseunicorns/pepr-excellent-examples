import {
  afterEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import * as sut from './differ';

import * as modReader from './reader';
jest.mock('./reader')
const { reader } = jest.mocked(modReader)

import * as modVersions from './versions';
jest.mock('./versions');
const { versions } = jest.mocked(modVersions);

describe("splitRange()", () => {
  it.each([
    ['', ['', '']],
    ['     ', ['', '']],
    ['1.2.3', ['', '1.2.3']],
    [' 1.2.3', ['', '1.2.3']],
    ['~1.2.3', ['~', '1.2.3']],
    ['^1.2.3', ['^', '1.2.3']],
    ['🫠1.2.3', ['', '🫠1.2.3']],
  ])(`separates range prefix from '%s' & returns '%j'`, async (given, expected) => {
    const [range, version] = sut.splitRange(given)

    expect(range).toBe(expected[0])
    expect(version).toBe(expected[1])
  })
})

describe("differ()", () => {
  afterEach(() => { jest.resetAllMocks() })

  it("skip pinned deps that are current", async () => {
    const theirs = { typescript: '5.3.3' }
    const mine = { typescript: '5.3.3' }
    reader.mockImplementation(() => Promise.resolve({
      me: '/in/here',
      mine,
      them: '/out/there',
      theirs,
    }))

    let result = await sut.differ('/out/there')

    expect(result.updates).toEqual([])
  })

  it("update pinned deps that are not current", async () => {
    const theirs = {
      lscript: '1.0.1',
      mscript: '2.0.1',
      hscript: '3.0.1'
    }
    const mine = {
      lscript: '1.0.0',
      mscript: '2.0.1',
      hscript: '3.0.2'
    }
    reader.mockImplementation(() => Promise.resolve({
      me: '/in/here',
      mine,
      them: '/out/there',
      theirs,
    }))

    let result = await sut.differ('/out/there')

    expect(result.updates).toEqual([
      { name: 'lscript', from: '1.0.0', to: '1.0.1' },
      { name: 'hscript', from: '3.0.2', to: '3.0.1' }
    ])
  })

  it("update non-pinned deps from remote lookup ", async () => {
    const theirs = {}
    const mine = { '@just/doit': '1.2.2' }
    reader.mockImplementation(() => Promise.resolve({
      me: '/in/here',
      mine,
      them: '/out/there',
      theirs,
    }))
    versions.mockImplementation(() => Promise.resolve(({
      "name": "@just/doit",
      "dist-tags": {
        "latest": "1.2.3"
      }
    })))

    let result = await sut.differ('/out/there')

    expect(result.updates).toEqual([
      { name: '@just/doit', from: '1.2.2', to: '1.2.3' }
    ])
  })

  describe("@types/node", () => {
    it("update based on version of 'typescript' dep", async () => {
      const theirs = { typescript: '5.3.3' }
      const mine = { typescript: '5.3.3', '@types/node': '1.2.3' }
      reader.mockImplementation(() => Promise.resolve({
        me: '/in/here',
        mine,
        them: '/out/there',
        theirs,
      }))
      versions.mockImplementation(() => Promise.resolve(({
        "name": "@types/node",
        "dist-tags": {
          "ts5.3": "22.7.3",
          "latest": "22.7.4"
        },
      })))

      let result = await sut.differ('/out/there')

      expect(result.updates).toHaveLength(1)
      expect(result.updates).toEqual([
        { name: '@types/node', from: '1.2.3', to: '22.7.3' },
      ])
    })
  })
})
