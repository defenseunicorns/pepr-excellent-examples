import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { gone } from "helpers/src/resource";
import { secs, mins } from "helpers/src/time";
import { moduleUp, moduleDown, untilLogged } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";
import cfg from "../package.json";
import { spawnSync } from "child_process";

const trc = new TestRunCfg(__filename);

describe("mutate.ts", () => {
  beforeAll(async () => await moduleUp(1), mins(4));
  afterAll(async () => {
    await clean(trc);
    await moduleDown();
  }, mins(5));

  describe("mutate creates", () => {
    let ns, yay, meh, oof;

    beforeAll(async () => {
      [ns, yay, meh, oof] = await trc.load(
        `${trc.root()}/capabilities/scenario.create.yaml`,
      );
      ns = await fullCreate(ns);
    }, secs(10));

    it(
      "allows & annotates Mutate()'d resources",
      async () => {
        [yay] = await fullCreate(yay);
        const annotation = `${cfg.pepr.uuid}.pepr.dev/${cfg.name}`;
        expect(yay.metadata.annotations[annotation]).toBe("succeeded");
      },
      secs(10),
    );

    it(
      "allows but doesn't annotate non-Mutate()'d resources",
      async () => {
        [meh] = await fullCreate(meh);
        expect(meh.metadata.annotations).toBe(undefined);
      },
      secs(10),
    );

    it(
      "rejects unsuccessfully Mutate(yay)'d resources",
      async () => {
        expect(fullCreate(oof)).rejects.toMatchObject({
          data: { message: expect.stringMatching(/denied the request/) },
        });
      },
      secs(10),
    );
  });

  describe("mutate create-or-updates", () => {
    let ns, cyay, cmeh, coof, umeh, uoof;

    beforeAll(async () => {
      [ns, cyay, cmeh, coof, , umeh, uoof] = await trc.load(
        `${trc.root()}/capabilities/scenario.create-or-update.yaml`,
      );
      ns = await fullCreate(ns);
    }, secs(10));

    it(
      "allows & annotates Mutate()'d resources on create",
      async () => {
        [cyay] = await fullCreate(cyay);
        const annotation = `${cfg.pepr.uuid}.pepr.dev/${cfg.name}`;
        expect(cyay.metadata.annotations[annotation]).toBe("succeeded");
      },
      secs(10),
    );

    it(
      "allows but doesn't annotate non-Mutate()'d resources on create",
      async () => {
        [cmeh] = await fullCreate(cmeh);
        expect(cmeh.metadata.annotations).toBe(undefined);
      },
      secs(10),
    );

    it(
      "rejects unsuccessfully Mutate()'d resources on create",
      async () => {
        expect(fullCreate(coof)).rejects.toMatchObject({
          data: { message: expect.stringMatching(/denied the request/) },
        });
      },
      secs(10),
    );

    it(
      "allows but doesn't annotate non-Mutate()'d resources on update",
      async () => {
        await fullCreate(umeh);
        umeh = { ...umeh, stringData: { umeh: "update-meh" } };
        const applied = await K8s(kind.Secret).Apply(umeh);
        expect(applied.metadata?.annotations).toBe(undefined);
      },
      secs(10),
    );

    it(
      "rejects unsuccessfully Mutate()'d resources on update",
      async () => {
        await fullCreate(uoof);
        uoof = { ...uoof, stringData: { uoof: "update-oof" } };
        expect(K8s(kind.Secret).Apply(uoof)).rejects.toMatchObject({
          data: { message: expect.stringMatching(/denied the request/) },
        });
      },
      secs(10),
    );

    it(
      "shows the module UUID when `npx pepr uuid` is used",
      async () => {
        const uuidOut = spawnSync("npx pepr uuid", {
          shell: true, // Run command in a shell
          encoding: "utf-8", // Encode result as string
        });

        const { stdout } = uuidOut;

        expect(stdout).toContain("c6600eb7-5020-4bf0-87e3-61ffb6d607d8");
        expect(stdout).toContain("Description");
      },
      secs(10),
    );
  });

  describe("mutate updates", () => {
    let ns, yay, meh, oof;

    beforeAll(async () => {
      [ns, yay, meh, oof] = await trc.load(
        `${trc.root()}/capabilities/scenario.update.yaml`,
      );
      ns = await fullCreate(ns);
    }, secs(10));

    it(
      "allows & annotates Mutate()'d resources",
      async () => {
        await fullCreate(yay);
        yay = { ...yay, stringData: { yay: "update-yay" } };
        const applied = await K8s(kind.Secret).Apply(yay);
        const annotation = `${cfg.pepr.uuid}.pepr.dev/${cfg.name}`;
        expect(applied.metadata?.annotations?.[annotation]).toBe("succeeded");
      },
      secs(10),
    );

    it(
      "allows but doesn't annotate non-Mutate()'d resources",
      async () => {
        await fullCreate(meh);
        meh = { ...meh, stringData: { meh: "update-meh" } };
        const applied = await K8s(kind.Secret).Apply(meh);
        expect(applied.metadata?.annotations).toBe(undefined);
      },
      secs(10),
    );

    it(
      "rejects unsuccessfully Mutate(yay)'d resources",
      async () => {
        await fullCreate(oof);
        oof = { ...oof, stringData: { oof: "update-oof" } };
        expect(K8s(kind.Secret).Apply(oof)).rejects.toMatchObject({
          data: { message: expect.stringMatching(/denied the request/) },
        });
      },
      secs(10),
    );
  });

  describe("mutate deletes", () => {
    let ns, yay;

    beforeAll(async () => {
      [ns, yay] = await trc.load(
        `${trc.root()}/capabilities/scenario.delete.yaml`,
      );
      ns = await fullCreate(ns);
    }, secs(10));

    it(
      "triggers & allows delete of Mutate()'d resources",
      async () => {
        await fullCreate(yay);
        await K8s(kind.Secret).Delete(yay);
        await untilLogged('"msg":"Mutate: delete-yay"');
        await gone(kind.Secret, yay);
      },
      secs(10),
    );

    //
    // TODO: Why does this test not pass? Talk w/ team out why this admission
    //    webhook request throws but still allows the resource to be deleted!
    //
    // it("triggers & does not allow delete of unsuccessfully Mutate(yay)'d resources", async () => {
    //   await fullCreate(oof)
    //   expect(K8s(kind.Secret).Delete(oof)).rejects.toMatchObject({
    //     data: { message: expect.stringMatching(/denied the request/) }
    //   })
    //   let applied = await K8s(kind.Secret).Get(oof)
    //   console.log(await logs())
    //   expect(applied.metadata?.name).toBe(oof.metadata.name)
    // })
  });
});
