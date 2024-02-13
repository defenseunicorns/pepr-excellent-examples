import {
  beforeAll,
  afterEach,
  describe,
  it,
  expect,
} from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { halfCreate, fullCreate } from "helpers/src/general";
import { secs, mins, sleep } from 'helpers/src/time';
import { moduleUp, untilLogged, logs } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';

const trc = new TestRunCfg(__filename)

describe("validate.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))
  afterEach(async () => await clean(trc), mins(5))

  it("prevents bad examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.fail.yaml`)

    let rejects = (await Promise.all(resources.map(r => {
      return halfCreate(r).then(() => '').catch(e => e.data.message)}
    ))).filter(f => f)

    // Pepr-namespaced requests are rejected directly
    expect(rejects).toHaveLength(2)
    expect(rejects).toEqual(
      expect.arrayContaining([
        expect.stringMatching("denied the request: fail-oof"),
        expect.stringMatching("denied the request: fail-missing"),
      ])
    )
  }, secs(10))
  
  it("allows good examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.pass.yaml`)
    await Promise.all(resources.map(r => fullCreate(r)))

    // fullCreate will wait until resources are Get-able from cluster, hence
    //  no need for expect()s -- test succeeds if it doesn't error/timeout

    // test succeeds, but.. seeing strange entry in the logs (pepr@0.25.0)
    //  validate fixed after merge/release of https://github.com/defenseunicorns/pepr/pull/573
    // {"level":20,"time":1707757122199,"pid":16,"hostname":"pepr-aac63ece-b202-5b18-b3c8-fff5b631a4f1-66f46c5c47-w92g7","uid":"a1bb6dd2-42ae-48aa-ba03-cb5c68604176","namespace":"prohibited","name":"/fail-namespace","request":{"uid":"a1bb6dd2-42ae-48aa-ba03-cb5c68604176","kind":{"group":"","version":"v1","kind":"ConfigMap"},"resource":{"group":"","version":"v1","resource":"configmaps"},"requestKind":{"group":"","version":"v1","kind":"ConfigMap"},"requestResource":{"group":"","version":"v1","resource":"configmaps"},"name":"fail-namespace","namespace":"prohibited","operation":"CREATE","userInfo":{"username":"system:admin","groups":["system:masters","system:authenticated"]},"object":{"kind":"ConfigMap","apiVersion":"v1","metadata":{"name":"fail-namespace","namespace":"prohibited","uid":"a5ba177b-a4ae-4d99-930e-2901c7680f31","creationTimestamp":"2024-02-12T16:58:42Z","labels":{"test-transient/validate":"1707757052468"},"managedFields":[{"manager":"pepr","operation":"Apply","apiVersion":"v1","time":"2024-02-12T16:58:42Z","fieldsType":"FieldsV1","fieldsV1":{"f:data":{"f:pass":{}},"f:metadata":{"f:labels":{"f:test-transient/validate":{}}}}}]},"data":{"pass":"yep"}},"oldObject":null,"dryRun":false,"options":{"kind":"CreateOptions","apiVersion":"meta.k8s.io/v1","fieldManager":"pepr","fieldValidation":"Strict"}},"msg":"Incoming request body"},
    // {"level":30,"time":1707757122199,"pid":16,"hostname":"pepr-aac63ece-b202-5b18-b3c8-fff5b631a4f1-66f46c5c47-w92g7","uid":"a1bb6dd2-42ae-48aa-ba03-cb5c68604176","namespace":"prohibited","name":"/fail-namespace","gvk":{"group":"","version":"v1","kind":"ConfigMap"},"operation":"CREATE","admissionKind":"Validate","msg":"Incoming request"},
    // {"level":50,"time":1707757122200,"pid":16,"hostname":"pepr-aac63ece-b202-5b18-b3c8-fff5b631a4f1-66f46c5c47-w92g7","err":{"type":"TypeError","message":"Cannot read properties of undefined (reading 'uid')","stack":"TypeError: Cannot read properties of undefined (reading 'uid')\\n    at /app/node_modules/pepr/dist/lib.js:907:34\\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"},"msg":"Cannot read properties of undefined (reading 'uid')"},
    // {"level":20,"time":1707757122200,"pid":16,"hostname":"pepr-aac63ece-b202-5b18-b3c8-fff5b631a4f1-66f46c5c47-w92g7","msg":"Namespace does not match"},
    // {"level":30,"time":1707757122200,"pid":16,"hostname":"pepr-aac63ece-b202-5b18-b3c8-fff5b631a4f1-66f46c5c47-w92g7","uid":"a1bb6dd2-42ae-48aa-ba03-cb5c68604176","namespace":"prohibited","name":"/fail-namespace","msg":"Processing validation request"},
    // {"level":40,"time":1707757122206,"pid":16,"hostname":"pepr-aac63ece-b202-5b18-b3c8-fff5b631a4f1-66f46c5c47-w92g7","uid":"a1bb6dd2-42ae-48aa-ba03-cb5c68604176","method":"POST","url":"/validate/cf0406bbadebf77c4c4a20413f4496d54c71e0ad6570b953f026674f8fb36189?timeout=10s","status":500,"duration":"8 ms"},
  }, secs(10))
})