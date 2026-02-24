// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import { vi, describe, expect, it, beforeAll, afterAll } from "vitest";
import { ms, secs, mins, sleep, timed } from "./time";

vi.mock("kubernetes-fluent-client");

vi.mock("./resource");

describe("sleep", () => {
  it("resolves after (roughly) given number of seconds", async () => {
    const checkTheClock = () => new Date().valueOf(); // ms since epoch
    const nearestSecond = num => Math.round(num / 1000);
    const seconds = 1;

    const alpha = checkTheClock();
    await sleep(seconds);
    const omega = checkTheClock();
    const delta = nearestSecond(omega - alpha);

    expect(delta).toBe(seconds);
  });
});

describe("ms()", () => {
  it("returns appropriate number of milliseconds", () => {
    const testTable = [
      [100, 100],
      [1000, 1000],
      [10000, 10000],
    ];
    testTable.forEach(([input, result]) => {
      expect(ms(input)).toBe(result);
    });
  });
});

describe("secs()", () => {
  it("returns appropriate number of milliseconds", () => {
    const testTable = [
      [1, 1000],
      [30, 30000],
      [300, 300000],
    ];
    testTable.forEach(([input, result]) => {
      expect(secs(input)).toBe(result);
    });
  });
});

describe("mins()", () => {
  it("returns appropriate number of milliseconds", () => {
    const testTable = [
      [1, 60000],
      [2, 120000],
      [5, 300000],
    ];
    testTable.forEach(([input, result]) => {
      expect(mins(input)).toBe(result);
    });
  });
});

describe("timed()", () => {
  let time;
  let timeEnd;

  beforeAll(() => {
    time = vi.spyOn(console, "time").mockImplementation(() => {});
    timeEnd = vi.spyOn(console, "timeEnd").mockImplementation(() => {});
  });

  afterAll(() => {
    time.mockRestore();
    timeEnd.mockRestore();
  });

  it("runs given function and prints execution duration", async () => {
    const msg = "msg";
    const func = vi.fn(async () => {
      return Promise.resolve("func");
    });

    await timed(msg, func);

    expect(time).toHaveBeenCalledTimes(1);
    expect(time).toHaveBeenCalledWith(msg);
    expect(func).toHaveBeenCalledTimes(1);
    expect(timeEnd).toHaveBeenCalledTimes(1);
    expect(timeEnd).toHaveBeenCalledWith(msg);
  });
});
