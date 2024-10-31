import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { TestRunCfg } from './TestRunCfg';
import * as sut from './pepr';

const trc = new TestRunCfg(__filename)

describe("sift()", () => {
  let mockLog, mockErr

  beforeEach(() => {
    mockLog = jest.spyOn(console, "log").mockImplementation(() => {})
    mockErr = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    mockLog.mockRestore()
    mockErr.mockRestore()
  })

  describe("on parsing error", () => {
    it("prints offending lines", async () => {
      const all = [
        '[',
        '  {"level":30,"time":1727729495753,"pid":1,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Pepr Controller (v0.0.0-development)"}',
        '  (node:1) [DEP0040] DeprecationWarning: The \`punycode\` module is deprecated. Please use a userland alternative instead.',
        '  (Use \`node --trace-deprecation ...\` to show where the warning was created)',
        '  {"level":30,"time":1727729495753,"pid":1,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Applying the Pepr Store CRD if it doesn\'t exist"}',
        '  {"level":20,"time":1727729497520,"pid":17,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Add ',
        ']',
      ]
      const expected = [
        'Unexpected JSON input. Offending lines:',
        '-->  {"level":20,"time":1727729497520,"pid":17,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Add <--'
      ]

      const result = sut.sift(all)

      expect(result).toBe(undefined)

      expect(mockErr).toHaveBeenCalledTimes(2)
      mockErr.mock.calls.flat().forEach((call, idx) => {
        expect(call).toBe(expected[idx])
      })
    })
  })
})
