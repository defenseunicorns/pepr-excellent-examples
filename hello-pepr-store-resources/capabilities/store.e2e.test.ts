import { beforeAll, describe, it, expect } from "vitest";
import { kind, K8s } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { secs, mins, timed } from "helpers/src/time";
import { moduleUp, untilLogged, logs } from "helpers/src/pepr";
import { execSync } from "child_process";
import { PeprStore } from "./peprstore-v1";
const apply = async res => {
  return await fullCreate(res, kind);
};

const trc = new TestRunCfg(__filename);

describe("store.ts", () => {
  beforeAll(async () => {
    execSync(`kubectl apply -f ${trc.root()}/capabilities/peprstore.crd.yaml`, {
      stdio: "inherit",
    });
    await K8s(kind.Namespace).Apply({
      apiVersion: "v1",
      kind: "Namespace",
      metadata: {
        name: "pepr-system",
      },
    });
    execSync(
      `kubectl apply -f ${trc.root()}/capabilities/nonmigrated-peprstore.yaml`,
      { stdio: "inherit" },
    );
    await moduleUp(1);
    void mins(4);
  }, secs(90));

  describe("Store Resource", () => {
    let store: PeprStore;
    let _logz;
    beforeAll(async () => {
      const file = `${trc.root()}/capabilities/scenario.observe.yaml`;
      await timed(`load: ${file}`, async () => {
        const resources = await trc.load(file);
        await apply(resources);

        await untilLogged('"msg":"observed"');
        _logz = await logs();
      });
    }, mins(1));
    it("should migrate the store resource to v2", async () => {
      execSync("kubectl get peprstore -n pepr-system", {
        stdio: "inherit",
      });
      store = await K8s(PeprStore)
        .InNamespace("pepr-system")
        .Get("pepr-store-resources-store");
      expect(store).toBeDefined();
      console.log(JSON.stringify(store, null, 2));
      expect(store!.data!["hello-pepr-store-resources-v2-testing"]).toBe(
        "migrated",
      );
    });
    it("write the correct data to the store", () => {
      expect(true).toBe(true);
      console.log(JSON.stringify(store.data, null, 2));
      expect(store!.data!["hello-pepr-store-resources-v2-testing"]).toBe(
        "migrated",
      );
      expect(store!.data!["hello-pepr-store-resources-v2-a"]).toBe("1");
      expect(store!.data!["hello-pepr-store-resources-v2-b"]).toBe("2");
      expect(store!.data!["hello-pepr-store-resources-v2-c"]).toBe("3");
      expect(
        store!.data!["hello-pepr-store-resources-v2-https://observed"],
      ).toBe("yay");
      expect(store!.data!["__pepr_do_not_delete__"]).toBe("k-thx-bye");
    });
  });
});
