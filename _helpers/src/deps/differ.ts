import { parse } from "semver";
import { versions } from "./versions";
import { reader } from "./reader";

export function splitRange(verSpec) {
  verSpec = verSpec.trim();
  if (!verSpec) {
    return ["", ""];
  }

  const first = String.fromCodePoint(verSpec.codePointAt(0));
  const range = first === "~" ? first : first === "^" ? first : "";
  const version = range === "" ? verSpec : verSpec.replace(first, "");

  return [range, version];
}

export async function differ(path) {
  const deps = await reader(path);

  const update = (name, mine, theirs) => ({ name, from: mine, to: theirs });
  const result = { ...deps, updates: [] };

  let pinned = [];
  let renews = [];
  Object.entries(result.mine).forEach(([name, mine]) => {
    if (Object.hasOwn(result.theirs, name)) {
      pinned.push(update(name, mine, result.theirs[name]));
    } else {
      renews.push(update(name, mine, "???"));
    }
  });
  pinned = pinned.filter(p => p.from !== p.to);

  // "exact match" anything found in "their" deps
  result.updates.push(...pinned);

  // "most recent" anything not found in "their" deps
  renews = renews.map(async renew => {
    const { name, from } = renew;
    const [fromRng] = splitRange(from);

    const vers = await versions(name);

    // special case: use ts<maj.min> dist-tag for @types/node version
    if (name === "@types/node") {
      const pin = pinned.filter(f => f.name === "typescript").reduce((_, cur) => cur.to, "");

      const cur = Object.entries(result.mine)
        .filter(([key]) => key === "typescript")
        .reduce((_, cur) => cur[1], "");

      const toRaw = pin ? pin : cur ? cur : "";

      const [toRng, toVer] = splitRange(toRaw);
      const ver = parse(toVer);
      const tag = ver ? `ts${ver.major}.${ver.minor}` : "latest";
      const newVer = toRng
        ? `${toRng}${vers["dist-tags"][tag]}`
        : fromRng
          ? `${fromRng}${vers["dist-tags"][tag]}`
          : `${vers["dist-tags"][tag]}`;

      return newVer !== from ? update(name, from, newVer) : "";
    } else {
      const newVer = `${fromRng}${vers["dist-tags"]["latest"]}`;
      return newVer !== from ? update(name, from, newVer) : "";
    }
  });
  await Promise.all(renews).then(renews => {
    renews = renews.filter(r => r);
    result.updates.push(...renews);
  });

  return result;
}
