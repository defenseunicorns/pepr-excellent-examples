import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import * as sut from "./pepr";

describe("getPeprAlias()", () => {
  let saved: { PEPR_SPEC?: string; PEPR_PACKAGE?: string };

  beforeEach(() => {
    saved = { PEPR_SPEC: process.env.PEPR_SPEC, PEPR_PACKAGE: process.env.PEPR_PACKAGE };
    delete process.env.PEPR_SPEC;
    delete process.env.PEPR_PACKAGE;
  });

  afterEach(() => {
    process.env.PEPR_SPEC = saved.PEPR_SPEC;
    process.env.PEPR_PACKAGE = saved.PEPR_PACKAGE;
    if (saved.PEPR_SPEC === undefined) delete process.env.PEPR_SPEC;
    if (saved.PEPR_PACKAGE === undefined) delete process.env.PEPR_PACKAGE;
  });

  it("prefers PEPR_SPEC when set (resolved-once spec)", () => {
    process.env.PEPR_SPEC = "pepr@1.2.3";
    process.env.PEPR_PACKAGE = "/tmp/pepr.tgz";
    expect(sut.getPeprAlias()).toBe("pepr@1.2.3");
  });

  it("falls back to file:PEPR_PACKAGE when PEPR_SPEC is unset", () => {
    process.env.PEPR_PACKAGE = "/tmp/pepr.tgz";
    expect(sut.getPeprAlias()).toBe("file:/tmp/pepr.tgz");
  });

  it("defaults to pepr@latest when nothing is set", () => {
    expect(sut.getPeprAlias()).toBe("pepr@latest");
  });
});

describe("peprVersion()", () => {
  let saved: string | undefined;

  beforeEach(() => {
    saved = process.env.PEPR_SPEC;
  });

  afterEach(() => {
    process.env.PEPR_SPEC = saved;
    if (saved === undefined) delete process.env.PEPR_SPEC;
  });

  it("returns the version from a resolved PEPR_SPEC without shelling out", async () => {
    process.env.PEPR_SPEC = "pepr@1.2.3";
    await expect(sut.peprVersion()).resolves.toBe("1.2.3");
  });
});

describe("sift()", () => {
  let mockLog, mockErr;

  beforeEach(() => {
    mockLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockErr = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    mockLog.mockRestore();
    mockErr.mockRestore();
  });

  describe("on parsing error", () => {
    it("prints offending lines", async () => {
      const all = [
        "[",
        '  {"level":30,"time":1727729495753,"pid":1,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Pepr Controller (v0.0.0-development)"}',
        "  (node:1) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.",
        "  (Use `node --trace-deprecation ...` to show where the warning was created)",
        '  {"level":30,"time":1727729495753,"pid":1,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Applying the Pepr Store CRD if it doesn\'t exist"}',
        '  {"level":20,"time":1727729497520,"pid":17,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Add ',
        "]",
      ];
      const expected = [
        "Unexpected JSON input. Offending lines:",
        '-->  {"level":20,"time":1727729497520,"pid":17,"hostname":"pepr-6b7cfad2-722b-47f8-99ed-f3cbf65ab5b1-8554cd4879-4ddgz","msg":"Add <--',
      ];

      const result = sut.sift(all);

      expect(result).toBe(undefined);

      expect(mockErr).toHaveBeenCalledTimes(2);
      mockErr.mock.calls.flat().forEach((call, idx) => {
        expect(call).toBe(expected[idx]);
      });
    });
  });
});
