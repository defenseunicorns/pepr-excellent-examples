import { parse } from 'semver';
import { versions } from './versions';
import { reader } from './reader';

export async function differ(path) {
  let deps = await reader(path);

  const update = (name, mine, theirs) => ({ name, from: mine, to: theirs })
  let result = { ...deps, updates: [] };

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

    else {
      return update(name, from, vers['dist-tags']["latest"])
    }
  })
  await Promise.all(renews).then(renews => {
    renews = renews.filter(r => r)
    result.updates.push(...renews)
  })

  return result
}
