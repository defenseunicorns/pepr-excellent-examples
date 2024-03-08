import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { secs, mins, sleep, timed } from 'helpers/src/time';
import { moduleUp, moduleDown, untilLogged, logs } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { live } from 'helpers/src/resource';

// kind["ClusterPolicyReport"] = ClusterPolicyReport
// kind["Exemption"] = Exemption

const apply = async res => {
  return await fullCreate(res, kind);
}

const trc = new TestRunCfg(__filename)

describe("hooks.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))

  afterAll(async () => await moduleDown(), mins(2))

  describe("honors module hooks:", () => {
    let logz: any[]

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.hooks.yaml`
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file)
        const resources_applied = await apply(resources)
  
        const cm = resources_applied[resources_applied.length-1]
        await live(kind.ConfigMap, cm)

        logz = (await logs()).map(l => JSON.parse(l))
      })
    })

    afterAll(async () => await clean(trc), mins(5))

    it("mutate-me", async () => {
      const mutateRequest = logz
        .filter(l => l.msg === "Incoming request")
        .filter(l => l.admissionKind === "Mutate")
        .filter(l => l.name === "/mutate-me")
        [0]

      const mutateBefore = logz
        .filter(l => l.msg === "AdmissionRequest --> beforeHook")
        .filter(l => l.request.uid === mutateRequest.uid)
      expect(mutateBefore).toHaveLength(1)

      const mutateAfter = logz
        .filter(l => l.msg === "MutateResponse --> afterHook")
        .filter(l => l.response.uid === mutateRequest.uid)
      expect(mutateAfter).toHaveLength(1)

      const validateRequest = logz
        .filter(l => l.msg === "Incoming request")
        .filter(l => l.admissionKind === "Validate")
        .filter(l => l.name === "/mutate-me")
        [0]

      const validateBefore = logz
        .filter(l => l.msg === "AdmissionRequest --> beforeHook")
        .filter(l => l.request.uid === validateRequest.uid)
      expect(validateBefore).toHaveLength(1)

      const validateAfter = logz
        .filter(l => l.msg === "Outgoing response")
        .filter(l => l.uid === validateRequest.uid)
        .filter(l => l.kubeAdmissionResponse.status.message ===
          'no in-scope validations -- allowed!'
        )
      expect(validateAfter).toHaveLength(1)
    }, secs(10))

    it("validate-me", async () => {
      const mutateRequest = logz
        .filter(l => l.msg === "Incoming request")
        .filter(l => l.admissionKind === "Mutate")
        .filter(l => l.name === "/validate-me")
        [0]

      const mutateBefore = logz
        .filter(l => l.msg === "AdmissionRequest --> beforeHook")
        .filter(l => l.request.uid === mutateRequest.uid)
      expect(mutateBefore).toHaveLength(1)

      const mutateAfter = logz
        .filter(l => l.msg === "MutateResponse --> afterHook")
        .filter(l => l.response.uid === mutateRequest.uid)
      expect(mutateAfter).toHaveLength(1)

      const validateRequest = logz
        .filter(l => l.msg === "Incoming request")
        .filter(l => l.admissionKind === "Validate")
        .filter(l => l.name === "/validate-me")
        [0]

      const validateBefore = logz
        .filter(l => l.msg === "AdmissionRequest --> beforeHook")
        .filter(l => l.request.uid === validateRequest.uid)
      expect(validateBefore).toHaveLength(1)

      const validateAfter = logz
        .filter(l => l.msg === "ValidateResponse --> afterHook")
        .filter(l => l.response.uid === validateRequest.uid)
      expect(validateAfter).toHaveLength(1)
    }, secs(10))

    it("mutate-and-validate-me", async () => {
      const mutateRequest = logz
        .filter(l => l.msg === "Incoming request")
        .filter(l => l.admissionKind === "Mutate")
        .filter(l => l.name === "/mutate-and-validate-me")
        [0]

      const mutateBefore = logz
        .filter(l => l.msg === "AdmissionRequest --> beforeHook")
        .filter(l => l.request.uid === mutateRequest.uid)
      expect(mutateBefore).toHaveLength(1)

      const mutateAfter = logz
        .filter(l => l.msg === "MutateResponse --> afterHook")
        .filter(l => l.response.uid === mutateRequest.uid)
      expect(mutateAfter).toHaveLength(1)

      const validateRequest = logz
        .filter(l => l.msg === "Incoming request")
        .filter(l => l.admissionKind === "Validate")
        .filter(l => l.name === "/mutate-and-validate-me")
        [0]

      const validateBefore = logz
        .filter(l => l.msg === "AdmissionRequest --> beforeHook")
        .filter(l => l.request.uid === validateRequest.uid)
      expect(validateBefore).toHaveLength(1)

      const validateAfter = logz
        .filter(l => l.msg === "ValidateResponse --> afterHook")
        .filter(l => l.response.uid === validateRequest.uid)
      expect(validateAfter).toHaveLength(1)
    }, secs(10))
  })
})