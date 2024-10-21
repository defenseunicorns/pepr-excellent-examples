import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { mins } from "helpers/src/time";
import { moduleUp, moduleDown } from "helpers/src/pepr";
import { clean } from "helpers/src/cluster";
import { live } from "helpers/src/resource";
import fs from "fs/promises";
import path from "path";
import yaml from "js-yaml";

const apply = async res => {
  return await fullCreate(res, kind);
};

const trc = new TestRunCfg(__filename);

describe("customRBAC.ts", () => {
  beforeAll(async () => await moduleUp(), mins(2));

  afterAll(async () => await moduleDown(), mins(2));

  describe("creates custom rbac rules:", () => {
    it("should create the values.yaml file with correct RBAC values", async () => {
      const valuesPath = path.resolve(
        __dirname,
        "../dist/e43ef33d-2b25-4148-9dca-6ebe588caace-chart/values.yaml",
      );

      // Read the values.yaml file and parse it as a YAML object
      const valuesContent = await fs.readFile(valuesPath, "utf8");
      const valuesYaml = yaml.load(valuesContent) as { rbac: typeof expectedRbac };

      // Adjusted expected RBAC structure to match the actual order
      const expectedRbac = {
        clusterRoles: [
          {
            rules: [
              {
                apiGroups: ["*"],
                resources: ["*"],
                verbs: [
                  "create",
                  "delete",
                  "get",
                  "list",
                  "patch",
                  "update",
                  "watch",
                ],
              },
              {
                apiGroups: [""],
                resources: ["nodes"],
                verbs: ["get", "list"],
              },
            ],
          },
        ],
        roles: [
          {
            rules: [
              {
                apiGroups: ["pepr.dev"],
                resources: ["peprstores"],
                resourceNames: [""],
                verbs: ["create", "get", "patch", "watch"],
              },
              {
                apiGroups: [""],
                resources: ["pods"],
                verbs: ["get", "list", "watch"],
              },
              {
                apiGroups: ["apps"],
                resources: ["deployments"],
                verbs: ["create", "update", "patch"],
              },
            ],
          },
        ],
      };

      // Check if the rbac section in values.yaml matches the expected RBAC structure
      expect(valuesYaml.rbac).toEqual(expectedRbac);

      // Check if the file contains expected values
      expect(valuesContent).toContain(
        "pepr.dev/description: 'Pepr feature: Custom RBAC Features'",
      );
    });


    it("should contain the correct Role for pepr-store in values.yaml", async () => {
      const valuesPath = path.resolve(
        __dirname,
        "../dist/pepr-module-e43ef33d-2b25-4148-9dca-6ebe588caace.yaml",
      );

      // Read the values.yaml file
      const valuesContent = await fs.readFile(valuesPath, "utf8");

      // Expected Role structure
      const expectedRole = {
        apiVersion: "rbac.authorization.k8s.io/v1",
        kind: "Role",
        metadata: {
          name: "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace-store",
          namespace: "pepr-system",
        },
        rules: [
          {
            apiGroups: ["pepr.dev"],
            resources: ["peprstores"],
            resourceNames: [""],
            verbs: ["create", "get", "patch", "watch"],
          },
          {
            apiGroups: [""],
            resources: ["pods"],
            verbs: ["get", "list", "watch"],
          },
          {
            apiGroups: ["apps"],
            resources: ["deployments"],
            verbs: ["create", "update", "patch"],
          },
        ],
      };

      // Convert the expectedRole object to YAML string
      const expectedRoleYaml = yaml.dump(expectedRole);

      // Check if the values.yaml contains the expected role YAML string
      expect(valuesContent).toContain(expectedRoleYaml);
    });

    it("should contain the correct ClusterRole for pepr-store in values.yaml", async () => {
      const valuesPath = path.resolve(
        __dirname,
        "../dist/pepr-module-e43ef33d-2b25-4148-9dca-6ebe588caace.yaml",
      );

      // Read the values.yaml file
      const valuesContent = await fs.readFile(valuesPath, "utf8");

      // Expected Cluster Role structure
      const expectedClusterRole = {
        apiVersion: "rbac.authorization.k8s.io/v1",
        kind: "ClusterRole",
        metadata: {
          name: "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace",
        },
        rules: [
          {
            apiGroups: ["*"],
            resources: ["*"],
            verbs: [
              "create",
              "delete",
              "get",
              "list",
              "patch",
              "update",
              "watch",
            ],
          },
          {
            apiGroups: [""],
            resources: ["nodes"],
            verbs: ["get", "list"],
          },
        ],
      };

      // Convert the expectedClusterRole object to YAML string
      const expectedClusterRoleYaml = yaml.dump(expectedClusterRole);

      // Check if the values.yaml contains the expected role YAML string
      expect(valuesContent).toContain(expectedClusterRoleYaml);
    });

    it("should deploy the appropriate resources to Kubernetes", async () => {
      // Use K8s client to check for resources deployed in the cluster
      const clusterRole = await live(kind.ClusterRole, {
        metadata: { name: "test-custom-role" },
      });
      const deployment = await live(kind.Secret, {
        metadata: { name: "rbac-test-secret" },
      });

      expect(clusterRole).toBeDefined();
      expect(deployment).toBeDefined();
    });
  });

  it("should merge generated and custom RBAC rules correctly", async () => {
    const valuesPath = path.resolve(
      __dirname,
      "../dist/e43ef33d-2b25-4148-9dca-6ebe588caace-chart/values.yaml",
    );

    const valuesContent = await fs.readFile(valuesPath, "utf8");
    const valuesYaml = yaml.load(valuesContent) as { rbac };

    // Check for merged rules, ensuring no duplicate verbs
    const expectedMergedClusterRoleRules = [
      {
        apiGroups: ["*"],
        resources: ["*"],
        verbs: ["create", "delete", "get", "list", "patch", "update", "watch"],
      },
      {
        apiGroups: [""],
        resources: ["nodes"],
        verbs: ["get", "list"],
      },
    ];

    expect(valuesYaml.rbac.clusterRoles[0].rules).toEqual(expectedMergedClusterRoleRules);
  });
});
