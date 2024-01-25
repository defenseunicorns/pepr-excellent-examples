import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it
} from '@jest/globals';
import { TestRunCfg } from 'helpers/src/TestRunCfg';
import { readFile } from 'node:fs/promises';
import {
  mins,
  lock,
  unlock,
  resourceGone,
  untilGone,
  sleep
} from "helpers/src/general";
import { K8s, kind } from 'kubernetes-fluent-client';
import { parse} from 'yaml';
import { PolicyReport } from '../types/policyreport-v1alpha1';  

const trc = new TestRunCfg(__filename)

beforeAll(async () => { await lock(trc) }, mins(10))
 afterAll(async () => { await unlock(trc) })

describe("applyCRDs()", () => {
  it("applys our custom crd", async() => {
    const crd = await readFile("./types/policyreport-crd.yaml", "utf8")
    const crd_output = await K8s(kind.CustomResourceDefinition).Apply(parse(crd))

    console.log(crd_output)

    export const PolicyReport = new Capability({
      name: "policyreport",
      description: "Generate PolicyReport resources",
    });
    

    sleep(1000) // wait for crd to be ready

  }, mins(10))  
  // it("removes CRD & CRs with TestRunCfg-defined label", async () => {
  //   const crd = {
  //     apiVersion: "apiextensions.k8s.io/v1",
  //     kind: "CustomResourceDefinition",
  //     metadata: {
  //       name: "crdtests.cluster.e2e.test.ts",
  //       labels: { [trc.labelKey()]: "" }
  //     },
  //     spec: {
  //       group: "cluster.e2e.test.ts",
  //       versions: [
  //         {
  //           name: "v1",
  //           served: true,
  //           storage: true,
  //           schema: {
  //             openAPIV3Schema: {
  //               type: "object",
  //                 properties: {
  //                   content: {
  //                     type: "string"
  //                   }
  //                 }
  //             }
  //           }
  //         }
  //       ],
  //       scope: "Namespaced",
  //       names: {
  //         plural: "crdtests",
  //         singular: "crdtest",
  //         kind: "CrdTest",
  //         shortNames: [
  //           "ct"
  //         ]
  //       }
  //     }
  //   }
  //   const applied_crd = await K8s(kind.CustomResourceDefinition).Apply(crd)

  //   const cr = {
  //     apiVersion: `${crd.spec.group}/${crd.spec.versions[0].name}`,
  //     kind: crd.spec.names.kind,
  //     metadata: {
  //       name: crd.spec.names.singular,
  //       namespace: "default",
  //       labels: { [trc.labelKey()]: "" }
  //     },
  //     content: "win!"
  //   }
  //   const cr_kind = class extends kind.GenericKind {}
  //   RegisterKind(cr_kind, {
  //     group: cr.apiVersion.split("/")[0],
  //     version: cr.apiVersion.split("/")[1],
  //     kind: cr.kind
  //   })
  //   const applied_cr = await K8s(cr_kind).Apply(cr)

  //   await clean(trc)

  //   expect(await resourceGone(cr_kind, applied_cr)).toBe(true)
  //   expect(await resourceGone(kind.CustomResourceDefinition, applied_crd)).toBe(true)
  // }, secs(10))
})
