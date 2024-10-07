import { resolve, isAbsolute } from 'node:path';
import { readFile } from 'node:fs/promises';
import { parse } from 'semver';
import { versions } from './versions';

export async function depsUpdater(path, opts, cmd) {
  if (!isAbsolute(path)) { throw `Arg error: 'path' must be absolute, but given: '${path}'` }

  const them = resolve(path);
  const self = resolve('./package.json');

  const theirs = await readFile(them).then(buf => JSON.parse(buf.toString()));
  const mine = await readFile(self).then(buf => JSON.parse(buf.toString()));

  const result = { theirs: theirs.devDependencies, mine: mine.devDependencies, updates: [] }
  const update = (name, mine, theirs) => ({ name, from: mine, to: theirs })

  let pinned = []
  let renews = []
  Object.entries(result.mine).forEach(([name, mine]) => {
    Object.hasOwn(result.theirs, name)
      ? pinned.push(update(name, mine, result.theirs[name]))
      : renews.push(update(name, mine, "???"))
  })
  pinned = pinned.filter(p => p.from !== p.to)
  
  // "exact match" anything found in "their" deps
  result.updates.push(...pinned)

  // "most recent" anything not found in "their" deps
  renews = renews.map(async renew => {
    const { name, from } = renew

    const vers = await versions(name)

    if (name === "@types/node") {
      const pin = pinned
        .filter(f => f.name === "typescript")
        .reduce((_, cur) => cur.to , "")
      const cur = Object.entries(result.mine)
        .filter(([key, _]) => key === "typescript" )
        .reduce((_, cur) => cur[1], "")

      const ver = parse(pin ? pin : cur ? cur : "")
      const tag = ver
        ? `ts${ver.major}.${ver.minor}`
        : "latest"

      return update(name, from, vers['dist-tags'][tag])
    }
  })
  await Promise.all(renews).then(renews => {
    renews = renews.filter(r => r)
    result.updates.push(...renews)
  })

  return result
}
