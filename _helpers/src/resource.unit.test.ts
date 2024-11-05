// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import { jest, describe, expect, it } from "@jest/globals";
import { live, gone } from "./resource";

import * as KFC from "kubernetes-fluent-client";
jest.mock("kubernetes-fluent-client");
const { K8s, kind } = jest.mocked(KFC);

describe("live()", () => {
  it("returns true when resource is Get-able", async () => {
    const Get = jest.fn(() => Promise.resolve());
    const InNamespace = jest.fn(() => ({ Get }));
    K8s.mockImplementationOnce(
      () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name" } };

    const result = await live(kind.GenericKind, kobject);

    expect(result).toBe(true);
    expect(InNamespace.mock.calls[0][0]).toBe("");
  });

  it("returns false when resource isn't Get-able", async () => {
    const Get = jest.fn(() => {
      throw { status: 404 };
    });
    const InNamespace = jest.fn(() => ({ Get }));
    K8s.mockImplementationOnce(
      () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name", namespace: "test-ns" } };

    const result = await live(kind.GenericKind, kobject);

    expect(result).toBe(false);
    expect(InNamespace.mock.calls[0][0]).toBe(kobject.metadata.namespace);
  });
});

describe("gone()", () => {
  it("returns false when resource is Get-able", async () => {
    const Get = jest.fn(() => Promise.resolve());
    const InNamespace = jest.fn(() => ({ Get }));
    K8s.mockImplementationOnce(
      () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name" } };

    const result = await gone(kind.GenericKind, kobject);

    expect(result).toBe(false);
    expect(InNamespace.mock.calls[0][0]).toBe("");
  });

  it("returns true when resource isn't Get-able", async () => {
    const Get = jest.fn(() => {
      throw { status: 404 };
    });
    const InNamespace = jest.fn(() => ({ Get }));
    K8s.mockImplementationOnce(
      () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name", namespace: "test-ns" } };

    const result = await gone(kind.GenericKind, kobject);

    expect(result).toBe(true);
    expect(InNamespace.mock.calls[0][0]).toBe(kobject.metadata.namespace);
  });
});
