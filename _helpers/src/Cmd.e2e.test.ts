import { describe, expect, it } from '@jest/globals';
import { Cmd } from './Cmd'

describe("Cmd", () => {
  it("returns stdout", async () => {
    const expected = "pong"
    const {stdout} = await new Cmd({ cmd: `echo "${expected}"` }).run()
    expect(stdout.join("")).toBe(expected)
  })

  it("returns exit code", async () => {
    const expected = 83
    const {exitcode} = await new Cmd({ cmd: `exit ${expected}` }).run()
    expect(exitcode).toBe(expected)
  })

  it("returns stderr", async () => {
    const expected = "oof"
    const {stderr} = await new Cmd({ cmd: `>&2 echo "${expected}" ` }).run()
    expect(stderr.join("")).toBe(expected)
  })

  it("caches last result", async () => {
    const cmd = new Cmd({ cmd: `echo "whatever"` })
    const result = await cmd.run()
    expect(result).toBe(cmd.result)
  })

  it("accepts working directory", async () => {
    const expected = "/tmp"
    const {stdout} = await new Cmd({ cwd: expected, cmd: `pwd` }).run()
    expect(stdout.join("")).toBe(expected)
  })

  it("accepts env var overrides", async () => {
    const [key, val] = ["TESTVAR", "testcontent"]
    const {stdout} = await new Cmd({ env: { [key]: val}, cmd: `echo $${key}` }).run()
    expect(stdout.join("")).toBe(val)
  })
})
