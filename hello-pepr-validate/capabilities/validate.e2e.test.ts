import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  expect,
} from "@jest/globals";
import { spawn } from "child_process";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { halfCreate, fullCreate } from "helpers/src/general";
import { secs, mins, sleep } from "helpers/src/time";
import { moduleUp, moduleDown, untilLogged, logs } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

const trc = new TestRunCfg(__filename);

describe("validate.ts", () => {
  beforeAll(async () => await moduleUp(), mins(4));
  afterAll(async () => {
    await moduleDown();
    await clean(trc);
  }, mins(5));

  describe("validate creates", () => {
    let ns, yay, oof;

    beforeAll(async () => {
      [ns, yay, oof] = await trc.load(
        `${trc.root()}/capabilities/scenario.create.yaml`,
      );
      await fullCreate(ns);
    }, secs(10));

    it(
      "allows valid resources",
      async () => {
        await fullCreate(yay);

        // no direct assertion -- if message is logged, test succeeds
        await untilLogged(`Valid: ${yay.metadata.name}`);
      },
      secs(10),
    );

    it(
      "rejects invalid resources",
      async () => {
        const reject = await halfCreate(oof).catch(e => e.data.message);
        expect(reject).toMatch(`denied the request: ${oof.metadata.name}`);
      },
      secs(10),
    );

    it("monitors admission events through `npx pepr monitor [uuid]`", async () => {
      let output = "";
      const cmd = [
        "npx",
        "pepr",
        "monitor",
        "aac63ece-b202-5b18-b3c8-fff5b631a4f1",
      ];
      const proc = spawn("npx", cmd, { shell: true });
      const state = { accept: false, reject: false, done: false };
      proc.stdout.on("data", data => {
        const stdout: string = data.toString();
        output += stdout;
        state.accept = stdout.includes("✅") ? true : state.accept;
        state.reject = stdout.includes("❌") ? true : state.reject;
        if (state.accept && state.reject) {
          proc.kill();
          proc.stdin.destroy();
          proc.stdout.destroy();
          proc.stderr.destroy();
        }
      });

      proc.on("exit", () => (state.done = true));

      await until(() => state.done);
      expect(output.includes("create-oof")).toBe(true);
    }, 10000);
  });

  describe("validate create-or-updates", () => {
    let ns, createYay, createOof, updateYay, updateOof;

    beforeAll(async () => {
      [ns, createYay, createOof, updateYay, updateOof] = await trc.load(
        `${trc.root()}/capabilities/scenario.create-or-update.yaml`,
      );
      await fullCreate(ns);
    }, secs(10));

    it(
      "allows valid resource creates",
      async () => {
        await fullCreate(createYay);

        // no direct assertion -- if message is logged, test succeeds
        await untilLogged(`Valid: ${createYay.metadata.name}`);
      },
      secs(10),
    );

    it(
      "rejects invalid resource creates",
      async () => {
        const reject = await halfCreate(createOof).catch(e => e.data.message);
        expect(reject).toMatch(
          `denied the request: ${createOof.metadata.name}`,
        );
      },
      secs(10),
    );

    it(
      "allows valid resource updates",
      async () => {
        await fullCreate(updateYay);
        const update = { ...updateYay, stringData: { k: "v" } };
        await K8s(kind.Secret).Apply(update);

        // no direct assertion -- if message is logged, test succeeds
        await untilLogged(`Valid: ${updateYay.metadata.name}`, 2);
      },
      secs(10),
    );

    it(
      "rejects invalid resource updates",
      async () => {
        await fullCreate(updateOof);
        const update = { ...updateOof, stringData: { k: "v" } };

        const reject = await K8s(kind.Secret)
          .Apply(update)
          .catch(e => e.data.message);
        expect(reject).toMatch(
          `denied the request: ${updateOof.metadata.name}`,
        );
      },
      secs(10),
    );
  });

  describe("validate updates", () => {
    let ns, yay, oof;

    beforeAll(async () => {
      [ns, yay, oof] = await trc.load(
        `${trc.root()}/capabilities/scenario.update.yaml`,
      );
      await fullCreate(ns);
    }, secs(10));

    it(
      "allows valid resources",
      async () => {
        await fullCreate(yay);
        const update = { ...yay, stringData: { k: "v" } };
        await K8s(kind.Secret).Apply(update);

        // no direct assertion -- if message is logged, test succeeds
        await untilLogged(`Valid: ${yay.metadata.name}`);
      },
      secs(10),
    );

    it(
      "rejects invalid resources",
      async () => {
        await fullCreate(oof);
        const update = { ...oof, stringData: { k: "v" } };

        const reject = await K8s(kind.Secret)
          .Apply(update)
          .catch(e => e.data.message);
        expect(reject).toMatch(`denied the request: ${oof.metadata.name}`);
      },
      secs(10),
    );
  });

  describe("validate deletes", () => {
    let ns, yay, oof;

    beforeAll(async () => {
      [ns, yay, oof] = await trc.load(
        `${trc.root()}/capabilities/scenario.delete.yaml`,
      );
      await fullCreate(ns);
    }, secs(10));

    it(
      "allows valid resources",
      async () => {
        await fullCreate(yay);
        await K8s(kind.Secret).Delete(yay);

        // no direct assertion -- if message is logged, test succeeds
        await untilLogged(`Valid: ${yay.metadata.name}`);
      },
      secs(10),
    );

    it(
      "rejects invalid resources",
      async () => {
        await fullCreate(oof);

        const reject = await K8s(kind.Secret)
          .Delete(oof)
          .catch(e => e.data.message);
        expect(reject).toMatch(`denied the request: ${oof.metadata.name}`);
      },
      secs(10),
    );
  });
});

const until = (predicate: () => boolean): Promise<void> => {
  const poll = (resolve: () => void) => {
    if (predicate()) {
      resolve();
    } else {
      setTimeout(_ => poll(resolve), 250);
    }
  };
  return new Promise(poll);
};
