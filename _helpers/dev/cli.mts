import 'dotenv/config';
import { program, Option } from 'commander';
import path, { resolve, basename } from 'node:path';
import { chdir } from 'node:process';
import { execSync, spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { up, down } from '../src/cluster';
import { Cmd } from '../src/Cmd';
import { findUpSync } from 'find-up'
import {getPeprAlias} from '../src/pepr'

program.name('cli')
  .version('0.0.0', '-v, --version')
  .addOption(new Option('-m, --module <dir>', 'module path to run CLI within'))
  .hook('preAction', (cli) => {
    const opts = cli.opts()

    // change directory if run from outside helpers module
    if (opts.module) {
      chdir(opts.module)
      process.env.PWD = opts.module
    }
  })

const env = program.command('env')
  .description('dump env')
  .action(async () => { console.log(process.env) })

const test = program.command('test')
  .description('run tests')
  .addOption(
    new Option('-s, --suite <suite>', 'suite type')
      .choices(['unit', 'e2e', 'all'])
      .default('all')
  )
  .addOption(
      new Option(
      "-lp, --local-package",
      "build & test the pepr cli package from a local copy of the pepr repo",
      ).conflicts('customPackage')
  )
  .addOption(
    new Option(
      "-cp, --custom-package <package>",
      "test a specified pepr cli .tgz package",
    ).conflicts('localPackage')
  )
  .option(
      "-i, --image <image>",
      "pepr controller image under test",
      "pepr:dev", // TODO: Is this really required all the time?
  )
  .addOption(
    new Option(
      '-p, --passthru [passthru...]',
      'args to pass to test runner (e.g. --passthru=\'--testNamePattern="testName()"\')'
    )
  )
  .hook('preAction', (thisCommand) =>{
    const peprExcellentExamplesRepo = findUpSync('pepr-excellent-examples', {type: 'directory'})
    const buildLocalPepr = (parentDirectory: string) => {
      const peprRepoLocation = findUpSync('pepr', { type: 'directory' });
      const peprBuild = 'pepr-0.0.0-development.tgz';
      execSync('npm run build > /dev/null 2>&1', { cwd: peprRepoLocation });
      execSync(`cp ${peprRepoLocation}/${peprBuild} ${parentDirectory}`);
      return `${parentDirectory}/${peprBuild}`;
    }

    execSync('npm install', {cwd: peprExcellentExamplesRepo})

    if(thisCommand.opts().customPackage){
      process.env.PEPR_PACKAGE = `${path.resolve(peprExcellentExamplesRepo, thisCommand.opts().customPackage)}`
    }
    if(thisCommand.opts().localPackage){
      process.env.PEPR_PACKAGE = buildLocalPepr(peprExcellentExamplesRepo)
    }
    process.env.PEPR_PACKAGE ?
      console.log(`Pepr Build under test: ${execSync(`shasum ${process.env.PEPR_PACKAGE}`).toString()}`) : 
      console.log(`Pepr Version under test: ${execSync(`npx --yes ${getPeprAlias()} --version`).toString()}`);
    console.log(`Pepr Image under test: ${execSync(`docker inspect --format=\'{{.Id}} {{.RepoTags}}\' ${thisCommand.opts().image ?? 'pepr:dev'}`).toString()}`)
  })
  .action(async ({suite, passthru, image}) => {
    if (image) { process.env.PEPR_IMAGE = image }
    passthru = passthru || []
    switch (suite) {
      case 'unit':  testUnit(passthru)      ; break
      case 'e2e':   await testE2e(passthru) ; break
      case 'all':   await testAll(passthru) ; break
    }
  })

const dpr = program.command('dpr')
  .description('utilities for dash-policyreport module')

const gen = dpr.command('gen')
  .description('generate policyReport types from github crds')
  .action(async () => {
    await generateTypes()
  })

await program.parseAsync(process.argv);
const opts = program.opts();

function testUnit(passthru) {
  spawnSync(
    // eslint-disable-next-line no-useless-escape
    "jest", [
      "--passWithNoTests",
      "--testPathPattern", ".*\.unit\.test\.ts",
      "--verbose",
      ...passthru
    ],
    { stdio: 'inherit' }
  )
}

async function testE2e(passthru) {
  // k3d has a 32-char cluster name length limit
  const limit = 32
  const template = "pexex-*-e2e"
  let unique = basename(process.env.PWD).substring(0, limit - (template.length - 1))
  unique = unique.replace("_", "-")
  const cluster = template.replace("*", unique)

  /*
    Because the _helpers suite contains tests that create & destroy clusters (as
    part of execution) AS WELL AS those that expect a stable test cluster to
    pre-exist their execution, this block stages test invocations such that only
    a single test-owned cluster will exist at a given time.
  */
  if (process.env.INIT_CWD === process.env.PWD) {
    // run tests that create & destroy their own clusters
    let result = spawnSync(
      "jest", [
        "--passWithNoTests",
        "--testPathPattern", "src/cluster\.e2e\.test\.ts",
        "--runInBand",
        "--verbose",
        ...passthru
      ],
      { stdio: 'inherit' }
    )
    if (result.status !== 0) { throw result }

    // long-lived test cluster
    try {
      await down(cluster)
      const kubeConfig = await up(cluster)
  
      // run tests that require a pre-existing cluster (and/or don't care)
      let result = spawnSync(
        "jest", [
          "--passWithNoTests",
          "--testPathIgnorePatterns", "src/cluster\.e2e\.test\.ts",
          "--testPathPattern", ".*\.e2e\.test\.ts",
          "--runInBand",
          "--verbose",
          ...passthru
        ],
        {
          stdio: 'inherit',
          env: { ...process.env, KUBECONFIG: kubeConfig }
        }
      )
      if (result.status !== 0) { throw result }

    } finally { await down(cluster) }

  } else {
    try {
      await down(cluster)
      const kubeConfig = await up(cluster)

      // run tests that require a pre-existing cluster (and/or don't care)
      const result = spawnSync(
        "jest", [
          "--passWithNoTests",
          // eslint-disable-next-line no-useless-escape
          "--testPathPattern", ".*\.e2e\.test\.ts",
          "--runInBand",
          "--verbose",
          ...passthru
        ],
        {
          stdio: 'inherit',
          env: { ...process.env, KUBECONFIG: kubeConfig }
        }
      )
      if (result.status !== 0) { throw result }

    } finally { await down(cluster) }
  }
}

async function testAll(passthru) {
  testUnit(passthru)
  await testE2e(passthru)
}

async function generateTypes() {
  // create output dir
  const typesDir = resolve(process.env.PWD, 'types')
  await mkdir(typesDir, { recursive: true })

  const remoteYamls = [
    "https://raw.githubusercontent.com/kubernetes-sigs/wg-policy-prototypes/master/policy-report/crd/v1beta1/wgpolicyk8s.io_clusterpolicyreports.yaml",
    "https://raw.githubusercontent.com/kubernetes-sigs/wg-policy-prototypes/master/policy-report/crd/v1beta1/wgpolicyk8s.io_policyreports.yaml"
  ]
  for (const remoteYaml of remoteYamls) {
    const localYaml = resolve(typesDir, basename(remoteYaml))
  
    // save remote manifest
    const content = await fetch(remoteYaml).then(resp => resp.text())
    await writeFile(localYaml, content)
  
    // generate CRD types from manifest
    const genTypes = await new Cmd({ cmd: `npm run kfc -- crd ${remoteYaml} ${typesDir}` }).run()
  }

  // ignore eslint 'no explicit any' checks on gen'd CRDs
  const types = ( await readdir(typesDir) ).filter(m => m.endsWith('.ts'))
  for (const t of types ) {
    const typePath = resolve(typesDir, t)
    const content = [
      `/* eslint-disable @typescript-eslint/no-explicit-any */`,,
      ( await readFile( typePath ) ).toString()
    ].join("\n")
    await writeFile(typePath, content)
  }

  // prevent TS ts(2612) in gen'd files (by adding 'declare' modifier)
  //  ( but maybe this should be a patch to the KFC gen function? )
  for (const t of types ) {
    const typePath = resolve(typesDir, t)
    let ts = ( await readFile( typePath ) ).toString()
    ts = ts.replace("apiVersion?:", "declare apiVersion?:")
    ts = ts.replace("kind?:", "declare kind?:")
    ts = ts.replace("metadata?:", "declare metadata?:")
    await writeFile(typePath, ts)
  }
}
