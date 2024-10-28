import { dirname } from 'node:path';
import { K8s, kind } from 'kubernetes-fluent-client';
import { sleep } from "./time";
import { Cmd } from './Cmd';
import { untilTrue } from './general';
import { gone } from './resource'
import { cwd } from 'node:process';
import { readFile } from 'node:fs/promises';

export function sift(stdout) {
  const withoutKnownBad = stdout
    .filter(l => !l.includes('] DeprecationWarning: '))
    .filter(l => !l.includes('--trace-deprecation'))
    .filter(l => l)

  try {
    const parsed = withoutKnownBad
      .map(l => JSON.parse(l))
      .filter(l => l.url !== "/healthz")
      .filter(l => l.msg !== "Pepr Store update")
      .filter(l => l.name !== "/kube-root-ca.crt")

    parsed.sort((l, r) => l.time - r.time)

    return parsed.map(l => JSON.stringify(l))

  } catch (e) {
    if (
      e.message.includes("Unexpected end of JSON input") ||
      e.message.includes("Unterminated string in JSON ")
    ) {
      console.error("Unexpected JSON input. Offending lines:")
      const offenders = withoutKnownBad
        .filter(l => l.trim() !== '[' && l.trim() !== ']')
        .filter(l => {
          let fails = false
          try { JSON.parse(l) } catch { fails = true }
          return fails
        })
      offenders.forEach(o => console.error(`-->${o}<--`))
    }
    else {
      console.error(e);
    }
  }
}

export async function logs() {
  const podsAdmission = await new Cmd({
    cmd: `kubectl get pods -A -l 'pepr.dev/controller=admission' --no-headers --output=name`
  }).run()

  const podsWatcher = await new Cmd({
    cmd: `kubectl get pods -A -l 'pepr.dev/controller=watcher' --no-headers --output=name`
  }).run()

  const podsOut = podsAdmission.stdout.concat(podsWatcher.stdout)

  const results = await Promise.all(podsOut.filter(n => n !== '').map(async name => new Cmd({
    cmd: `kubectl logs -n pepr-system ${name}`
  }).run()))

  const logs = results.flatMap(r => r.stdout)

  return sift(logs)
}

export async function untilLogged(needle: String | Function, count = 1) {
  while (true) {
    const logz = await logs()

    let found = []
    if (typeof needle === 'string') {
      found = logz.filter(l => l.includes(needle))
    }
    else if (typeof needle === 'function') {
      found = logz.filter(l => needle(l))
    }

    if (found.length >= count) { break }
    await sleep(1)
  }
}

export function getPeprAlias(): string{
  return process.env.PEPR_PACKAGE ? `file:${process.env.PEPR_PACKAGE}` : 'pepr';
}

export async function peprVersion(): Promise<string> {
  let version: string = ''
  if (getPeprAlias() === "pepr") {
    // determine npx pepr@version from workspace root
    const root = (await new Cmd({ cmd: `npm root` }).run()).stdout[0]
    const workspace = dirname(root)
    version = (await new Cmd({ cwd: workspace, cmd: `npx pepr --version` }).run())
      .stdout.filter(l => l !== '').slice(-1)[0]
  } 
  else{
    // determine pepr version from local copy
    version = getPeprAlias()
  }
  return version
}

export async function moduleBuild({ version = "", verbose = false, rbacMode = "admin" } = {}) {
  // can't have await expressions in default args, so gotta do it here
  if (version === "") { version = await peprVersion() }

  // pepr cmds use default tsconfig.json (NOT the cli's tsconfig.json)
  const pepr = { TS_NODE_PROJECT: "" }

  let cmd = `npx --yes ${getPeprAlias()} build --rbac-mode=${rbacMode}`
  console.time(cmd)
  const build = await new Cmd({ env: pepr, cmd }).run()
  if (verbose) { console.log(build) }
  console.timeEnd(cmd)
}

export async function moduleUp({ version = "", verbose = false, rbacMode = "admin" } = {}) {
  let cmd: string = "";
  // can't have await expressions in default args, so gotta do it here
  if (version === "") { version = await peprVersion() }

  console.time(`pepr@${version} ready (total time)`)

  // pepr cmds use default tsconfig.json (NOT the cli's tsconfig.json)
  const pepr = { TS_NODE_PROJECT: "" }

  await moduleBuild({ version, verbose, rbacMode })

  if (process.env.PEPR_IMAGE) {
    cmd = `npx --yes ${getPeprAlias()} deploy --image=${process.env.PEPR_IMAGE} --confirm`
  } else {
    cmd = `npx --yes ${getPeprAlias()} deploy --confirm`
  }

  console.time(cmd)
  const deploy = await new Cmd({ env: pepr, cmd }).run()
  if (verbose) { console.log(deploy) }
  console.timeEnd(cmd)

  await untilLogged('✅ Scheduling processed', 2)
  console.timeEnd(`pepr@${version} ready (total time)`)
}

export async function moduleDown() {
  const modPkg = `${cwd()}/package.json`
  const cfg = JSON.parse((await readFile(modPkg)).toString())

  const summary = "pepr module removed (total time)"
  console.time(summary)

  let msg = 'remove pepr namespace'
  console.time(msg)
  try {
    const name = "pepr-system"
    const peprSystem = await K8s(kind.Namespace).Get(name)
    await K8s(kind.Namespace).Delete(name)
    await untilTrue(() => gone(kind.Namespace, peprSystem))

  } catch (e) {
    if (![404].includes(e.status)) { throw e }
  }
  console.timeEnd(msg)

  msg = "remove default pepr store"
  console.time(msg)
  try {
    const name = "peprstores.pepr.dev"
    const peprStore = await K8s(kind.CustomResourceDefinition).Get(name)
    await K8s(kind.CustomResourceDefinition).Delete(name)
    await untilTrue(() => gone(kind.CustomResourceDefinition, peprStore))

  } catch (e) {
    if (![404].includes(e.status)) { throw e }
  }
  console.timeEnd(msg)

  msg = "remove pepr cluster role binding"
  console.time(msg)
  try {
    const name = `pepr-${cfg.pepr.uuid}`
    const peprBinding = await K8s(kind.ClusterRoleBinding).Get(name)
    await K8s(kind.ClusterRoleBinding).Delete(name)
    await untilTrue(() => gone(kind.ClusterRoleBinding, peprBinding))

  } catch (e) {
    if (![404].includes(e.status)) { throw e }
  }
  console.timeEnd(msg)

  msg = "remove pepr cluster role"
  console.time(msg)
  try {
    const name = `pepr-${cfg.pepr.uuid}`
    const peprRole = await K8s(kind.ClusterRole).Get(name)
    await K8s(kind.ClusterRole).Delete(name)
    await untilTrue(() => gone(kind.ClusterRole, peprRole))

  } catch (e) {
    if (![404].includes(e.status)) { throw e }
  }
  console.timeEnd(msg)

  msg = "remove pepr webhooks"
  console.time(msg)
  try {
    const name = `pepr-${cfg.pepr.uuid}`
    const peprVal = await K8s(kind.ValidatingWebhookConfiguration).Get(name)
    await K8s(kind.ValidatingWebhookConfiguration).Delete(name)
    await untilTrue(() => gone(kind.ValidatingWebhookConfiguration, peprVal))

    const peprMut = await K8s(kind.MutatingWebhookConfiguration).Get(name)
    await K8s(kind.MutatingWebhookConfiguration).Delete(name)
    await untilTrue(() => gone(kind.MutatingWebhookConfiguration, peprMut))

  } catch (e) {
    if (![404].includes(e.status)) { throw e }
  }
  console.timeEnd(msg)

  console.timeEnd(summary)
}
