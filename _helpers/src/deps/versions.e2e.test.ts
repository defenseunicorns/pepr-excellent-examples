import {
  afterEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import * as sut from './versions';

describe("versions()", () => {
  afterEach(() => { jest.resetAllMocks() })

  it("pulls a version dump from npm", async () => {
    let dep = "@types/node"
    let result = await sut.versions(dep)

    expect(result.name).toBe(dep)
    expect(result).toHaveProperty("dist-tags")
    expect(result).toHaveProperty("versions")
  })
})