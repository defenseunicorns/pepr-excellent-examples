import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, timed } from "helpers/src/time";
import { gone } from "helpers/src/resource";
import { fullCreate, untilTrue } from "helpers/src/general";
import { K8s, kind } from "kubernetes-fluent-client";
import { clean } from "helpers/src/cluster";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
const trc = new TestRunCfg(__filename);

/*
 * The purpose of this test is to demonstrate that the watch module
 * correctly processes events based on the type of event.
 */

describe("watch.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(2));

  describe("tests watch module", () => {
    let logz: string[] = [];
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/watch.config.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        await fullCreate(resources, kind);
        await untilLogged("Observed creation of five");
        logz = await logs();
      });
    }, mins(1));

    it("should execute callback based on event create phase", () => {
      const results = logz.filter(l => l.includes("Observed creation of"));
      expect(results[0]).toContain("one");
      expect(results[1]).toContain("two");
      expect(results[2]).toContain("three");
      expect(results[3]).toContain("four");
      expect(results[4]).toContain("five");
    });

    it("should execute callback based on event create-or-update phase", async () => {
      // Create secret with name "new"
      await createUpdateSecret("new");
      // Update secret with name "two"
      await createUpdateSecret("two");
      await untilTrue(async () => await updatedSecret("two", "pepr-demo"));
      await untilLogged("Observed MODIFIED of");
      const createOrUpdateLogs = await logs();

      // get logs for createdOrUpdated
      const [added, modified] = createOrUpdateLogs.filter(
        l =>
          l.includes("Observed ADDED of new") ||
          l.includes("Observed MODIFIED of two"),
      );

      expect(added).toContain("Observed ADDED of new");
      expect(modified).toContain("Observed MODIFIED of two");
    });

    it("should execute callback based on update phase", async () => {
      await createUpdateSecret("three");
      await untilTrue(() => updatedSecret("three", "pepr-demo"));

      await untilLogged("Observed MODIFIED of three");
      const updateLogs = await logs();

      const results = updateLogs.filter(l =>
        l.includes("Observed MODIFIED of three"),
      );
      expect(results[0]).toContain("Observed MODIFIED of three");
    });

    it("should execute callback based on delete phase", async () => {
      await deleteSecret("four", "pepr-demo");
      await untilTrue(() => gone(kind.Secret, { metadata: { name: "four" } }));

      await untilLogged("Observed deletion of four");
      const deleteLogs = await logs();
      const results = deleteLogs.filter(l =>
        l.includes("Observed deletion of four"),
      );
      expect(results[0]).toContain("Observed deletion of four");
    });
  });
});

// createUpdateSecret updates the data field of a Secret
const createUpdateSecret = async (name: string) => {
  await K8s(kind.Secret).Apply(
    {
      metadata: {
        name: name,
        namespace: "pepr-demo",
      },
      type: "Opaque",
      data: {
        name: Buffer.from(`${name}-updated`).toString("base64"),
      },
    },
    { force: true },
  );
};

// deleteSecret deletes a Secret by a given name and namespace
const deleteSecret = async (name: string, namespace: string) => {
  await K8s(kind.Secret).InNamespace(namespace).Delete(name);
};

// updatedSecret checks if a ConfigMap has been updated by checking the data field
const updatedSecret = async (
  name: string,
  namespace: string,
): Promise<boolean> => {
  try {
    const cm = await K8s(kind.Secret).InNamespace(namespace).Get(name);

    if (
      cm.data?.name &&
      Buffer.from(cm.data?.name, "base64").toString("utf-8") ===
        `${name}-updated`
    ) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  } catch (e) {
    return Promise.resolve(false);
  }
};
