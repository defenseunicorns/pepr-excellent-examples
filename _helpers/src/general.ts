import * as path from 'path';
import * as fs from 'fs';
import * as fsP from 'fs/promises';
import { K8s, kind } from "kubernetes-fluent-client";
import { TestRunCfg } from './TestRunCfg';
import { live } from './resource';
import { sleep } from './time';

export async function untilTrue(predicate: () => Promise<boolean>) {
  while (true) { if (await predicate()) { break } await sleep(.25) }
}

// Jest runs test files in parallel so we can't guarantee that test capabilities
// will only touch non-conflicting cluster resources... which means we have to
// synchronize e2e test cluster access & ownership with a (file-based) lock
export async function waitLock(file: string, unique: string) {
  const lock = async () => {
    let fileHandle: fsP.FileHandle;

    // 'wx' --> open for write; create if it does not exist & fail if does
    // https://nodejs.org/api/fs.html#file-system-flags
    try { fileHandle = await fsP.open(file, 'wx') }
    catch (e) {
      if (e.code === 'EEXIST') { return false } else { throw e }
    }
    
    try { await fileHandle.write(unique) }
    finally { await fileHandle.close() }

    return true
  }

  await untilTrue(lock)
}

export async function lock(trc: TestRunCfg) {
  return waitLock(trc.lockfile(), trc.locktext())
}

export async function unlock(trc: TestRunCfg) {
  try {
    await fsP.rm(trc.lockfile())
  }
  catch (e) {
    if (e.code === 'ENOENT') { return }
    else { throw e }
  }
}

export async function halfCreate(resources, kinds = kind) {
  resources = [ resources ].flat()

  return Promise.all(resources.map((r) => {
    const kynd = kinds[r.kind]
    const applied = K8s(kynd).Apply(r)

    return applied
  }))
}

export async function fullCreate(resources, kinds = kind) {
  resources = [ resources ].flat()

  const applied = []
  for(const r of resources) {
    const kynd = kinds[r.kind]
    const appl = await K8s(kynd).Apply(r)
    await untilTrue(() => live(kynd, appl))

    applied.push(appl)
  }
  return applied
}

export function nearestAncestor(filename: string, fromPath: string): string {
  const parts = fromPath.split(path.sep)
  const starp = Array.from(parts).reverse()

  const searchPaths = []
  parts.forEach((_, idx) => searchPaths.push(
    starp.slice(idx, parts.length).reverse().join(path.sep)
  ))

  for (const sp of searchPaths) {
    const candidate = sp + path.sep + filename
    if (fs.statSync(candidate, { throwIfNoEntry: false })) { return candidate }
  }

  throw `Can't find file "${filename}" in/above path "${fromPath}".`
}