import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { K8s, kind } from "kubernetes-fluent-client";
import { secs, mins } from "./general";
import { chdir, cwd } from 'node:process';
import { TestRunCfg } from './TestRunCfg';
import { Cmd } from './Cmd';
import { clean } from './cluster';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { peprVersion, moduleUp, untilLogged } from './pepr';

const trc = new TestRunCfg(__filename)

afterEach(async () => await clean(trc), mins(5))

describe("peprVersion()", () => {
  it("returns pepr version defined by workspace root", async () => {
    const cfg = (await readFile(`${trc.root()}/../package.json`)).toString()
    const expected = cfg.match(/"pepr": "npx pepr@(?<version>[^"]*)"/)!.groups!.version

    const actual = await peprVersion()

    expect(actual).toBe(expected)
  })
})

describe("moduleUp()", () => {
  let module = ""
  let version = ""
  let env = {}

  beforeEach(async () => {
    module = `${trc.root()}/pepr-test-module`
    await rm(module, { recursive: true, force: true })

    env = {
      TEST_MODE: true,
      TS_NODE_PROJECT: `${module}/tsconfig.json`
    }
    version = await peprVersion()

    let verbose = false

    let cmd = `npx --yes pepr@${version} init --skip-post-init`
    console.time(cmd)
    let init = await new Cmd({env, cmd}).run()
    if (verbose) { console.log(init) }

    const modulePkg = `${module}/package.json`
    let cfg = (await readFile(modulePkg)).toString()
    cfg = cfg.replace(
      '"pepr": "file:../pepr-0.0.0-development.tgz"',
      `"pepr": "${version}"`)
    await writeFile(modulePkg, cfg)
    console.timeEnd(cmd)

    cmd = 'npm install'
    console.time(cmd)
    const original = cwd()
    chdir(module)
    let install = await new Cmd({cmd}).run()
    if (verbose) { console.log(install) }
    chdir(original)
    console.timeEnd(cmd)
  }, mins(2))

  afterEach(async () => {
    await K8s(kind.Namespace).Delete("pepr-system")
  }, mins(2))

  it("builds, deploys, and waits for local Pepr Module to come up", async () => {
    let timeEnd = jest.spyOn(console, "timeEnd")

    const original = cwd()
    chdir(module)
    await moduleUp(version)
    chdir(original)

    expect(timeEnd).toHaveBeenCalledWith(`pepr@${version} ready (total time)`)

    timeEnd.mockRestore()
  }, mins(2))
})
