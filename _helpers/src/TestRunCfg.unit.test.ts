import { describe, expect, it, jest } from '@jest/globals';
import { TestRunCfg } from "./TestRunCfg";
import { heredoc } from './heredoc'

import * as general from './general'
jest.mock("./general")
const { nearestAncestor } = jest.mocked(general)

import * as fs from "fs"
jest.mock("fs")
const { readdirSync } = jest.mocked(fs)

import * as fsP from "node:fs/promises"
jest.mock("node:fs/promises")
const { readFile } = jest.mocked(fsP)

const root = "/fake/root"
const here = `${root}/sub/path`
const name = "capability-name"
const me = `${here}/${name}.e2e.test.ts`

describe("TestRunCfg", () => {
  it("exposes given test file", () => {
    const trc = new TestRunCfg(me)
    expect(trc.me).toBe(me)
  })

  describe("exposes run-specific unique value", () => {
    it("can be autogenerated", () => {
      const trc = new TestRunCfg(me)
      expect(trc.unique).toBeTruthy()
    })

    it("can be given directly", () => {
      const unique = "set-explictly"
      const trc = new TestRunCfg(me, unique)
      expect(trc.unique).toBe(unique)
    })
  })

  describe("exposes kube config used for cluster operations", () => {
    it("defaults to KUBECONFIG envvar if set", () => {
      const env = { ...process.env }
      const kubeConfig = "test/kubeconfig.yaml"
      process.env.KUBECONFIG = kubeConfig

      const trc = new TestRunCfg(me)
      expect(trc.kubeConfig).toBe(kubeConfig)

      process.env = env
    })

    it("otherwise, defaults to widely-known default location", () => {
      const env = { ...process.env }
      delete process.env.KUBECONFIG

      const trc = new TestRunCfg(me)
      expect(trc.kubeConfig).toBe("~/.kube/config")

      process.env = env
    })

    it("can be given directly", () => {
      const kubeConfig = "~/.config/k3d/cluster.yaml"
      const trc = new TestRunCfg(me, undefined, kubeConfig)
      expect(trc.kubeConfig).toBe(kubeConfig)
    })
  })

  it("derives capability name", () => {
    const trc = new TestRunCfg(me)
    expect(trc.name()).toBe(name)
  })

  it("derives capability path", () => {
    const trc = new TestRunCfg(me)
    expect(trc.here()).toBe(here)
  })

  it ("determines project root", () => {
    nearestAncestor.mockClear().mockImplementation((f, p) => {
      if (f === "package.json" && p === here) {
        return `${root}/package.json`
      } else { throw "" }
    })
    const trc = new TestRunCfg(me)
    expect(trc.root()).toBe(root)
  })

  it ("derives cluster lock file path", () => {
    const lock = `${root}/cluster.lock`
    const trc = new TestRunCfg(me)
    expect(trc.lockfile()).toBe(lock)
  })

  it ("derives cluster lock file text", () => {
    const lock = `${root}/cluster.lock`
    const trc = new TestRunCfg(me)
    expect(trc.locktext()).toBe(`${trc.me}:${trc.unique}`)
  })

  it("exposes a capability-specific label key", () => {
    const lk = `test-transient/${name}`
    const trc = new TestRunCfg(me)
    expect(trc.labelKey()).toBe(lk)
  })

  describe("loadRaw()", () => {
    it("reads single resource from manifest yaml", async () => {
      const trc = new TestRunCfg(me)
      const yaml = `${here}/fake.yaml`
      const original = heredoc`
        ---
        apiVersion: v1
        kind: Namespace
        metadata:
          name: alpha
          labels:
            alpha: alpha
      `
      const expected = [{
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "alpha",
          labels: {
            alpha: "alpha",
          }
        }
      }]
      readFile.mockImplementation((path) => path === yaml
        ? Promise.resolve(original)
        : Promise.reject()
      )

      const actual = await trc.loadRaw(yaml)

      expect(actual).toEqual(expected)
    })

    it("reads all resources from manifest yaml", async () => {
      const trc = new TestRunCfg(me)
      const yaml = `${here}/fake.yaml`
      const original = heredoc`
        ---
        apiVersion: v1
        kind: Namespace
        metadata:
          name: alpha
        ---
        apiVersion: v1
        kind: Namespace
        metadata:
          name: beta
      `
      const expected = [{
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "alpha",
        }
      }, {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "beta",
        }
      }]
      readFile.mockImplementation((path) => path === yaml
        ? Promise.resolve(original)
        : Promise.reject()
      )

      const actual = await trc.loadRaw(yaml)

      expect(actual).toEqual(expected)
    })
  })

  describe("load()", () => {
    it("adds test label to single resource loaded from manifest yaml", async () => {
      const trc = new TestRunCfg(me)
      const yaml = `${here}/fake.yaml`
      const original = heredoc`
        ---
        apiVersion: v1
        kind: Namespace
        metadata:
          name: alpha
          labels:
            alpha: alpha
      `
      const expected = [{
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "alpha",
          labels: {
            alpha: "alpha",
            [trc.labelKey()]: trc.unique
          }
        }
      }]
      readFile.mockImplementation((path) => path === yaml
        ? Promise.resolve(original)
        : Promise.reject()
      )

      const actual = await trc.load(yaml)

      expect(actual).toEqual(expected)
    })

    it("adds test label to all resources loaded from manifest yaml", async () => {
      const trc = new TestRunCfg(me)
      const yaml = `${here}/fake.yaml`
      const original = heredoc`
        ---
        apiVersion: v1
        kind: Namespace
        metadata:
          name: alpha
        ---
        apiVersion: v1
        kind: Namespace
        metadata:
          name: beta
      `
      const expected = [{
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "alpha",
          labels: {
            [trc.labelKey()]: trc.unique
          }
        }
      }, {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "beta",
          labels: {
            [trc.labelKey()]: trc.unique
          }
        }
      }]
      readFile.mockImplementation((path) => path === yaml
        ? Promise.resolve(original)
        : Promise.reject()
      )

      const actual = await trc.load(yaml)

      expect(actual).toEqual(expected)
    })
  })

  // it ("derives cluster module file path", () => {
  //   const mod = me.replace('.e2e.test', '.pepr')
  //   const trc = new TestRunCfg(me)
  //   expect(trc.module()).toBe(mod)
  // })

  // describe("discovers to-be-applied, index-ordered capability test manifests", () => {
  //   const files = [
  //     `${name}.test.0.yaml`,
  //     `${name}.test.8675309.yaml`,
  //     `${name}.test.09.yaml`,
  //     `${name}.test.8.yaml`,
  //     `${name}.test.1009.yaml`,
  //     `nope.test.1.yaml`
  //   ]
  //   const manifestList = [
  //     [`${here}/${name}.test.0.yaml`, `${here}/${name}.test.0.yaml.json`],
  //     [`${here}/${name}.test.8.yaml`, `${here}/${name}.test.8.yaml.json`],
  //     [`${here}/${name}.test.09.yaml`, `${here}/${name}.test.09.yaml.json`],
  //     [`${here}/${name}.test.1009.yaml`, `${here}/${name}.test.1009.yaml.json`],
  //     [`${here}/${name}.test.8675309.yaml`, `${here}/${name}.test.8675309.yaml.json`]
  //   ]

  //   beforeEach(() => {
  //     readdirSync.mockImplementation(
  //       ( () => files ) as unknown as typeof readdirSync
  //     )
  //   })

  //   it("exposes the ordered manifest lookup list", () => {
  //     const trc = new TestRunCfg(me)
  //     expect(trc.manifests()).not.toHaveLength(0)
  //     trc.manifests().forEach((manifest, idx) => {
  //       const [yaml, json] = manifest
  //       const [yexp, jexp] = manifestList[idx]
  //       expect(yaml).toBe(yexp)
  //       expect(json).toBe(jexp)
  //     })
  //   })

  //   it("exposes json manifest lookup-by-index-number method", () => {
  //     const trc = new TestRunCfg(me)

  //     const json = (i: number) => manifestList[i][1]
  //     expect(trc.manifest(0)).toBe(json(0))
  //     expect(trc.manifest(8)).toBe(json(1))
  //     expect(trc.manifest(9)).toBe(json(2))
  //     expect(trc.manifest(1009)).toBe(json(3))
  //     expect(trc.manifest(8675309)).toBe(json(4))
  //   })
  // })
})
