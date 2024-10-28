import { jest, describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { mins } from "helpers/src/time";
import { fullCreate } from "helpers/src/general";
import { moduleUp, moduleDown, logs, untilLogged } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { K8s, kind } from "pepr";

jest.setTimeout(240000);

const trc = new TestRunCfg(__filename);

describe("alias.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));
  afterAll(async () => {
    await clean(trc);
    await moduleDown();
  }, mins(2));

  async function loadAndCreate(file: string) {
    let [ns, resource] = await trc.load(file);
    await fullCreate([ns, resource]);
    return resource;
  }

  async function deleteResource(resource: any) {
    await K8s(kind[resource.kind]).Delete(resource);
  }

  async function fetchLogs(logCheck: string) {
    await untilLogged(logCheck);
    return await logs();
  }

  function parseAndFilterLogs(logz: string[], logCheck: string, field: string) {
    return logz
      .map(log => {
        try {
          return JSON.parse(log);
        } catch (e) {
          return null; // Ignore parsing errors
        }
      })
      .filter(logEntry => logEntry && logEntry.msg &&
        logEntry.msg.includes(logCheck))
      .map(logEntry => logEntry[field])
      .filter(fieldValue => fieldValue !== undefined); // Remove undefined values
  }

  // Reconcile Tests
  it(
    "create - reconcile - uses provided alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (reconcile-create-alias): reconcile/finalize";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([
          expect.stringMatching("alias:create:reconcile"),
          expect.stringMatching("alias:create:reconcile:finalize"),
        ])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - reconcile - uses default alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (reconcile-create-default-alias): reconcile/finalize";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([expect.stringMatching("no alias provided")])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - reconcile - does not log alias if alias child logger not used",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (reconcile-create-no-child-logger): reconcile/finalize";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.not.arrayContaining([expect.stringMatching('"alias":')])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  // Watch Tests
  it(
    "create - watch - uses provided alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (watch-create-alias): watch/finalize";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([
          expect.stringMatching("alias:create:watch"),
          expect.stringMatching("alias:create:watch:finalize"),
        ])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - watch - uses default alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (watch-create-default-alias): watch/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([expect.stringMatching("no alias provided")])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - watch - does not log alias if alias child logger not used",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (watch-create-no-child-logger): watch/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.not.arrayContaining([expect.stringMatching('"alias":')])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  // Validate Tests
  it(
    "create - validate - uses provided alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (validate-create-alias): validate/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([expect.stringMatching("alias:create:validate")])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - validate - uses default alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (validate-create-default-alias): validate/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([expect.stringMatching("no alias provided")])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - validate - does not log alias if alias child logger not used",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (validate-create-no-child-logger): validate/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.not.arrayContaining([expect.stringMatching('"alias":')])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  // Mutate Tests
  it(
    "create - mutate - uses provided alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (mutate-create-alias): mutate/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([expect.stringMatching("alias:create:mutate")])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - mutate - uses default alias",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (mutate-create-default-alias): mutate/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.arrayContaining([expect.stringMatching("no alias provided")])
      );

      await deleteResource(resource);
    },
    mins(2)
  );

  it(
    "create - mutate - does not log alias if alias child logger not used",
    async () => {
      const file = `${trc.root()}/capabilities/scenario.create.yaml`;
      const resource = await loadAndCreate(file);

      const logCheck = "external api call (mutate-create-no-child-logger): mutate/callback";
      const logz = await fetchLogs(logCheck);

      const aliases = parseAndFilterLogs(logz, logCheck, "alias");

      expect(aliases).toEqual(
        expect.not.arrayContaining([expect.stringMatching('"alias":')])
      );

      await deleteResource(resource);
    },
    mins(2)
  );
});
