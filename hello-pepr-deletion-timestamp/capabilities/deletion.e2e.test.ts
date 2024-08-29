import { beforeAll, afterAll, describe, it, jest, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

const trc = new TestRunCfg(__filename);

describe("deletion.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown()
    await clean(trc)
  }, mins(2))

  describe("tests WithDeletionTimestamp across admission and watch bindings", () => {
    let logz: string[]

     beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.resources.yaml`;
      await timed(`load: ${file}`, async () => {
        let [ ns1, ns2, ns1Admission, n1Watch, ns2Admission, ns2Watch ] = await trc.load(file)

        await fullCreate([ns1, ns2, ns1Admission, n1Watch, ns2Admission, ns2Watch])  

        await untilLogged("DTS: Saw a pod ns1-admission.")
        await untilLogged("DTS: Saw a pod ns1-watch.")
        logz = await logs();
      });
    }, mins(2));

    it("tests that the filters match for watch and admission", () => {
      const results = logz.filter(l => l.includes("DTS:"))
      let wants = [
        "DTS: Saw a pod ns1-admission.",
        "DTS: Saw a pod ns1-watch."
      ]
      wants.forEach((wanted, atIndex) => {
        expect(results[atIndex]).toContain(wanted)
      })

    }, secs(10));

    it("tests deletionTimestamp does not exist the filters do not match for watch and admission", () => {
      const results = logz.filter(l => l.includes("DTS:"))
      let wants = [
        "DTS: Saw a pod ns2-admission.",
        "DTS: Saw a pod ns2-watch."
      ]
      wants.forEach((wanted, atIndex) => {
        expect(results[atIndex]).not.toContain(wanted)
      })

    }, secs(10));
  });
});
