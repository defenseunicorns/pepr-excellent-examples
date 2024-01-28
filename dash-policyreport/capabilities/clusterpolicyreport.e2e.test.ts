import {
  beforeAll,
  afterAll,
  describe,
  it,
  // expect,
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
import { K8s, kind } from 'kubernetes-fluent-client';
import { parseAllDocuments } from 'yaml';
// import { ClusterPolicyReport } from '../types/clusterpolicyreport-v1alpha2';


const load = async (manifest)  => {
  const resources = parseAllDocuments(await readFile(manifest, "utf8"))
    .map(doc => JSON.parse(String(doc.contents)))

  for (const resource of resources) {
    resource.metadata.labels = resource.metadata.labels || {}
    resource.metadata.labels = {
      ...resource.metadata.labels,
      [trc.labelKey()]: trc.unique
    }
  }

  return resources
}

const apply = async (resources) => {
  return Promise.all(resources.map(r => K8s(kind[r.kind]).Apply(r)))
}


const trc = new TestRunCfg(__filename);

beforeAll(async () => { await lock(trc) }, mins(10))
afterAll( async () => { await unlock(trc) });

describe("Pepr ClusterPolicyReport()", () => {
  beforeAll(async () => {
    const crds = await load(`${trc.root()}/types/wgpolicyk8s.io_clusterpolicyreports.yaml`)
    const applied = await apply(crds)

    await new Cmd({ cmd: `npx pepr build` }).run()
    await new Cmd({ cmd: `npx pepr deploy --confirm` }).run()
  }, mins(5))

  it("applys our custom crd", async () => {

    // const ns = await load(`${trc.here()}/namespace.yaml`)
    // const ns_applied = await K8s(kind.Namespace).Apply(ns)

    // try {
    //   const goodCm = await load(`${trc.here()}/configmap.pass.yaml`)
    //   const goodCm_applied = await K8s(kind.ConfigMap).Apply(goodCm)
    //   console.log(goodCm_applied)

    //   const badCm = await load(`${trc.here()}/configmap.fail.yaml`)
    //   const badCm_applied = await K8s(kind.ConfigMap).Apply(badCm)
    //   console.log(badCm_applied)
    
    // } catch (e) {
    //   console.log(e)
    // }
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
