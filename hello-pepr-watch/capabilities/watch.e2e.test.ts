import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { K8s, kind } from "kubernetes-fluent-client";
import { clean } from "helpers/src/cluster";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";

const trc = new TestRunCfg(__filename);

describe("watch.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  it("watches resource creates", async () => {
    const file = `${trc.root()}/capabilities/scenario.create.yaml`;
    const resources = await trc.load(file);
    await fullCreate(resources, kind);
    await untilLogged("Observed creation of five");

    const logz = await logs();

    const results = logz.filter(l => l.includes("Observed creation of"));
    expect(results).toEqual(expect.arrayContaining([
      expect.stringContaining("one"),
      expect.stringContaining("two"),
      expect.stringContaining("three"),
      expect.stringContaining("four"),
      expect.stringContaining("five"),
    ]));
  }, secs(10));

  it("watches resource create-or-updates", async () => {
    const file = `${trc.root()}/capabilities/scenario.create-or-update.yaml`;
    const resources = await trc.load(file);
    await fullCreate(resources, kind);
    await updateSecret("two");
    await untilLogged("Observed MODIFIED of");

    const logz = await logs();
    const observed = logz.filter(l => l.includes("Observed"));

    expect(observed).toEqual(expect.arrayContaining([
      expect.stringContaining("Observed ADDED of new"),
      expect.stringContaining("Observed MODIFIED of two")
    ]));
  }, secs(10));

  it("watches resource updates", async () => {
    await updateSecret("three");
    await untilLogged("Observed update of three");

    const logz = await logs();

    expect(logz).toEqual(expect.arrayContaining([
      expect.stringContaining("Observed update of two"),
      expect.stringContaining("Observed update of three")
    ]));
  }, secs(10));

  it("watches resource deletes", async () => {
    await deleteSecret("four", "hello-pepr-watch");
    await untilLogged("Observed deletion of four");

    const logz = await logs();

    expect(logz).toEqual(expect.arrayContaining([
      expect.stringContaining("Observed deletion of four")
    ]));
  }, secs(10));
});

const updateSecret = async (name: string) => {
  await K8s(kind.Secret).Apply(
    {
      metadata: {
        name: name,
        namespace: "hello-pepr-watch",
      },
      type: "Opaque",
      data: {
        name: Buffer.from(`${name}-updated`).toString("base64"),
      },
    },
    { force: true },
  );
};

const deleteSecret = async (name: string, namespace: string) => {
  await K8s(kind.Secret).InNamespace(namespace).Delete(name);
};