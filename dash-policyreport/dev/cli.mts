/* eslint-disable @typescript-eslint/no-unused-vars */

import 'dotenv/config';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { program, Option } from 'commander';
import { spawnSync } from 'node:child_process';
import { up, down } from 'helpers/src/cluster';
import { Cmd } from 'helpers/src/Cmd';

program.name('cli')
  .version('0.0.0', '-v, --version')

const env = program.command('env')
  .description('dump env')
  .action(() => { console.log(process.env) })

  const test = program.command('test')
  .description('run tests')
  .addOption(
    new Option('-s, --suite <suite>', 'suite type')
    .choices(['unit', 'e2e', 'all'])
    .default('all')
    )
    .addOption(
      new Option(
        '-p, --passthru [passthru...]',
        'args to pass to test runner (e.g. --passthru="--testPathPattern=general.test.unit.ts")'
        )
        )
        .action(async ({ suite, passthru }) => {
          passthru = passthru || []
    switch (suite) {
      case 'unit': testUnit(passthru); break
      case 'e2e': await testE2e(passthru); break
      case 'all': await testAll(passthru); break
    }
  })
  
  const generate = program.command('regen').description('generate policyReport types from github crd')
  .action(async () => {
    await generateType()
  })

await program.parseAsync(process.argv);
const opts = program.opts();

async function generateType() {
  const crdFileUrl = "https://github.com/kubernetes-sigs/wg-policy-prototypes/raw/master/policy-report/crd/v1alpha2/wgpolicyk8s.io_policyreports.yaml"
  const crdFilePath = resolve("./types", "policyreport-crd.yaml")

  // save remote manifest
  const dir = dirname(crdFilePath)
  await mkdir(dir, { recursive: true })
  const response = await fetch(crdFileUrl)
  const body = await response.text()
  await writeFile(crdFilePath, body)

  // generate CRD types from manifest
  const getCRDsCmd = await new Cmd({ cmd: `npm run _kfc -- crd ${crdFileUrl} ${dir}` }).run()
  if (getCRDsCmd.exitcode > 0) { throw getCRDsCmd }

  // exclude eslint check of CRD types
  const crds = ( await readdir(dir) ).filter(m => m.endsWith('.ts'))
  for (const crd of crds ) {
    const path = join(dir, crd)
    const content = [
      `/* eslint-disable @typescript-eslint/no-explicit-any */`,
      ( await readFile( path ) ).toString()
    ].join("\n")
    await writeFile(path, content)
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
  }
}

async function testAll(passthru) {
  testUnit(passthru)
  await testE2e(passthru)
}
