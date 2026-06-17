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

// Diagnostic dump: log everything in pepr-system at teardown time so we
// can identify what's actually holding the namespace in Terminating.
// Runs right before moduleDown(). Best-effort — never throws.
async function dumpPeprSystem(): Promise<void> {
  const ns = "pepr-system";
  console.log(`[diag] === pepr-system teardown snapshot ===`);
  try {
    const got = await K8s(kind.Namespace).Get(ns);
    console.log(
      `[diag] namespace phase=${got.status?.phase} conditions=${JSON.stringify(
        got.status?.conditions ?? [],
      )} finalizers=${JSON.stringify(got.spec?.finalizers ?? [])}`,
    );
  } catch (e) {
    console.log(`[diag] namespace Get failed: status=${e.status}`);
  }

  const kinds: Array<[string, any]> = [
    ["ConfigMap", kind.ConfigMap],
    ["Secret", kind.Secret],
    ["Pod", kind.Pod],
    ["Service", kind.Service],
    ["Deployment", kind.Deployment],
    ["ServiceAccount", kind.ServiceAccount],
  ];
  for (const [label, k] of kinds) {
    try {
      const list = await K8s(k).InNamespace(ns).Get();
      for (const obj of list.items) {
        const fins = obj.metadata?.finalizers ?? [];
        const dt = obj.metadata?.deletionTimestamp;
        console.log(
          `[diag] ${label}/${obj.metadata?.name} finalizers=${JSON.stringify(fins)} deletionTimestamp=${dt ?? "none"}`,
        );
      }
    } catch (e) {
      console.log(`[diag] ${label} list failed: status=${e.status}`);
    }
  }
  console.log(`[diag] === end snapshot ===`);
}

// Bound moduleDown() so afterAll can complete even if pepr-system stays
// stuck Terminating. The CI job's k3d cluster is destroyed when the job
// ends, so leaving residual Pepr artifacts is harmless. NOT the same as
// raising vitest's hookTimeout — that would just wait longer for the
// same hang; this gives up on the wait and lets the hook exit cleanly.
async function moduleDownBounded(budgetSecs: number): Promise<void> {
  const result = await Promise.race([
    moduleDown().then(() => "done" as const),
    new Promise<"timeout">(resolve =>
      setTimeout(() => resolve("timeout"), budgetSecs * 1000),
    ),
  ]);
  if (result === "timeout") {
    console.warn(
      `[diag] moduleDown() exceeded ${budgetSecs}s; proceeding so afterAll can complete`,
    );
  }
}

describe("finalize.ts", () => {
  beforeAll(async () => await moduleUp(3), mins(4));
  afterAll(async () => {
    await stripFinalizers();
    await clean(trc);
    await stripPeprSystemFinalizers();
    await moduleDownBounded(45);
    // Dump AFTER moduleDown timed out — pepr-system should now be in
    // Terminating phase with status.conditions naming the actual blocker
    // (NamespaceContentRemaining, NamespaceFinalizersRemaining, etc.).
    await dumpPeprSystem();
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
