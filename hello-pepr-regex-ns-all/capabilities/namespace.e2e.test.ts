import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { kind, K8s } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { secs, mins, sleep, timed } from "helpers/src/time";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { live } from "helpers/src/resource";

const apply = async res => {
  return await fullCreate(res, kind);
};

const trc = new TestRunCfg(__filename);

describe("namespace.ts", () => {
  beforeAll(async () => await moduleUp(3), mins(4));

  afterAll(async () => await moduleDown(), mins(2));

  describe("unspecified module namespaces", () => {
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.namespace.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        const resources_applied = await apply(resources);

        const last_cm = resources_applied[resources_applied.length - 1];
        await live(kind.ConfigMap, last_cm);
      });
    });

    afterAll(async () => await clean(trc), mins(5));

    it(
      "handles: default regex namespace resources",
      async () => {
        const cm = await K8s(kind.ConfigMap)
          .InNamespace("default")
          .Get("cm-def");
        expect(cm.metadata?.annotations).toEqual(
          expect.objectContaining({
            def: "seen",
            non: "seen",
          }),
        );
      },
      secs(10),
    );

    it(
      "handles: non-default regex namespace resources",
      async () => {
        const cm = await K8s(kind.ConfigMap)
          .InNamespace("hello-pepr-ns-all")
          .Get("cm-ns");
        expect(cm.metadata?.annotations).toEqual(
          expect.objectContaining({
            ns: "seen",
            non: "seen",
          }),
        );
      },
      secs(10),
    );
  });
});
