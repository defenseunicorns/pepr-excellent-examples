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
    const testRunConfig = new TestRunCfg(me)
    expect(testRunConfig.me).toBe(me)
  })

  describe("exposes run-specific unique value", () => {
    it("can be autogenerated", () => {
      const testRunConfig = new TestRunCfg(me)
      expect(testRunConfig.unique).toBeTruthy()
    })

    it("can be given directly", () => {
      const unique = "set-explictly"
      const testRunConfig = new TestRunCfg(me, unique)
      expect(testRunConfig.unique).toBe(unique)
    })
  })

  describe("exposes kube config used for cluster operations", () => {
    it("defaults to KUBECONFIG envvar if set", () => {
      const env = { ...process.env }
      const kubeConfig = "test/kubeconfig.yaml"
      process.env.KUBECONFIG = kubeConfig

      const testRunConfig = new TestRunCfg(me)
      expect(testRunConfig.kubeConfig).toBe(kubeConfig)

      process.env = env
    })

    it("otherwise, defaults to widely-known default location", () => {
      const env = { ...process.env }
      delete process.env.KUBECONFIG

      const testRunConfig = new TestRunCfg(me)
      expect(testRunConfig.kubeConfig).toBe("~/.kube/config")

      process.env = env
    })

    it("can be given directly", () => {
      const kubeConfig = "~/.config/k3d/cluster.yaml"
      const testRunConfig = new TestRunCfg(me, undefined, kubeConfig)
      expect(testRunConfig.kubeConfig).toBe(kubeConfig)
    })
  })

  it("derives capability name", () => {
    const testRunConfig = new TestRunCfg(me)
    expect(testRunConfig.name()).toBe(name)
  })

  it("derives capability path", () => {
    const testRunConfig = new TestRunCfg(me)
    expect(testRunConfig.here()).toBe(here)
  })

  it ("determines project root", () => {
    nearestAncestor.mockClear().mockImplementation((f, p) => {
      if (f === "package.json" && p === here) {
        return `${root}/package.json`
      } else { throw "" }
    })
    const testRunConfig = new TestRunCfg(me)
    expect(testRunConfig.root()).toBe(root)
  })

  it ("derives cluster lock file path", () => {
    const lock = `${root}/cluster.lock`
    const testRunConfig = new TestRunCfg(me)
    expect(testRunConfig.lockfile()).toBe(lock)
  })

  it ("derives cluster lock file text", () => {
    const lock = `${root}/cluster.lock`
    const testRunConfig = new TestRunCfg(me)
    expect(testRunConfig.locktext()).toBe(`${testRunConfig.me}:${testRunConfig.unique}`)
  })

  it("exposes a capability-specific label key", () => {
    const labelKey = `test-transient/${name}`
    const testRunConfig = new TestRunCfg(me)
    expect(testRunConfig.labelKey()).toBe(labelKey)
  })

  describe("loadRaw()", () => {
    it("reads single resource from manifest yaml", async () => {
      const testRunConfig = new TestRunCfg(me)
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

      const actual = await testRunConfig.loadRaw(yaml)

      expect(actual).toEqual(expected)
    })

    it("reads all resources from manifest yaml", async () => {
      const testRunConfig = new TestRunCfg(me)
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

      const actual = await testRunConfig.loadRaw(yaml)

      expect(actual).toEqual(expected)
    })
  })

  describe("load()", () => {
    it("adds test label to single resource loaded from manifest yaml", async () => {
      const testRunConfig = new TestRunCfg(me)
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
            [testRunConfig.labelKey()]: testRunConfig.unique
          }
        }
      }]
      readFile.mockImplementation((path) => path === yaml
        ? Promise.resolve(original)
        : Promise.reject()
      )

      const actual = await testRunConfig.load(yaml)

      expect(actual).toEqual(expected)
    })

    it("adds test label to all resources loaded from manifest yaml", async () => {
      const testRunConfig = new TestRunCfg(me)
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
            [testRunConfig.labelKey()]: testRunConfig.unique
          }
        }
      }, {
        apiVersion: "v1",
        kind: "Namespace",
        metadata: {
          name: "beta",
          labels: {
            [testRunConfig.labelKey()]: testRunConfig.unique
          }
        }
      }]
      readFile.mockImplementation((path) => path === yaml
        ? Promise.resolve(original)
        : Promise.reject()
      )

      const actual = await testRunConfig.load(yaml)

      expect(actual).toEqual(expected)
    })
  })
})
