import { resolve, isAbsolute } from 'node:path';
import { readFile } from 'node:fs/promises';

export async function depsHandler(path, opts, cmd) {
  if (!isAbsolute(path)) { throw `Arg error: 'path' must be absolute, but given: '${path}'` }

  const them = resolve(path);
  const self = resolve('./package.json');

  const theirs = await readFile(them).then(buf => JSON.parse(buf.toString()));
  const mine = await readFile(self).then(buf => JSON.parse(buf.toString()));

  const result = { theirs: theirs.devDependencies, mine: mine.devDependencies, updates: [] }
  const update = (name, mine, theirs) => ({ name, from: mine, to: theirs })

  let pinned = []
  let recent = []
  Object.entries(result.mine).forEach(([name, mine]) => {
    Object.hasOwn(result.theirs, name)
      ? pinned.push(update(name, mine, result.theirs[name]))
      : recent.push(update(name, mine, "???"))
  })
  pinned = pinned.filter(p => p.from !== p.to)
  
  // "exact match" anything found in "their" deps
  result.updates.push(...pinned)

  // "most recent" anything not found in "their" deps
  // Object
  //   .entries(result.mine)
  //   .filter(([name]) => !Object.hasOwn(result.theirs, name))
  //   .forEach(([name, mine]) => {
  //     console.log(`not found: ${JSON.stringify(update(name, mine, "???"))}`)
  //     // npm view @types/node versions --json
  //   })

  return result
}
