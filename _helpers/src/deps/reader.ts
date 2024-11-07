import { resolve, isAbsolute } from "node:path";
import { access, readFile } from "node:fs/promises";
import { nearestAncestor } from "../general";

export async function reader(path) {
  if (!isAbsolute(path)) {
    throw `Arg error: 'path' must be absolute, but given: '${path}'`;
  }

  const them = resolve(path);
  try {
    await access(path);
  } catch {
    throw `Arg error: 'path' must exist, but given does not: '${path}'`;
  }

  const me = resolve(nearestAncestor("package.json", process.cwd()));

  const theirCont = await readFile(them).then(buf => JSON.parse(buf.toString()));
  const myCont = await readFile(me).then(buf => JSON.parse(buf.toString()));

  return {
    me: { path: me, content: myCont },
    mine: myCont.devDependencies,
    them: { path: them, content: theirCont },
    theirs: theirCont.devDependencies,
  };
}
