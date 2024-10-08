import { resolve, isAbsolute } from 'node:path';
import { access, readFile } from 'node:fs/promises';
import { nearestAncestor } from '../general';

export async function writer(updates) {
  console.log("--write")
  console.log(updates)
}
