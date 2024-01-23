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
import { existsSync } from 'node:fs';
import { K8s, kind, RegisterKind } from "kubernetes-fluent-client";
import { secs, mins, resourceGone } from "./general";
import { TestRunCfg } from './TestRunCfg';
import { clean, up, down } from './cluster'
import { Cmd } from './Cmd';

describe("up()", () => {
  it("creates a test k3d cluster", async () => {
    const cluster = "pexex-helpers-cluster-e2e-up"

    const kubeconfig =  await up(cluster)

    expect(existsSync(kubeconfig)).toBe(true)
    const info = await new Cmd({
      env: { KUBECONFIG: kubeconfig },
      cmd: `kubectl cluster-info`,
    }).run()
    expect(info.stdout.join('\n')).toMatch(/is running/)

    const remove = await new Cmd({ cmd: `k3d cluster delete ${cluster}` }).run()
    expect(remove.exitcode).toBe(0)
    expect(existsSync(kubeconfig)).toBe(false)
  }, mins(2))
})

describe("down()", () => {
  it("delete a test k3d cluster", async () => {
    const cluster = "pexex-helpers-cluster-e2e-down"
    const kubeconfig = await up(cluster)

    await down(cluster)

    const list = await new Cmd({ cmd: `k3d cluster list` }).run()
    expect(list.stdout.join('\n')).not.toMatch(new RegExp(cluster))
    expect(existsSync(kubeconfig)).toBe(false)
  }, mins(2))
})

describe("clean()", () => {
  const cluster = "pexex-helpers-cluster-clean"
  let trc: TestRunCfg
  const originalEnv = { ...process.env }

  beforeAll(async () => {
    const kubeConfig = await up(cluster)
    trc = {
      kubeConfig,
      labelKey: jest.fn(() => "test-transient/capability-name")
    } as unknown as TestRunCfg
  }, mins(2))

  beforeEach(() => {
    // configure test-driven KFC to use test-defined kube config
    process.env.KUBECONFIG = trc.kubeConfig
  })

  afterEach(() => { process.env = { ...originalEnv } })

  afterAll(async () => { await down(cluster) }, mins(1))

  it("removes resources with TestRunCfg-defined label", async () => {
    const configMap = {
      apiVersion: "v1",
      kind: "ConfigMap",
      metadata: {
        name: "cm-name",
        namespace: "default",
        labels: { [trc.labelKey()]: "" }
      }
    }
    const applied = await K8s(kind.ConfigMap).Apply(configMap)

    await clean(trc)

    expect(await resourceGone(kind.ConfigMap, applied)).toBe(true)
  }, secs(5))

  it("removes CRD & CRs with TestRunCfg-defined label", async () => {
    const crd = {
      apiVersion: "apiextensions.k8s.io/v1",
      kind: "CustomResourceDefinition",
      metadata: {
        name: "crdtests.cluster.e2e.test.ts",
        labels: { [trc.labelKey()]: "" }
      },
      spec: {
        group: "cluster.e2e.test.ts",
        versions: [
          {
            name: "v1",
            served: true,
            storage: true,
            schema: {
              openAPIV3Schema: {
                type: "object",
                  properties: {
                    content: {
                      type: "string"
                    }
                  }
              }
            }
          }
        ],
        scope: "Namespaced",
        names: {
          plural: "crdtests",
          singular: "crdtest",
          kind: "CrdTest",
          shortNames: [
            "ct"
          ]
        }
      }
    }
    const applied_crd = await K8s(kind.CustomResourceDefinition).Apply(crd)

    const cr = {
      apiVersion: `${crd.spec.group}/${crd.spec.versions[0].name}`,
      kind: crd.spec.names.kind,
      metadata: {
        name: crd.spec.names.singular,
        namespace: "default",
        labels: { [trc.labelKey()]: "" }
      },
      content: "win!"
    }
    const cr_kind = class extends kind.GenericKind {}
    RegisterKind(cr_kind, {
      group: cr.apiVersion.split("/")[0],
      version: cr.apiVersion.split("/")[1],
      kind: cr.kind
    })
    const applied_cr = await K8s(cr_kind).Apply(cr)

    await clean(trc)

    expect(await resourceGone(cr_kind, applied_cr)).toBe(true)
    expect(await resourceGone(kind.CustomResourceDefinition, applied_crd)).toBe(true)
  }, secs(10))
})
