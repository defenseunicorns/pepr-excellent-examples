import { afterEach, describe, expect, it, vi } from "vitest";
import * as sut from "./reader";

import * as path from "node:path";
vi.mock("node:path", async () => {
  const actual = await vi.importActual<typeof import("node:path")>("node:path");
  return {
    ...actual,
    isAbsolute: vi.fn(),
    resolve: vi.fn(),
  };
});
const { isAbsolute, resolve } = vi.mocked(path);

import * as fs from "node:fs/promises";
vi.mock("node:fs/promises", async () => {
  const actual = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
  return {
    ...actual,
    readFile: vi.fn(),
    access: vi.fn(),
  };
});
const { readFile, access } = vi.mocked(fs);

import * as general from "../general";
vi.mock("../general", async () => {
  const actual = await vi.importActual<typeof import("../general")>("../general");
  return {
    ...actual,
    nearestAncestor: vi.fn(),
  };
});
const { nearestAncestor } = vi.mocked(general);

const pkg = obj => ({ devDependencies: obj });
const buffered = obj => Buffer.from(JSON.stringify(obj), "utf-8");
const resolved = obj => (() => Promise.resolve(buffered(obj))) as typeof fs.readFile;

describe("reader()", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects when not given an absolute path", async () => {
    isAbsolute.mockImplementation(() => false);

    const result = sut.reader("what/ever");

    await expect(result).rejects.toMatch(/Arg error: 'path' must be absolute/);
  });

  it("rejects when not given an existing path", async () => {
    isAbsolute.mockImplementation(() => true);
    access.mockImplementation(() => Promise.reject());

    const result = sut.reader("/what/ever");

    await expect(result).rejects.toMatch(/Arg error: 'path' must exist/);
  });

  it("returns a found-dependency set", async () => {
    const them = "/out/there";
    const theirs = { abc: "1.2.3" };
    const theirPkg = pkg(theirs);
    const me = "/in/here";
    const mine = { xyz: "7.8.9" };
    const myPkg = pkg(mine);

    isAbsolute.mockImplementation(() => true);
    resolve.mockImplementation(p => p);
    access.mockImplementation(() => Promise.resolve());
    nearestAncestor.mockImplementation(() => me);
    readFile.mockImplementationOnce(resolved(theirPkg)).mockImplementationOnce(resolved(myPkg));

    const result = await sut.reader(them);

    expect(result).toEqual({
      me: { path: me, content: myPkg },
      mine,
      them: { path: them, content: theirPkg },
      theirs,
    });
  });
});
