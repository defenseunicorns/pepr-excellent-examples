/* eslint-disable @typescript-eslint/no-unused-vars */

import 'dotenv/config';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { program, Option } from 'commander';
import { fileURLToPath } from 'url';
import { up, down } from 'helpers/src/cluster';
import { Cmd } from 'helpers/src/Cmd';
import { unlock } from 'helpers/src/general';
import { TestRunCfg } from 'helpers/src/TestRunCfg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

program.name('cli')
  .version('0.0.0', '-v, --version')

const env = program.command('env')
  .description('dump env')
  .action(() => { console.log(process.env) })

const test = program.command('test')
  .description('run tests')
  .addOption(new Option('-s, --suite <suite>', 'suite type').choices(['unit', 'e2e', 'all']).default('all'))
  .addOption(new Option('-p, --passthru [passthru...]',
    'args to pass to test runner (e.g. --passthru="--testPathPattern=general.test.unit.ts")'
  ))
  .action(async ({ suite, passthru }) => {
    passthru = passthru || []
    switch (suite) {
      case 'unit': testUnit(passthru); break
      case 'e2e': await testE2e(passthru); break
      case 'all': await testAll(passthru); break
    }
  })
  
const generate = program.command('gen').description('generate policyReport types from github crds')
  .action(async () => {
    await generateTypes()
  })

await program.parseAsync(process.argv);
const opts = program.opts();

async function generateTypes() {
  // create output dir
  const typesDir = resolve(__dirname, '..', 'types')
  await mkdir(typesDir, { recursive: true })

  const remoteYamls = [
    "https://raw.githubusercontent.com/kubernetes-sigs/wg-policy-prototypes/master/policy-report/crd/v1alpha2/wgpolicyk8s.io_clusterpolicyreports.yaml",
    "https://raw.githubusercontent.com/kubernetes-sigs/wg-policy-prototypes/master/policy-report/crd/v1alpha2/wgpolicyk8s.io_policyreports.yaml"
  ]
  for (const remoteYaml of remoteYamls) {
    const localYaml = resolve(typesDir, basename(remoteYaml))
  
    // save remote manifest
    const content = await fetch(remoteYaml).then(resp => resp.text())
    await writeFile(localYaml, content)
  
    // generate CRD types from manifest
    const genTypes = await new Cmd({ cmd: `npm run _kfc -- crd ${remoteYaml} ${typesDir}` }).run()
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

function testUnit(passthru) {
  spawnSync(
    // eslint-disable-next-line no-useless-escape
    "jest", ["--testPathPattern", ".*\.unit\.test\.ts", ...passthru],
    { stdio: 'inherit' }
  )
}

async function testE2e(passthru) {
  const cluster = "pexex-dash-policyreport-e2e"
  try {
    await down(cluster)
    await unlock(new TestRunCfg(__filename))

    const kubeConfig = await up(cluster)

    // run tests that require a pre-existing cluster (and/or don't care)
    const result = spawnSync(
      "jest", [
        // eslint-disable-next-line no-useless-escape
        "--testPathPattern", ".*\.e2e\.test\.ts",
        ...passthru
      ],
      {
        stdio: 'inherit',
        env: { ...process.env, KUBECONFIG: kubeConfig }
      }
    )
    if (result.status !== 0) { throw result }

  } finally {
    await down(cluster)
    await unlock(new TestRunCfg(__filename))
  }
}

async function testAll(passthru) {
  testUnit(passthru)
  await testE2e(passthru)
}
