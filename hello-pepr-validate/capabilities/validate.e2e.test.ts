import {
  beforeAll,
  afterEach,
  describe,
  it,
  expect,
} from "@jest/globals";
import { dirname } from 'node:path';
import { Cmd } from "helpers/src/Cmd";
import { TestRunCfg } from "helpers/src/TestRunCfg";
import {
  mins,
  secs,
  sleep,
  untilTrue,
  resourceLive,
} from "helpers/src/general";
import { clean } from 'helpers/src/cluster';
import { K8s, kind } from 'kubernetes-fluent-client';

const halfApply = async (resources) => {
  resources = [ resources ].flat()
  return Promise.all(
    resources.map((r) => K8s(kind[r.kind]).Apply(r))
  )
}

const fullApply = async (resources) => {
  resources = [ resources ].flat()

  return Promise.all(resources.map(async (r) => {
    const kynd = kind[r.kind]
    const applied = await K8s(kynd).Apply(r)

    return untilTrue(() => resourceLive(kynd, applied))
  }))
}

const sift = (stdout) => {
  const parsed = stdout
    .filter(l => l !== '')
    .map(l => JSON.parse(l))
    .filter(l => l.url !== "/healthz")
    .filter(l => l.msg !== "Pepr Store update")
    .filter(l => l.name !== "/kube-root-ca.crt")
  
  parsed.sort((l, r) => l.time > r.time ? 1 : -1)
    
  return parsed.map(l => JSON.stringify(l))
}

const logs = async () => {
  const pods = await new Cmd({
    cmd: `kubectl get pods -A -l 'pepr.dev/controller=admission' --no-headers --output=name`
  }).run()

  const results = await Promise.all(pods.stdout.filter(n => n !== '').map(async name => new Cmd({
    cmd: `kubectl logs -n pepr-system ${name}`
  }).run()))

  const logs = results.flatMap(r => r.stdout)

  return sift(logs)
}

const untilLogged = async (needle, count = 1) => {
  while (true) {
    const logz = await logs()
    const found = logz.filter(l => l.includes(needle))

    if (found.length >= count) { break }
    await sleep(1)
  }
}

const peprUp = async ({verbose = false} = {}) => {

  // determine npx pepr@version from workspace root
  const root = (await new Cmd({cmd: `npm root`}).run()).stdout[0]
  const workspace = dirname(root)
  const version = (await new Cmd({cwd: workspace, cmd: `npm run pepr -- --version`}).run())
    .stdout.filter(l => l !== '').slice(-1)[0]

  console.time(`pepr@${version} ready (total time)`)

  // pepr cmds use default tsconfig.json (NOT the cli's tsconfig.json)
  const pepr = { TS_NODE_PROJECT: "" }

  let cmd = `npx --yes pepr@${version} build`
  console.time(cmd)
  const build = await new Cmd({env: pepr, cmd}).run()
  if (verbose) { console.log(build) }
  console.timeEnd(cmd)

  cmd = `npx --yes pepr@${version} deploy --confirm`
  console.time(cmd)
  const deploy = await new Cmd({env: pepr, cmd}).run()
  if (verbose) { console.log(deploy) }
  console.timeEnd(cmd)

  console.time('controller scheduling')
  await untilLogged('✅ Scheduling processed', 2)
  console.timeEnd('controller scheduling')

  console.timeEnd(`pepr@${version} ready (total time)`)
}


const trc = new TestRunCfg(__filename)

// using Jest's --runInBand flag, so... shouldn't need the cluster lock (probably)
// beforeAll(async () => { await lock(trc) }, mins(10))
// afterAll(async () => { await unlock(trc) });

describe("validate.ts", () => {
  beforeAll(async () => await peprUp(), mins(2))

  afterEach(async () => await clean(trc), mins(5))

  it("prevents bad examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.fail.yaml`)

    let rejects = (await Promise.all(
      resources.map(r => halfApply(r).then(() => '').catch(e => e.data.message))
    )).filter(f => f)

    // Pepr-namespaced requests are rejected directly
    expect(rejects).toHaveLength(2)
    expect(rejects).toEqual(
      expect.arrayContaining([
        expect.stringMatching("denied the request: fail-oof"),
        expect.stringMatching("denied the request: fail-missing"),
      ])
    )

    // non-Pepr-namespaced requests aren't rejected, just log-&-drop'ed (ugh)
    await untilLogged('Namespace does not match')
    await expect(K8s(kind.ConfigMap).Get("fail-namespace"))
      .rejects.toMatchObject({ status: 404 })
  }, secs(10))
  
  it("allows good examples", async () => {
    const resources = await trc.load(`${trc.here()}/${trc.name()}.pass.yaml`)
    await Promise.all(resources.map(r => fullApply(r)))

    // fullApply will wait until resources are Get-able from cluster, hence
    //  no need for expect()s -- test succeeds if it doesn't error/timeout
  }, secs(10))
})
