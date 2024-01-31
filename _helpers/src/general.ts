import * as path from 'path';
import * as fs from 'fs';
import * as fsP from 'fs/promises';
import {
  GenericClass,
  K8s,
  KubernetesObject
} from "kubernetes-fluent-client";
import { TestRunCfg } from './TestRunCfg';

export function sleep(seconds: number): Promise<void> {
  return new Promise(res => setTimeout(res, secs(seconds)));
}

export async function untilTrue(predicate: () => Promise<boolean>) {
  while (true) { if (await predicate()) { break } await sleep(.25) }
}

export function ms(num: number): number { return num }
export function secs(num: number): number { return num * 1000 }
export function mins(num: number): number { return num * secs(60)}

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

export function nearestAncestor(filename: string, fromPath: string): string {
  let parts = fromPath.split(path.sep)
  let starp = Array.from(parts).reverse()

  let searchPaths = []
  parts.forEach((_, idx) => searchPaths.push(
    starp.slice(idx, parts.length).reverse().join(path.sep)
  ))

  for (const sp of searchPaths) {
    const candidate = sp + path.sep + filename
    if (fs.statSync(candidate, { throwIfNoEntry: false })) { return candidate }
  }

  throw `Can't find file "${filename}" in/above path "${fromPath}".`
}

export async function resourceLive(k: GenericClass, o: KubernetesObject) {
  const ns = o.metadata.namespace ? o.metadata.namespace : ""
  const name = (o as { name: string }).name

  try { await K8s(k).InNamespace(ns).Get(name) }
  catch (e) {
    if (e.status === 404) { return false }
    else { throw e }
  }
  return true
}

export async function resourceGone(k: GenericClass, o: KubernetesObject) {
  const ns = o.metadata.namespace ? o.metadata.namespace : ""
  const name = (o as { name: string }).name

  try { await K8s(k).InNamespace(ns).Get(name) }
  catch (e) { if (e.status === 404) { return Promise.resolve(true)} }
  return Promise.resolve(false)
}