import * as path from 'node:path';
import { readFile } from 'node:fs/promises';
import { parseAllDocuments } from 'yaml';
import { nearestAncestor } from './general'

export class TestRunCfg {
  me: string;
  unique: string;
  kubeConfig: string;

  constructor(
    me: string,
    unique: string = new Date().valueOf().toString(),
    kubeConfig: string = "~/.kube/config",
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

  async load(manifest) {
    // read yaml doc into list of js resources
    const resources = parseAllDocuments(await readFile(manifest, "utf8"))
      .map(doc => JSON.parse(String(doc.contents)))

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
  
  // module(): string {
  //   return `${this.here()}/${this.name()}.pepr.ts`
  // }

  // manifests(): [string, string][] {
  //   return fs.readdirSync(this.here())
  //   .filter(f => new RegExp(`^${this.name()}\..*`).test(f))
  //   .filter(f => /\.test\.\d+\.yaml$/.test(f))
  //   .sort((l, r) => {
  //     let lnum = parseInt(l.match(/test\.(\d+)\.yaml/)[1])
  //     let rnum = parseInt(r.match(/test\.(\d+)\.yaml/)[1])
  //     return lnum === rnum
  //       ? 0
  //       : lnum < rnum ? -1 : 1
  //   })
  //   .map(f => [
  //     `${this.here()}/${f}`,
  //     `${this.here()}/${f.concat(".json")}`
  //   ])
  // }

  // manifest(index: number): string {
  //   return this.manifests()
  //     .map(m => m[1])
  //     .filter(f => {
  //       let str = f.match(/.*\.(\d+)\.yaml.json/)[1]
  //       let num = parseInt(str)
  //       return num === index
  //     })
  //     [0]
  // }
}
