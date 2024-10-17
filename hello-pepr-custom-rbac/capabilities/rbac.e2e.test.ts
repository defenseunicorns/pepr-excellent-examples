import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import { kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { mins } from 'helpers/src/time';
import { moduleUp, moduleDown } from 'helpers/src/pepr';
import { clean } from 'helpers/src/cluster';
import { live } from 'helpers/src/resource';
import fs from 'fs/promises';
import path from 'path';

const apply = async res => {
  return await fullCreate(res, kind);
}

const trc = new TestRunCfg(__filename)

describe("customRBAC.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2))

  afterAll(async () => await moduleDown(), mins(2))

    describe("creates custom rbac rules:", () => {
      let logz: any[]

      it("should create the values.yaml file with correct values", async () => {
        const valuesPath = path.resolve(__dirname, 'dist/static-test-chart/values.yaml');

        // Read the values.yaml file
        const valuesContent = await fs.readFile(valuesPath, 'utf8');

        // Check if the file contains expected values
        expect(valuesContent).toContain('image: ghcr.io/defenseunicorns/pepr/controller:v1.0.0');
        expect(valuesContent).toContain('pepr.dev/description');
      });

      it("should deploy the appropriate resources to Kubernetes", async () => {
        // Use K8s client to check for resources deployed in the cluster
        const clusterRole = await live(kind.ClusterRole, { metadata: { name: "test-custom-role" } });
        const deployment = await live(kind.Secret, { metadata: { name: "rbac-test-secret" } });

        expect(clusterRole).toBeDefined();
        expect(deployment).toBeDefined();
      });

      it("should create the appropriate helm chart templates", async () => {
        const templatesPath = path.resolve(__dirname, 'dist/static-test-chart/templates');

        // Check if Helm templates were created
        const files = await fs.readdir(templatesPath);

        // Ensure specific template files were created
        expect(files).toContain('deployment.yaml');
        expect(files).toContain('service.yaml');
        expect(files).toContain('clusterrole.yaml');
      });
    });
  });