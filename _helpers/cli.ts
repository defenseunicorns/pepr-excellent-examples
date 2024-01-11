import 'dotenv/config';
import { program, Option } from 'commander';
import { spawnSync } from 'node:child_process';

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
  .action(({suite, passthru}) => {
    passthru = passthru || []
    switch (suite) {
      case 'unit':  testUnit(passthru)  ; break
      case 'e2e':   testE2e(passthru)   ; break
      case 'all':   testAll(passthru)   ; break
    }
  })

program.parse(process.argv);
const opts = program.opts();

function testUnit(passthru) {
  spawnSync(
    "jest", [ "--testMatch", "**/?(*.)+(spec|test).unit.[tj]s?(x)", ...passthru ],
    { stdio: 'inherit' }
  )
}

function testE2e(passthru) {
  spawnSync(
    "jest", [ "--testMatch", "**/?(*.)+(spec|test).e2e.[tj]s?(x)", ...passthru ],
    { stdio: 'inherit' }
  )
}

function testAll(passthru) {
  testUnit(passthru)
  testE2e(passthru)
}
