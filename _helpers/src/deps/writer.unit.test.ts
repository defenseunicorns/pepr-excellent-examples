import { afterEach, describe, expect, it, vi } from "vitest";
import * as sut from "./writer";

import * as fs from "node:fs/promises";
vi.mock("node:fs/promises");
const { rename, writeFile } = vi.mocked(fs);

describe("writer()", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("writes diff updates to package.json", async () => {
    const mine = { xyz: "1.2.3" };
    const theirs = { xyz: "7.8.9" };
    const diff = {
      me: { path: "/in/here", content: { devDependencies: { ...mine } } },
      mine,
      them: { path: "/out/there", content: { devDependencies: { ...theirs } } },
      theirs,
      updates: [{ name: "xyz", from: "1.2.3", to: "7.8.9" }],
    };
    const expected = JSON.stringify({ devDependencies: { xyz: "7.8.9" } }, null, 2);

    await sut.writer(diff);

    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(writeFile).toHaveBeenCalledWith(`${diff.me.path}.bak`, expected);
    expect(rename).toHaveBeenCalledTimes(1);
    expect(rename).toHaveBeenCalledWith(`${diff.me.path}.bak`, `${diff.me.path}`);
  });
});
