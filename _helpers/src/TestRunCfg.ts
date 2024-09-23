import * as fs from 'fs';
import * as path from 'node:path';
import { parseAllDocuments } from 'yaml';
import { readFile } from 'node:fs/promises';

export class TestRunCfg {
  me: string;
  unique: string;
  kubeConfig: string;

  constructor(
    me: string,
    unique: string = new Date().valueOf().toString(),
    kubeConfig: string = process.env.KUBECONFIG || "~/.kube/config",
  ) {
    this.me = me
    this.unique = unique
    this.kubeConfig = kubeConfig
  }

  name(): string {
    return path.basename(this.me).replace(/\..*$/, '')
  }

  here(): string {
    return path.dirname(this.me)
  }

  root(): string {
    return path.dirname(nearestAncestor("package.json", this.here()))
  }

  lockfile(): string {
    return `${this.root()}/cluster.lock`
  }

  locktext(): string {
    return `${this.me}:${this.unique}`
  }

  labelKey(): string {
    return `test-transient/${this.name()}`
  }

  async loadRaw(manifest) {
    // read yaml doc into list of js resources
    return parseAllDocuments(await readFile(manifest, "utf8"))
      .map(doc => JSON.parse(String(doc.contents)))
  }

  async load(manifest) {
    const resources = await this.loadRaw(manifest)

      // add test-specific label to resources
    for (const resource of resources) {
      resource.metadata.labels = resource.metadata.labels || {}
      resource.metadata.labels = {
        ...resource.metadata.labels,
        [this.labelKey()]: this.unique
      }
    }
    return resources
  }
}

function nearestAncestor(filename: string, fromPath: string): string {
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
