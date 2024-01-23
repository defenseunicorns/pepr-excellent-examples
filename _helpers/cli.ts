import 'dotenv/config';
import { program, Option } from 'commander';
import { spawnSync } from 'node:child_process';
import { up, down } from './src/cluster';

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
  .action(async ({suite, passthru}) => {
    passthru = passthru || []
    switch (suite) {
      case 'unit':  testUnit(passthru)      ; break
      case 'e2e':   await testE2e(passthru) ; break
      case 'all':   await testAll(passthru) ; break
    }
  })

await program.parseAsync(process.argv);
const opts = program.opts();

function testUnit(passthru) {
  spawnSync(
    "jest", [ "--testRegex", ".*\.unit\.test\.ts", ...passthru ],
    { stdio: 'inherit' }
  )
}

async function testE2e(passthru) {
  /*
    Because this suite contains tests that create & destroy clusters as part of
    execution AS WELL AS those that expect a stable test cluster to pre-exist
    their execution, this block stages test invocations such that only a single
    test-owned cluster exists at a given time.
  */

  // run tests that create & destroy their own clusters
  let result = spawnSync(
    "jest", [ "--testPathPattern", "src/cluster\.e2e\.test\.ts", ...passthru ],
    { stdio: 'inherit' }
  )
  if (result.status !== 0) { throw result }
  
  // long-lived test cluster
  const cluster = "pexex-helpers-e2e"
  try {
    await down(cluster)
    const kubeConfig = await up(cluster)

    // run tests that require a pre-existing cluster (and/or don't care)
    let result = spawnSync(
      "jest", [
        "--testPathIgnorePatterns", "src/cluster\.e2e\.test\.ts",
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
