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

describe("ignored-ns.ts", () => {
  beforeAll(async () => await moduleUp(3), mins(4));

  afterAll(async () => await moduleDown(), mins(2));

  describe("ignored-ns-test", () => {
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.name.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        const resources_applied = await apply(resources);

        const last_cm = resources_applied[resources_applied.length - 1];
        await live(kind.ConfigMap, last_cm);
      });
    });

    afterAll(async () => await clean(trc), mins(5));
    it(
      "handles: handles ignored namespaces",
      async () => {
        const cm = await K8s(kind.ConfigMap)
          .InNamespace("ignored")
          .Get("invisible");
        expect(cm.metadata?.annotations).not.toEqual(
          expect.objectContaining({
            not: "seen",
          }),
        );
      },
      secs(10),
    );
  });
});
