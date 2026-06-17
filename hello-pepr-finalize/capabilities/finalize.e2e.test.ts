import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins, secs, timed } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";
import { KubernetesObject } from "kubernetes-fluent-client";

const trc = new TestRunCfg(__filename);

const FINALIZER = "pepr.dev/finalizer";
const TEST_NAMESPACES = [
  "hello-pepr-finalize-create",
  "hello-pepr-finalize-createorupdate",
  "hello-pepr-finalize-update",
  "hello-pepr-finalize-update-opt-out",
  "hello-pepr-finalize-delete",
];

// Clears pepr.dev/finalizer from any leftover ConfigMap in the test
// namespaces so namespace termination can't block cleanup. Without this,
// any CM whose Finalize callback didn't fire (or returned false) keeps
// its namespace stuck Terminating and afterAll hangs to its timeout.
async function stripFinalizers(): Promise<void> {
  for (const ns of TEST_NAMESPACES) {
    let cms;
    try {
      cms = await K8s(kind.ConfigMap).InNamespace(ns).Get();
    } catch (e) {
      if (e.status === 404) continue;
      throw e;
    }
    for (const cm of cms.items) {
      if (!cm.metadata?.finalizers?.includes(FINALIZER)) continue;
      await K8s(kind.ConfigMap, {
        namespace: ns,
        name: cm.metadata!.name!,
      }).Patch([{ op: "replace", path: "/metadata/finalizers", value: [] }]);
    }
  }
}

// Pepr persists its own state in pepr-system (ConfigMaps/Secrets named
// pepr-<uuid>-*) with finalizers it removes during graceful shutdown.
// In test teardown the controller is killed before it can drain those
// finalizers, so pepr-system stays in Terminating and moduleDown's
// `untilTrue(() => gone(...))` waits forever. Clearing finalizers here
// lets the namespace terminate immediately.
async function stripPeprSystemFinalizers(): Promise<void> {
  const ns = "pepr-system";
  for (const k of [kind.ConfigMap, kind.Secret]) {
    let items;
    try {
      items = (await K8s(k).InNamespace(ns).Get()).items;
    } catch (e) {
      if (e.status === 404) continue;
      throw e;
    }
    for (const obj of items) {
      if (!obj.metadata?.finalizers?.length) continue;
      await K8s(k, { namespace: ns, name: obj.metadata!.name! }).Patch([
        { op: "replace", path: "/metadata/finalizers", value: [] },
      ]);
    }
  }
}

describe("finalize.ts", () => {
  beforeAll(async () => await moduleUp(3), mins(4));
  afterAll(async () => {
    await stripFinalizers();
    await clean(trc);
    await stripPeprSystemFinalizers();
    await moduleDown();
  }, mins(2));

  describe("create", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      await timed(`load: ${file}`, async () => {
        const [ns, cmReconcile, cmWatch] = await trc.load(file);
        await fullCreate([ns, cmReconcile, cmWatch]);

        await K8s(kind[cmReconcile.kind]).Delete(cmReconcile);
        await K8s(kind[cmWatch.kind]).Delete(cmWatch);

        await untilLogged(
          "Removed finalizer 'pepr.dev/finalizer' from 'hello-pepr-finalize-create/",
          2,
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "triggers action and finalizer callbacks",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (create):'),
        );

        expect(results).toEqual(
          expect.arrayContaining([
            expect.stringMatching("reconcile/callback"),
            expect.stringMatching("reconcile/finalize"),
            expect.stringMatching("watch/callback"),
            expect.stringMatching("watch/finalize"),
          ]),
        );
      },
      secs(10),
    );
  });

  describe("createorupdate", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.create-or-update.yaml`;
      await timed(`load: ${file}`, async () => {
        const [ns, cmWatch] = await trc.load(file);
        await fullCreate([ns, cmWatch]);

        await K8s(kind[cmWatch.kind]).Apply({
          ...cmWatch,
          data: { note: "updated" },
        });
        await K8s(kind[cmWatch.kind]).Delete(cmWatch);

        await untilLogged(
          "Removed finalizer 'pepr.dev/finalizer' from 'hello-pepr-finalize-createorupdate/",
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "triggers action and finalizer callbacks",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (createorupdate):'),
        );

        const wants = [
          "watch/callback", // create
          "watch/callback", // update
          "watch/finalize",
        ];
        wants.forEach((wanted, atIndex) => {
          expect(results[atIndex]).toContain(wanted);
        });
      },
      secs(10),
    );
  });

  describe("update", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.update.yaml`;
      await timed(`load: ${file}`, async () => {
        const [ns, cmWatch] = await trc.load(file);
        await fullCreate([ns, cmWatch]);

        await K8s(kind[cmWatch.kind]).Apply({
          ...cmWatch,
          data: { note: "updated" },
        });
        await K8s(kind[cmWatch.kind]).Delete(cmWatch);

        await untilLogged(
          "Removed finalizer 'pepr.dev/finalizer' from 'hello-pepr-finalize-update/",
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "triggers action and finalizer callbacks",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (update):'),
        );

        const wants = ["watch/callback", "watch/finalize"];
        wants.forEach((wanted, atIndex) => {
          expect(results[atIndex]).toContain(wanted);
        });
      },
      secs(10),
    );
  });

  describe("update, opt out of removing finalizer", () => {
    let logz: string[];
    let ns, cmWatch;

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.update.opt-out.yaml`;
      await timed(`load: ${file}`, async () => {
        [ns, cmWatch] = await trc.load(file);
        await fullCreate([ns, cmWatch]);

        await K8s(kind[cmWatch.kind]).Apply({
          ...cmWatch,
          data: { note: "updated" },
        });
        await K8s(kind[cmWatch.kind]).Delete(cmWatch);

        await untilLogged(
          "Skipping removal of finalizer 'pepr.dev/finalizer' from 'hello-pepr-finalize-update-opt-out/",
        );

        logz = await logs();
      });
    }, mins(2));

    it(
      "triggers action and finalizer callbacks but skips removing finalizer",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (update-opt-out):'),
        );

        const wants = ["watch/callback", "watch/pre-finalize"];
        wants.forEach((wanted, atIndex) => {
          expect(results[atIndex]).toContain(wanted);
        });

        // pull fresh resource (to verify that finalizer still exists)
        const resource: KubernetesObject = await K8s(kind[cmWatch.kind])
          .InNamespace(cmWatch.metadata.namespace)
          .Get(cmWatch.metadata.name);

        // clear finalizers so that cleanup won't get blocked
        await K8s(kind[cmWatch.kind], {
          namespace: cmWatch.metadata.namespace,
          name: cmWatch.metadata.name,
        }).Patch([
          {
            op: "replace",
            path: `/metadata/finalizers`,
            value: [],
          },
        ]);

        // assert AFTER finalizer is cleared so that cleanup doesn't hang in failure case
        expect(resource.metadata?.finalizers).toEqual(["pepr.dev/finalizer"]);
      },
      secs(10),
    );
  });

  describe("delete", () => {
    let logz: string[];

    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.delete.yaml`;
      await timed(`load: ${file}`, async () => {
        const [ns, cmWatch] = await trc.load(file);
        await fullCreate([ns, cmWatch]);

        await K8s(kind[cmWatch.kind]).Delete(cmWatch);

        await untilLogged(
          "Removed finalizer 'pepr.dev/finalizer' from 'hello-pepr-finalize-delete/",
        );
        logz = await logs();
      });
    }, mins(2));

    it(
      "triggers action and finalizer callbacks",
      async () => {
        const results = logz.filter(l =>
          l.includes('"msg":"external api call (delete):'),
        );

        const wants = ["watch/finalize", "watch/callback"];
        wants.forEach((wanted, atIndex) => {
          expect(results[atIndex]).toContain(wanted);
        });
      },
      secs(10),
    );
  });
});
