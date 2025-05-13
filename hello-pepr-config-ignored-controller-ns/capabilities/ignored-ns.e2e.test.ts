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

describe("ignored-controller-ns.ts", () => {
  beforeAll(async () => await moduleUp(), mins(4));

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

    it("should add the admission.ignoredNamespaces to the WebhookConfigurations namespaceSelector", async () => {
      const mutatingWebhookConfiguration = await K8s(
        kind.MutatingWebhookConfiguration,
      ).Get("pepr-ignored-controller-ns");

      const namespaceSelectorValues = mutatingWebhookConfiguration
        .webhooks[0]
        .namespaceSelector.matchExpressions[0].values;
      expect(namespaceSelectorValues).toEqual(["kube-system","pepr-system","mutate-ignored"]);
    });
    
    it(
      "ignores resources in admission.alwaysIgnore.namespaces for Mutate",
      async () => {
        const cm = await K8s(kind.ConfigMap)
          .InNamespace("mutate-ignored")
          .Get("mutate-ignored");
        // no label was set during admission due to admission.alwaysIgnore.namespaces
        expect(cm.metadata?.labels).toBeUndefined()
      },
      secs(10),
    );

    it(
      "allows watch to operate on resources in admission.alwaysIgnore.namespaces",
      async () => {
        const cm = await K8s(kind.ConfigMap)
          .InNamespace("mutate-ignored")
          .Get("mutate-ignored");
        expect(cm.metadata?.annotations).toEqual(
          expect.objectContaining({
            been: "seen",
          }),
        );
      },
      secs(10),
    );

    it(
      "allows mutate to operate on resources in watch.alwaysIgnore.namespaces",
      async () => {
        const cm = await K8s(kind.ConfigMap)
          .InNamespace("watch-ignored")
          .Get("watch-ignored");
        expect(cm.metadata?.labels['can']).toBe("see");
      },
      secs(10),
    );

    it(
      "ignores resources in watch.alwaysIgnore.namespaces for Watch",
      async () => {
        const cm = await K8s(kind.ConfigMap)
          .InNamespace("mutate-ignored")
          .Get("mutate-ignored");
        expect(cm.metadata?.labels?.['been']).toBeUndefined();
      },
      secs(10),
    );
  });
});
