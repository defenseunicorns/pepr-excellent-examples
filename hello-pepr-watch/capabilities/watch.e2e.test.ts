import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { K8s, kind } from "kubernetes-fluent-client";
import { clean } from "helpers/src/cluster";
import { moduleUp, moduleDown, untilLogged } from "helpers/src/pepr";

const trc = new TestRunCfg(__filename);

describe("watch.ts", () => {
  beforeAll(async () => await moduleUp(1), mins(4));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  it(
    "watches resource creates",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resources = await trc.load(file);
      await fullCreate(resources, kind);

      // no direct assertion -- test succeeds when message is logged
      await untilLogged("Watched create-me: create");
    },
    secs(10),
  );

  it(
    "watches resource create-or-updates",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create-or-update.yaml`;
      const resources = await trc.load(file);
      await fullCreate(resources, kind);
      await untilLogged("Watched create-or-update-me: ADDED");

      const update = { ...resources.at(-1), stringData: { k: "v" } };
      await K8s(kind.Secret).Apply(update);

      // no direct assertion -- test succeeds when message is logged
      await untilLogged("Watched create-or-update-me: MODIFIED");
    },
    secs(10),
  );

  it(
    "watches resource updates",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.update.yaml`;
      const resources = await trc.load(file);
      await fullCreate(resources, kind);

      const update = { ...resources.at(-1), stringData: { k: "v" } };
      await K8s(kind.Secret).Apply(update);

      // no direct assertion -- test succeeds when message is logged
      await untilLogged("Watched update-me: update");
    },
    secs(10),
  );

  it(
    "watches resource deletes",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.delete.yaml`;
      const resources = await trc.load(file);
      await fullCreate(resources, kind);

      const { namespace, name } = resources.at(-1).metadata;
      await K8s(kind.Secret).InNamespace(namespace).Delete(name);

      // no direct assertion -- test succeeds when message is logged
      await untilLogged("Watched delete-me: delete");
    },
    secs(10),
  );

  it("should only deploy watch manifests if there are no admission bindings", async () => {
    const controllerDeployments = await K8s(kind.Deployment).InNamespace("pepr-system").Get();
    const controllerServices = await K8s(kind.Service).InNamespace("pepr-system").Get();

    expect(controllerDeployments.items.length).toBe(1);
    expect(controllerDeployments.items[0].metadata?.name).toBe(
      "pepr-2dde1046-4b91-498f-b58f-6b371932e4b6-watcher",
    );
    expect(controllerServices.items.length).toBe(1);
    expect(controllerServices.items[0].metadata?.name).toBe(
      "pepr-2dde1046-4b91-498f-b58f-6b371932e4b6-watcher",
    );
  });
});
