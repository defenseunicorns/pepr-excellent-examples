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

await program.parseAsync(process.argv);
const opts = program.opts();


function testUnit(passthru) {
  console.log("-----> oi")
  spawnSync(
    // eslint-disable-next-line no-useless-escape
    "jest", ["--testPathPattern", ".*\.unit\.test\.ts", ...passthru],
    { stdio: 'inherit' }
  )
}

async function testE2e(passthru) {
  const cluster = "pexex-hello-pepr-validate-e2e"
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