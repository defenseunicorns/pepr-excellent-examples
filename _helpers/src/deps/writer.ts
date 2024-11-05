import { rename, writeFile } from "node:fs/promises";

export async function writer(diff) {
  const bak = `${diff.me.path}.bak`;
  const pkg = JSON.parse(JSON.stringify(diff.me.content));
  diff.updates.forEach(({ name, to }) => (pkg.devDependencies[name] = to));

  await writeFile(bak, JSON.stringify(pkg, null, 2));
  await rename(bak, diff.me.path);
}
