import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { kind } from "kubernetes-fluent-client";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import { fullCreate } from "helpers/src/general";
import { mins } from "helpers/src/time";
import { moduleUp, moduleDown } from "helpers/src/pepr";
import fs from "fs/promises";
import { copyFile } from "fs/promises";
import path from "path";
import yaml from "js-yaml";
import { execSync } from "child_process";

const _apply = async res => {
  return await fullCreate(res, kind);
};

const _trc = new TestRunCfg(__filename);

async function usePackageJson(type: "default" | "custom") {
  const srcPath = path.resolve(__dirname, `../package.${type}.json`);
  const destPath = path.resolve(__dirname, "../package.json");

  // Asynchronously copy the specified package.json to the main package.json
  await copyFile(srcPath, destPath);
}

describe("rbac generation with rbacMode=admin", () => {
  const version = "";
  const verbose = false;
  const rbacMode = "admin";
  beforeEach(
    async () => await moduleUp(3, { version, verbose, rbacMode }),
    mins(2),
  );

  afterEach(async () => await moduleDown(), mins(2));

  it("should create the yaml files with admin rbacMode and no custom rules", async () => {
    await usePackageJson("default");
    execSync(`npx pepr build`);

    const valuesPath = path.resolve(
      __dirname,
      "../dist/e43ef33d-2b25-4148-9dca-6ebe588caace-chart/values.yaml",
    );

    const valuesContent = await fs.readFile(valuesPath, "utf8");
    const valuesYaml = yaml.load(valuesContent) as {
      rbac: typeof expectedRbac;
    };

    const expectedRbac = [
      {
        apiGroups: ["*"],
        resources: ["*"],
        verbs: ["create", "delete", "get", "list", "patch", "update", "watch"],
      },
    ];

    expect(valuesYaml.rbac).toEqual(expectedRbac);

    const staticYamlPath = path.resolve(
      __dirname,
      "../dist/pepr-module-e43ef33d-2b25-4148-9dca-6ebe588caace.yaml",
    );

    const staticYamlContent = await fs.readFile(staticYamlPath, "utf8");
    const staticYamlDocs = yaml.loadAll(staticYamlContent) as Record<
      string,
      any
    >[];

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
      ],
    };

    const actualClusterRole = staticYamlDocs.find(
      (doc: Record<string, any>) =>
        doc.kind === "ClusterRole" &&
        doc.metadata?.name === "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace",
    );

    // Check if the static yaml file matches the expected RBAC structure
    expect(actualClusterRole).toEqual(expectedClusterRole);
  }, 30000);

  it("should create the yaml files with admin rbacMode and custom rules", async () => {
    await usePackageJson("custom");
    execSync(`npx pepr build`);

    const valuesPath = path.resolve(
      __dirname,
      "../dist/e43ef33d-2b25-4148-9dca-6ebe588caace-chart/values.yaml",
    );

    const valuesContent = await fs.readFile(valuesPath, "utf8");
    const valuesYaml = yaml.load(valuesContent) as {
      rbac: typeof expectedRbac;
    };

    const expectedRbac = [
      {
        apiGroups: ["*"],
        resources: ["*"],
        verbs: ["create", "delete", "get", "list", "patch", "update", "watch"],
      },
    ];

    expect(valuesYaml.rbac).toEqual(expectedRbac);

    const staticYamlPath = path.resolve(
      __dirname,
      "../dist/pepr-module-e43ef33d-2b25-4148-9dca-6ebe588caace.yaml",
    );

    const staticYamlContent = await fs.readFile(staticYamlPath, "utf8");
    const staticYamlDocs = yaml.loadAll(staticYamlContent) as Record<
      string,
      any
    >[];

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
      ],
    };

    const actualClusterRole = staticYamlDocs.find(
      (doc: Record<string, any>) =>
        doc.kind === "ClusterRole" &&
        doc.metadata?.name === "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace",
    );

    // Check if the static yaml file matches the expected RBAC structure
    expect(actualClusterRole).toEqual(expectedClusterRole);
  }, 30000);
});

describe("rbac generation with rbacMode=scoped", () => {
  const version = "";
  const verbose = false;
  const rbacMode = "scoped";

  beforeEach(
    async () => await moduleUp(3, { version, verbose, rbacMode }),
    mins(2),
  );

  afterEach(async () => await moduleDown(), mins(2));

  it("should create the yaml files with scoped rbacMode and no custom rules", async () => {
    await usePackageJson("default");
    execSync(`npx pepr build --rbac-mode=scoped`);

    const valuesPath = path.resolve(
      __dirname,
      "../dist/e43ef33d-2b25-4148-9dca-6ebe588caace-chart/values.yaml",
    );

    const valuesContent = await fs.readFile(valuesPath, "utf8");
    const valuesYaml = yaml.load(valuesContent) as {
      rbac: typeof expectedRbac;
    };

    const expectedRbac = [
      {
        apiGroups: ["pepr.dev"],
        resources: ["peprstores"],
        verbs: ["create", "get", "patch", "watch"],
      },
      {
        apiGroups: ["apiextensions.k8s.io"],
        resources: ["customresourcedefinitions"],
        verbs: ["patch", "create"],
      },
      {
        apiGroups: [""],
        resources: ["namespaces"],
        verbs: ["watch"],
      },
      {
        apiGroups: [""],
        resources: ["configmaps"],
        verbs: ["watch"],
      },
    ];

    expect(valuesYaml.rbac).toEqual(expectedRbac);

    const staticYamlPath = path.resolve(
      __dirname,
      "../dist/pepr-module-e43ef33d-2b25-4148-9dca-6ebe588caace.yaml",
    );

    const staticYamlContent = await fs.readFile(staticYamlPath, "utf8");
    const staticYamlDocs = yaml.loadAll(staticYamlContent) as Record<
      string,
      any
    >[];

    const expectedClusterRole = {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRole",
      metadata: {
        name: "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace",
      },
      rules: [
        {
          apiGroups: ["pepr.dev"],
          resources: ["peprstores"],
          verbs: ["create", "get", "patch", "watch"],
        },
        {
          apiGroups: ["apiextensions.k8s.io"],
          resources: ["customresourcedefinitions"],
          verbs: ["patch", "create"],
        },
        {
          apiGroups: [""],
          resources: ["namespaces"],
          verbs: ["watch"],
        },
        {
          apiGroups: [""],
          resources: ["configmaps"],
          verbs: ["watch"],
        },
      ],
    };

    const actualClusterRole = staticYamlDocs.find(
      (doc: Record<string, any>) =>
        doc.kind === "ClusterRole" &&
        doc.metadata?.name === "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace",
    );

    // Check if the static yaml file matches the expected RBAC structure
    expect(actualClusterRole).toEqual(expectedClusterRole);
  }, 20000);

  it("should create the yaml files with scoped rbacMode and custom rules", async () => {
    await usePackageJson("custom");
    execSync(`npx pepr build --rbac-mode=scoped`);

    const valuesPath = path.resolve(
      __dirname,
      "../dist/e43ef33d-2b25-4148-9dca-6ebe588caace-chart/values.yaml",
    );

    const valuesContent = await fs.readFile(valuesPath, "utf8");
    const valuesYaml = yaml.load(valuesContent) as {
      rbac: typeof expectedRbac;
    };

    const expectedRbac = [
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
      {
        apiGroups: ["pepr.dev"],
        resources: ["peprstores"],
        verbs: ["create", "get", "patch", "watch"],
      },
      {
        apiGroups: ["apiextensions.k8s.io"],
        resources: ["customresourcedefinitions"],
        verbs: ["patch", "create"],
      },
      {
        apiGroups: [""],
        resources: ["namespaces"],
        verbs: ["watch"],
      },
      {
        apiGroups: [""],
        resources: ["configmaps"],
        verbs: ["watch"],
      },
    ];

    expect(valuesYaml.rbac).toEqual(expectedRbac);

    const staticYamlPath = path.resolve(
      __dirname,
      "../dist/pepr-module-e43ef33d-2b25-4148-9dca-6ebe588caace.yaml",
    );

    const staticYamlContent = await fs.readFile(staticYamlPath, "utf8");
    const staticYamlDocs = yaml.loadAll(staticYamlContent) as Record<
      string,
      any
    >[];

    const expectedClusterRole = {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRole",
      metadata: {
        name: "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace",
      },
      rules: [
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
        {
          apiGroups: ["pepr.dev"],
          resources: ["peprstores"],
          verbs: ["create", "get", "patch", "watch"],
        },
        {
          apiGroups: ["apiextensions.k8s.io"],
          resources: ["customresourcedefinitions"],
          verbs: ["patch", "create"],
        },
        {
          apiGroups: [""],
          resources: ["namespaces"],
          verbs: ["watch"],
        },
        {
          apiGroups: [""],
          resources: ["configmaps"],
          verbs: ["watch"],
        },
      ],
    };

    const actualClusterRole = staticYamlDocs.find(
      (doc: Record<string, any>) =>
        doc.kind === "ClusterRole" &&
        doc.metadata?.name === "pepr-e43ef33d-2b25-4148-9dca-6ebe588caace",
    );

    // Check if the static yaml file matches the expected RBAC structure
    expect(actualClusterRole).toEqual(expectedClusterRole);
  }, 20000);
});
