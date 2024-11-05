import { Cmd } from "../Cmd";

export async function versions(name) {
  const result = await new Cmd({ cmd: `npm view ${name} --json` }).run();
  return JSON.parse(result.stdout.join(""));
}
