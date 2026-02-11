// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import { vi, describe, expect, it } from "vitest";
import { live, gone } from "./resource";

import * as KFC from "kubernetes-fluent-client";
vi.mock("kubernetes-fluent-client");
const { K8s, kind } = vi.mocked(KFC);

describe("live()", () => {
  it("returns true when resource is Get-able", async () => {
    const Get = vi.fn(_name => Promise.resolve());
    const InNamespace = vi.fn(_ns => ({ Get }));
    K8s.mockImplementationOnce(
      () => ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name" } };

    const result = await live(kind.GenericKind, kobject);

    expect(result).toBe(true);
    expect(InNamespace.mock.calls[0][0]).toBe("");
  });

  it("returns false when resource isn't Get-able", async () => {
    const Get = vi.fn(_name => {
      throw { status: 404 };
    });
    const InNamespace = vi.fn(_ns => ({ Get }));
    K8s.mockImplementationOnce(
      () => ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name", namespace: "test-ns" } };

    const result = await live(kind.GenericKind, kobject);

    expect(result).toBe(false);
    expect(InNamespace.mock.calls[0][0]).toBe(kobject.metadata.namespace);
  });
});

describe("gone()", () => {
  it("returns false when resource is Get-able", async () => {
    const Get = vi.fn(_name => Promise.resolve());
    const InNamespace = vi.fn(_ns => ({ Get }));
    K8s.mockImplementationOnce(
      () => ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name" } };

    const result = await gone(kind.GenericKind, kobject);

    expect(result).toBe(false);
    expect(InNamespace.mock.calls[0][0]).toBe("");
  });

  it("returns true when resource isn't Get-able", async () => {
    const Get = vi.fn(_name => {
      throw { status: 404 };
    });
    const InNamespace = vi.fn(_ns => ({ Get }));
    K8s.mockImplementationOnce(
      () => ({ InNamespace }) as unknown as ReturnType<typeof K8s<any, any>>,
    );
    const kobject = { metadata: { name: "test-name", namespace: "test-ns" } };

    const result = await gone(kind.GenericKind, kobject);

    expect(result).toBe(true);
    expect(InNamespace.mock.calls[0][0]).toBe(kobject.metadata.namespace);
  });
});
