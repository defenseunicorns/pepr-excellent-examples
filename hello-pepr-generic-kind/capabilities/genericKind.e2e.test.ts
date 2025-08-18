import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { K8s, kind } from "kubernetes-fluent-client";
import { clean } from "helpers/src/cluster";
import { moduleUp, moduleDown, untilLogged } from "helpers/src/pepr";
import { execSync } from "child_process";

const trc = new TestRunCfg(__filename);
const name = "hello-pepr-generic-kind";
describe("genericKind.ts", () => {
  beforeAll(async () => {
    /*
     * load the CRD into Kubernetes BEFORE the module starts up
     * so the watches can be created
     */
    const file = `${trc.root()}/capabilities/scenario.setup.yaml`;
    const resources = await trc.load(file);
    await fullCreate(resources, kind);
    await moduleUp(3);
  }, mins(4));

  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  it(
    "watches resource creates",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      execSync(`kubectl apply -f ${file}`);

      await untilLogged("GenericKind created and mutated");
      await untilLogged("GenericKind created and validated");
      await untilLogged("GenericKind created and watched");
    },
    secs(10),
  );

  it(
    "watches resource create-or-updates",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create-or-update.yaml`;
      const resources = await trc.load(file);
      execSync(`kubectl apply -f ${file}`);

      // no direct assertion -- test succeeds when message is logged
      await untilLogged("GenericKind created or updated and mutated");
      await untilLogged("GenericKind created or updated and validated");
      await untilLogged("GenericKind created or updated and watched");
    },
    secs(10),
  );

  it(
    "watches resource updates",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.update.yaml`;
      execSync(`kubectl apply -f ${file}`);

      await K8s(kind.GenericKind, {
        kindOverride: {
          group: "pepr.dev",
          version: "v1",
          kind: "Unicorn",
        },
      }).Apply(
        {
          metadata: {
            name: "update",
            namespace: name,
          },
          spec: {
            message: "updated",
            counter: Math.random(),
          },
        },
        { force: true },
      );

      // no direct assertion -- test succeeds when message is logged
      await untilLogged("GenericKind updated and mutated");
      await untilLogged("GenericKind updated and validated");
      await untilLogged("GenericKind updated and watched");
    },
    secs(10),
  );

  it(
    "watches resource deletes",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.delete.yaml`;
      execSync(`kubectl apply -f ${file}`);

      await K8s(kind.GenericKind, {
        kindOverride: {
          group: "pepr.dev",
          version: "v1",
          kind: "Unicorn",
        },
      }).Delete({
        metadata: {
          name: "delete",
          namespace: name,
        },
        spec: {
          message: "updated",
          counter: Math.random(),
        },
      });

      // no direct assertion -- test succeeds when message is logged
      await untilLogged("GenericKind deleted mutated");
      await untilLogged("GenericKind deleted validated");
      await untilLogged("GenericKind deleted watched");
    },
    secs(10),
  );

  describe("additional webhooks", () => {
    let mutatingWebhook;
    let validatingWebhook;

    beforeAll(async () => {
      mutatingWebhook = await K8s(kind.MutatingWebhookConfiguration).Get("pepr-generic-kind");
      validatingWebhook = await K8s(kind.ValidatingWebhookConfiguration).Get("pepr-generic-kind");
    });
    it("adds the additionalWebhook's namespace to the ignore list in the namespace selector", async () => {
      expect(mutatingWebhook.webhooks[0].namespaceSelector.matchExpressions).toContainEqual({
        key: "kubernetes.io/metadata.name",
        operator: "NotIn",
        values: ["kube-system", "pepr-system", "istio-system", "monitoring"],
      });

      expect(validatingWebhook.webhooks[0].namespaceSelector.matchExpressions).toContainEqual({
        key: "kubernetes.io/metadata.name",
        operator: "NotIn",
        values: ["kube-system", "pepr-system", "istio-system", "monitoring"],
      });
    });

    it("adds the additionalWebhook's failurePolicy to the new webhooks", async () => {
      expect(mutatingWebhook.webhooks[1].failurePolicy).toBe("Ignore");
      expect(validatingWebhook.webhooks[2].failurePolicy).toBe("Fail");
    });

    it("adds the additionalWebhook's namespace to the namespace selector", async () => {
      expect(mutatingWebhook.webhooks[1].namespaceSelector.matchExpressions).toContainEqual({
        key: "kubernetes.io/metadata.name",
        operator: "In",
        values: ["istio-system"],
      });

      expect(validatingWebhook.webhooks[2].namespaceSelector.matchExpressions).toContainEqual({
        key: "kubernetes.io/metadata.name",
        operator: "In",
        values: ["monitoring"],
      });
    });
  });
});
