// ----- deps ----- //
const { execSync } = require("node:child_process");

// ----- args ----- //
process.argv.shift(); // node
process.argv.shift(); // script
const peprExcellentExamplesPath = process.argv.shift(); // abs path to pepr-excellent-examples

// ----- main ----- //

// find examples
let cmd = "npm exec -c pwd -ws";
let stdout = execSync(cmd, { cwd: peprExcellentExamplesPath });
let examples = stdout.toLocaleString().trim().split("\n");

// select those with 'test:e2e' scripts
let e2es = examples
  .map((ex) => [ex, require(`${ex}/package.json`)])
  .filter(([ex, cfg]) => Object.hasOwn(cfg.scripts, "test:e2e"));

// gen matrix spec
let spec = {
  include: e2es.map(([ex, cfg]) => {
    // requires package.json.bak which is only present when overriding the version
    if (cfg.name !== "test-specific-version") {
      return {
        name: cfg.name,
        path: ex,
      };
    }
  }),
};

console.log(JSON.stringify(spec));
