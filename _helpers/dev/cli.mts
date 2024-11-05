import "dotenv/config";
import { program, Option } from "commander";
import { resolve, basename } from "node:path";
import { chdir } from "node:process";
import { execSync, spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { differ } from "../src/deps/differ";
import { writer } from "../src/deps/writer";
import { up, down } from "../src/cluster";
import { Cmd } from "../src/Cmd";
import { findUpSync } from "find-up";
import { getPeprAlias } from "../src/pepr";
import { copyFileSync, mkdirSync, renameSync, rmSync } from "fs";
import { rmdirSync } from "node:fs";
import assert from "node:assert";

const peprExcellentExamplesRepo = findUpSync("pepr-excellent-examples", { type: "directory" });
if (!peprExcellentExamplesRepo) {
  throw new Error('Could not find parent "pepr-excellent-examples" directory');
}

program
  .name("cli")
  .version("0.0.0", "-v, --version")
  .addOption(new Option("-m, --module <dir>", "module path to run CLI within"))
  .hook("preAction", cli => {
    const opts = cli.opts();

    // change directory if run from outside helpers module
    if (opts.module) {
      chdir(opts.module);
      process.env.PWD = opts.module;
    }
  });

program
  .command("env")
  .description("dump env")
  .action(async () => {
    
    function sanitizeEnv(env: NodeJS.ProcessEnv) {
      const sensitiveKeys = ["API_KEY", "KEY", "PRIVATE", "PASSWORD", "SECRET", "TOKEN"];
      const sanitizedEnv = { ...env };
      for (const key in sanitizedEnv) {
        if (sensitiveKeys.some(sensitiveKey => key.includes(sensitiveKey))) {
          sanitizedEnv[key] = "**[REDACTED]**"
        }
      }
      return sanitizedEnv;
    }

    console.log(sanitizeEnv(process.env));
  });

program
  .command("deps")
  .description("sync module devDependencies with external package.json")
  .argument("<path>", "path to package.json to sync deps against")
  .addOption(new Option("-w, --write", "write changes to disk").default(false))
  .action(async (path, opts) => {
    const updates = await differ(path);
    opts.write ? await writer(updates) : console.log(updates);
  });

program
  .command("test")
  .description("run tests")
  .addOption(
    new Option("-s, --suite <suite>", "suite type").choices(["unit", "e2e", "all"]).default("all"),
  )
  .addOption(
    new Option(
      "-l, --local-package",
      "build & test the pepr cli package from a local copy of the pepr repo",
    ).conflicts("customPackage"),
  )
  .addOption(
    new Option(
      "-c, --custom-package <package>",
      "test a specified pepr cli .tgz package",
    ).conflicts("localPackage"),
  )
  .requiredOption("-i, --image <image>", "pepr controller image under test", "pepr:dev")
  .addOption(
    new Option(
      "-p, --passthru [passthru...]",
      "args to pass to test runner (e.g. --passthru='--testNamePattern=\"testName()\"')",
    ),
  )
  .hook("preAction", thisCommand => {
    // don't need to config pepr module/image overrides for unit testing
    if (thisCommand.opts().suite === "unit") {
      return;
    }

    if (thisCommand.opts().customPackage) {
      process.env.PEPR_PACKAGE = `${resolve(peprExcellentExamplesRepo, thisCommand.opts().customPackage)}`;
      validateCustomPackage(peprExcellentExamplesRepo);
    } else if (thisCommand.opts().localPackage) {
      process.env.PEPR_PACKAGE = buildLocalPepr(peprExcellentExamplesRepo);
    }
    process.env.PEPR_IMAGE = thisCommand.opts().image;

    try {
      backupPackageJSON();

      execSync("npm install", { cwd: peprExcellentExamplesRepo });
    } catch (err) {
      throw new Error(
        `Failed to run npm install in ${peprExcellentExamplesRepo}. Check package.json and package-lock.json. Error: ${err.message}`,
      );
    }

    printTestInfo();
  })
  .action(async ({ suite, passthru }) => {
    try {
      passthru = passthru || [];
      switch (suite) {
        case "unit":
          testUnit(passthru);
          break;
        case "e2e":
          await testE2e(passthru);
          break;
        case "all":
          await testAll(passthru);
          break;
      }
    } finally {
      restorePackageJSON();
    }
  });

const dpr = program.command("dpr").description("utilities for dash-policyreport module");

dpr
  .command("gen")
  .description("generate policyReport types from github crds")
  .action(async () => {
    await generateTypes();
  });

await program.parseAsync(process.argv);
program.opts();

function printTestInfo() {
  if (process.env.PEPR_PACKAGE) {
    console.log(
      `Pepr Build under test: ${execSync(`shasum ${process.env.PEPR_PACKAGE}`).toString()}`,
    );
  } else {
    const peprVersion = execSync(`npx --yes ${getPeprAlias()} --version`).toString();
    console.log(`Pepr Version under test: ${peprVersion}`);
  }
  console.log(
    `Pepr Image under test: ${execSync(`docker inspect --format="{{.Id}} {{.RepoTags}}" ${process.env.PEPR_IMAGE}`).toString()}`,
  );
}

function buildLocalPepr(outputDirectory: string) {
  const peprRepoLocation = findUpSync("pepr", { type: "directory" });
  if (!peprRepoLocation) {
    throw new Error('Could not find "pepr" repository. Unable to generate a local build.');
  }
  const peprBuild = "pepr-0.0.0-development.tgz";
  const suppressOutput = process.env.DEBUG ? "" : " > /dev/null 2>&1";
  execSync(`npm run build ${suppressOutput}`, { cwd: peprRepoLocation });
  copyFileSync(`${peprRepoLocation}/${peprBuild}`, `${outputDirectory}/${peprBuild}`);
  return `${outputDirectory}/${peprBuild}`;
}

function restorePackageJSON() {
  if (basename(process.cwd()) !== "_helpers" && getPeprAlias() !== "pepr") {
    renameSync(
      `${peprExcellentExamplesRepo}/package-lock.json.bak`,
      `${peprExcellentExamplesRepo}/package-lock.json`,
    );
    renameSync(
      `${peprExcellentExamplesRepo}/package.json.bak`,
      `${peprExcellentExamplesRepo}/package.json`,
    );
    renameSync(`${process.cwd()}/package.json.bak`, `${process.cwd()}/package.json`);
  }
}

function backupPackageJSON() {
  if (basename(process.cwd()) !== "_helpers" && getPeprAlias() !== "pepr") {
    copyFileSync(
      `${peprExcellentExamplesRepo}/package-lock.json`,
      `${peprExcellentExamplesRepo}/package-lock.json.bak`,
    );
    copyFileSync(
      `${peprExcellentExamplesRepo}/package.json`,
      `${peprExcellentExamplesRepo}/package.json.bak`,
    );
    copyFileSync(`${process.cwd()}/package.json`, `${process.cwd()}/package.json.bak`);
    execSync(`npm i ${getPeprAlias()}`);
    rmSync(`${peprExcellentExamplesRepo}/package-lock.json`);
  }
}

function validateCustomPackage(parentDir: string) {
  try {
    mkdirSync(`${parentDir}/custom-package`, { recursive: true });
    execSync(`tar -xzf ${process.env.PEPR_PACKAGE} -C custom-package`, {
      cwd: parentDir,
    }).toString();
    const npmInfo = execSync(`npm view --json custom-package/package/`, {
      cwd: parentDir,
    }).toString();
    assert(npmInfo.includes('"name": "pepr"'));
    assert(npmInfo.includes('"pepr": "dist/cli.js"'));
  } catch (error) {
    throw new Error(
      `Custom-Package (${process.env.PEPR_PACKAGE}) does not appear to be a pepr package, exiting.`,
    );
  } finally {
    rmdirSync(`${parentDir}/custom-package`, { recursive: true });
  }
}

function testUnit(passthru) {
  spawnSync(
    // eslint-disable-next-line no-useless-escape
    "jest",
    ["--passWithNoTests", "--testPathPattern", ".*.unit.test.ts", "--verbose", ...passthru],
    { stdio: "inherit" },
  );
}

async function testE2e(passthru) {
  // k3d has a 32-char cluster name length limit
  const limit = 32;
  const template = "pexex-GenericClusterName-e2e";
  let unique = basename(process.env.PWD).substring(0, limit - (template.length - 1));
  unique = unique.replace("_", "-");
  const cluster = template.replace("GenericClusterName", unique);

  /*
    Because the _helpers suite contains tests that create & destroy clusters (as
    part of execution) AS WELL AS those that expect a stable test cluster to
    pre-exist their execution, this block stages test invocations such that only
    a single test-owned cluster will exist at a given time.
  */
  if (process.env.INIT_CWD === process.env.PWD) {
    // run tests that create & destroy their own clusters
    const result = spawnSync(
      "jest",
      [
        "--passWithNoTests",
        "--testPathPattern",
        "src/cluster.e2e.test.ts",
        "--detectOpenHandles",
        "--verbose",
        ...passthru,
      ],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw result;
    }

    // long-lived test cluster
    try {
      await down(cluster);
      const kubeConfig = await up(cluster);

      // run tests that require a pre-existing cluster (and/or don't care)
      const result = spawnSync(
        "jest",
        [
          "--passWithNoTests",
          "--testPathIgnorePatterns",
          "src/cluster.e2e.test.ts",
          "--testPathPattern",
          ".*.e2e.test.ts",
          "--detectOpenHandles",
          "--verbose",
          ...passthru,
        ],
        {
          stdio: "inherit",
          env: { ...process.env, KUBECONFIG: kubeConfig },
        },
      );
      if (result.status !== 0) {
        throw result;
      }
    } finally {
      await down(cluster);
    }
  } else {
    try {
      await down(cluster);
      const kubeConfig = await up(cluster);

      // run tests that require a pre-existing cluster (and/or don't care)
      const result = spawnSync(
        "jest",
        [
          "--passWithNoTests",
          // eslint-disable-next-line no-useless-escape
          "--testPathPattern",
          ".*.e2e.test.ts",
          "--detectOpenHandles",
          "--verbose",
          ...passthru,
        ],
        {
          stdio: "inherit",
          env: { ...process.env, KUBECONFIG: kubeConfig },
        },
      );
      if (result.status !== 0) {
        throw result;
      }
    } finally {
      await down(cluster);
    }
  }
}

async function testAll(passthru) {
  testUnit(passthru);
  await testE2e(passthru);
}

async function generateTypes() {
  // create output dir
  const typesDir = resolve(process.env.PWD, "types");
  await mkdir(typesDir, { recursive: true });

  const remoteYamls = [
    "https://raw.githubusercontent.com/kubernetes-sigs/wg-policy-prototypes/master/policy-report/crd/v1beta1/wgpolicyk8s.io_clusterpolicyreports.yaml",
    "https://raw.githubusercontent.com/kubernetes-sigs/wg-policy-prototypes/master/policy-report/crd/v1beta1/wgpolicyk8s.io_policyreports.yaml",
  ];
  for (const remoteYaml of remoteYamls) {
    const localYaml = resolve(typesDir, basename(remoteYaml));

    // save remote manifest
    const content = await fetch(remoteYaml).then(resp => resp.text());
    await writeFile(localYaml, content);

    // generate CRD types from manifest
    await new Cmd({ cmd: `npm run kfc -- crd ${remoteYaml} ${typesDir}` }).run();
  }

  // ignore eslint 'no explicit any' checks on gen'd CRDs
  const types = (await readdir(typesDir)).filter(m => m.endsWith(".ts"));
  for (const t of types) {
    const typePath = resolve(typesDir, t);
    const content = [
      `/* eslint-disable @typescript-eslint/no-explicit-any */`,
      (await readFile(typePath)).toString(),
    ].join("\n");
    await writeFile(typePath, content);
  }

  // prevent TS ts(2612) in gen'd files (by adding 'declare' modifier)
  //  ( but maybe this should be a patch to the KFC gen function? )
  for (const t of types) {
    const typePath = resolve(typesDir, t);
    let ts = (await readFile(typePath)).toString();
    ts = ts.replace("apiVersion?:", "declare apiVersion?:");
    ts = ts.replace("kind?:", "declare kind?:");
    ts = ts.replace("metadata?:", "declare metadata?:");
    await writeFile(typePath, ts);
  }
}
