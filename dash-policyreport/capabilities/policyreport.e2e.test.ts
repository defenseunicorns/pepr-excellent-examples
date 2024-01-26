import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { Cmd } from "helpers/src/Cmd";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { readFile } from 'node:fs/promises';
import {
  mins,
  lock,
  unlock,
  // resourceGone,
  // untilGone,
  sleep,
} from "helpers/src/general";
import { spawnSync } from "node:child_process";
import { K8s, kind } from 'kubernetes-fluent-client';
import { parse} from 'yaml';
import { PolicyReport } from '../types/policyreport-v1alpha2';
import { assert } from "node:console";

const trc = new TestRunCfg(__filename);

beforeAll(async () => {
  await lock(trc);
}, mins(10));
afterAll(async () => {
  await unlock(trc);
});

const loadManifest = async (filePath)  => {
  return parse(await readFile(filePath, "utf8"))
}
describe("applyCRDs()", () => {
  it("applys our custom crd", async () => {
    const crd = await loadManifest(`${trc.root()}/types/policyreport-crd.yaml`)
    const crd_applied = await K8s(kind.CustomResourceDefinition).Apply(crd)
    console.log(crd_applied)

    const build = await new Cmd({ cmd: `npx pepr build` }).run()
    if (build.exitcode !== 0) { throw build}
    const deploy = await new Cmd({ cmd: `npx pepr deploy --confirm` }).run()
    if (deploy.exitcode !== 0) { throw deploy}

    const ns = await loadManifest(`${trc.here()}/namespace.yaml`)
    const ns_applied = await K8s(kind.Namespace).Apply(ns)
    console.log(ns_applied)

    const goodCm = await loadManifest(`${trc.here()}/configmap.pass.yaml`)
    const goodCm_applied = await K8s(kind.ConfigMap).Apply(goodCm)
    console.log(goodCm_applied)

    const badCm = await loadManifest(`${trc.here()}/configmap.fail.yaml`)
    const badCm_applied = await K8s(kind.ConfigMap).Apply(badCm)
    console.log(badCm_applied)

    // const policyReport = await K8s(PolicyReport).InNamespace("pepr-system").Get("pepr-policy-report")
    // expect(policyReport.summary.error).toBe(1)
    // console.log(policyReport)

    await sleep(mins(5))

    }, mins(5)
  )
  
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
});
