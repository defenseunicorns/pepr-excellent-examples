import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BACKUP_SUFFIX = ".peprPin.bak";
const DEP_BLOCKS = ["dependencies", "devDependencies", "peerDependencies"] as const;

interface PackageJson {
  workspaces?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

const readJson = (path: string): PackageJson => JSON.parse(readFileSync(path, "utf8"));

const writeJson = (path: string, content: PackageJson) =>
  writeFileSync(path, JSON.stringify(content, null, 2) + "\n");

const listWorkspaces = (rootDir: string): string[] => {
  const rootPkg = readJson(join(rootDir, "package.json"));
  return rootPkg.workspaces ?? [];
};

/**
 * Rewrites every workspace's `pepr` dependency entry (across `dependencies`,
 * `devDependencies`, and `peerDependencies`) to `peprSpec`, leaving a sidecar
 * backup at `<workspace>/package.json.peprPin.bak`. The original file is
 * preserved untouched on first call; subsequent calls overwrite the package.json
 * but never replace an existing backup, so `restoreWorkspacePeprPins` can always
 * recover the pre-rewrite state.
 */
export function rewriteWorkspacePeprPins(rootDir: string, peprSpec: string): string[] {
  const rewritten: string[] = [];

  for (const ws of listWorkspaces(rootDir)) {
    const pkgPath = join(rootDir, ws, "package.json");
    if (!existsSync(pkgPath)) continue;

    const pkg = readJson(pkgPath);
    const blocksWithPepr = DEP_BLOCKS.filter(b => pkg[b]?.pepr !== undefined);
    if (blocksWithPepr.length === 0) continue;

    const backupPath = pkgPath + BACKUP_SUFFIX;
    if (!existsSync(backupPath)) {
      copyFileSync(pkgPath, backupPath);
    }

    for (const block of blocksWithPepr) {
      pkg[block]!.pepr = peprSpec;
    }
    writeJson(pkgPath, pkg);
    rewritten.push(ws);
  }

  return rewritten;
}

export function restoreWorkspacePeprPins(rootDir: string): string[] {
  const restored: string[] = [];

  for (const ws of listWorkspaces(rootDir)) {
    const backupPath = join(rootDir, ws, "package.json" + BACKUP_SUFFIX);
    if (!existsSync(backupPath)) continue;
    renameSync(backupPath, join(rootDir, ws, "package.json"));
    restored.push(ws);
  }

  return restored;
}
