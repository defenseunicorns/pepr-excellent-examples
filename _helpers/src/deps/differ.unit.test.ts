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

  const pkg = (obj) => ({ devDependencies: obj })

  it("skip pinned deps that are current", async () => {
    const theirs = { typescript: '5.3.3' }
    const mine = { typescript: '5.3.3' }
    reader.mockImplementation(() => Promise.resolve({
      me: { path: '/in/here', content: pkg(mine) },
      mine,
      them: { path: '/out/there', content: pkg(theirs) },
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
      me: { path: '/in/here', content: pkg(mine) },
      mine,
      them: { path: '/out/there', content: pkg(theirs) },
      theirs,
    }))

    let result = await sut.differ('/out/there')

    expect(result.updates).toEqual([
      { name: 'lscript', from: '1.0.0', to: '1.0.1' },
      { name: 'hscript', from: '3.0.2', to: '3.0.1' }
    ])
  })

  it("update non-pinned deps from remote lookup", async () => {
    const theirs = {}
    const mine = { '@just/doit': '1.2.2' }
    reader.mockImplementation(() => Promise.resolve({
      me: { path: '/in/here', content: pkg(mine) },
      mine,
      them: { path: '/out/there', content: pkg(theirs) },
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

  it("updates pinned deps to use range spec from pin", async () => {
    const theirs = {
      '@just/dothis': '^1.2.3',
      '@just/dothat': '^3.2.1',
    }
    const mine = {
      '@just/dothis': '~1.2.2',
      '@just/dothat': '3.2.1',
    }
    reader.mockImplementation(() => Promise.resolve({
      me: { path: '/in/here', content: pkg(mine) },
      mine,
      them: { path: '/out/there', content: pkg(theirs) },
      theirs,
    }))

    let result = await sut.differ('/out/there')

    expect(result.updates).toEqual([
      { name: '@just/dothis', from: '~1.2.2', to: '^1.2.3' },
      { name: '@just/dothat', from: '3.2.1', to: '^3.2.1' },
    ])
  })

  it("updates non-pinned deps & keeps pre-existing range specs", async () => {
    const theirs = {}
    const mine = {
      '@just/dothis': '^1.2.3',
      '@just/dothat': '~3.2.1',
      '@just/dothur': '2.4.6',
    }
    reader.mockImplementation(() => Promise.resolve({
      me: { path: '/in/here', content: pkg(mine) },
      mine,
      them: { path: '/out/there', content: pkg(theirs) },
      theirs,
    }))
    versions.mockImplementationOnce(() => Promise.resolve(({
      "name": "@just/dothis",
      "dist-tags": {
        "latest": "1.2.4"
      }
    })))
    versions.mockImplementationOnce(() => Promise.resolve(({
      "name": "@just/dothat",
      "dist-tags": {
        "latest": "3.2.2"
      }
    })))
    versions.mockImplementationOnce(() => Promise.resolve(({
      "name": "@just/dothur",
      "dist-tags": {
        "latest": "2.4.7"
      }
    })))

    let result = await sut.differ('/out/there')

    expect(result.updates).toEqual([
      { name: '@just/dothis', from: '^1.2.3', to: '^1.2.4' },
      { name: '@just/dothat', from: '~3.2.1', to: '~3.2.2' },
      { name: '@just/dothur', from: '2.4.6', to: '2.4.7' },
    ])
  })

  describe("@types/node", () => {
    it("update based on version of 'typescript' dep", async () => {
      const theirs = { typescript: '5.3.3' }
      const mine = { typescript: '5.3.3', '@types/node': '1.2.3' }
      reader.mockImplementation(() => Promise.resolve({
        me: { path: '/in/here', content: pkg(mine) },
        mine,
        them: { path: '/out/there', content: pkg(theirs) },
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
