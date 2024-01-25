import 'dotenv/config';
import { program, Option } from 'commander';
import { spawnSync } from 'node:child_process';
import { up, down } from 'helpers/src/cluster';

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
  const cluster = "pexex-dash-policyreport-e2e"
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
