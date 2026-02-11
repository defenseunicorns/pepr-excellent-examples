import { describe, expect, it } from "vitest";
import * as sut from "./versions";

describe("versions()", () => {
  it("pulls a version dump from npm", async () => {
    const dep = "@types/node";
    const result = await sut.versions(dep);

    expect(result.name).toBe(dep);
    expect(result).toHaveProperty("dist-tags");
    expect(result).toHaveProperty("versions");
  });
});
