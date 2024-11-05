// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import {
  jest,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it
} from '@jest/globals';
import * as pfs from 'fs/promises';
import * as os from 'os';
import {
  untilTrue,
  waitLock,
  nearestAncestor,
  halfCreate,
  fullCreate
} from "./general";
import { ms, secs } from './time';
// import { K8sFilteredActions, K8sInit } from 'kubernetes-fluent-client/dist/fluent/types';

import * as KFC from "kubernetes-fluent-client";
jest.mock("kubernetes-fluent-client")
const { K8s, kind } = jest.mocked(KFC)

import * as resource from "./resource";
jest.mock("./resource")
const { live } = jest.mocked(resource)

describe("untilTrue()", () => {
  it("resolves when given predicate returns true", async () => {
    const predicate = () => new Promise<boolean>(resolve => {
      setTimeout(() => resolve(true), 250)
    })
    await untilTrue(predicate)
  })
})

describe("waitLock()", () => {
  let workdir: string;

  beforeEach(async () => {
    workdir = await pfs.mkdtemp(`${os.tmpdir()}/waitLock-`)
  })

  it("immediate claim", async () => {
    const lockfile = `${workdir}/lock.txt`
    const myUnique = `/example/unique/value`

    await waitLock(lockfile, myUnique)

    expect(pfs.stat(lockfile)).resolves.toBeTruthy()
    expect(await pfs.readFile(lockfile, "utf8")).toBe(myUnique)
  }, secs(1))

  it("wait and claim", async () => {
    const lockfile = `${workdir}/lock.txt`
    const myUnique = `/example/unique/value`
    await pfs.writeFile(lockfile, '/not/the/right/value')
    setTimeout(async () => pfs.rm(lockfile), ms(100))

    await waitLock(lockfile, myUnique)

    expect(pfs.stat(lockfile)).resolves.toBeTruthy()
    expect(await pfs.readFile(lockfile, "utf8")).toBe(myUnique)
  }, secs(2))

  afterEach(async () => {
    await pfs.rm(workdir, { recursive: true, force: true })
  })
})

describe("nearestAncestor()", () => {
  let rootdir: string
  let filename: string
  let ancestor: string
  let workdir: string

  beforeAll(async () => {
    rootdir = await pfs.mkdtemp(`${os.tmpdir()}/nearestAncestor-`)
    filename = "package.json"
    ancestor = `${rootdir}/${filename}`
    workdir = `${rootdir}/a/b/c/work`

    await pfs.writeFile(ancestor, '{"fake":"package.json"}')
    await pfs.mkdir(workdir, { recursive: true })
  })

  it("synchronously returns path of first ancenstor with given name", () => {
    const found = nearestAncestor(filename, workdir)
    expect(found).toBe(ancestor)
  })

  it("throws when ancestor can't be found", () => {
    const notFound = () => nearestAncestor("missing.txt", workdir)
    expect(notFound).toThrow()
  })

  afterAll(async () => {
    await pfs.rm(rootdir, { recursive: true, force: true })
  })
})

describe("halfCreate()", () => {
  it("resolves applied resources on successful apply to cluster", async () => {
    const Apply = jest.fn((res: object) => Promise.resolve({...res, applied: true}))
    K8s.mockImplementation(() => (
      { Apply } as unknown as ReturnType<typeof K8s<any, any>>
    ))
    const resources = [
      { kind: "ConfigMap", metadata: { name: "test-alpha" } },
      { kind: "ConfigMap", metadata: { name: "test-bravo" } },
      { kind: "ConfigMap", metadata: { name: "test-gamma" } }
    ]

    const applied = await halfCreate(resources)

    expect(applied.length).toBe(resources.length)
    for (const r of resources) {
      expect(K8s).toHaveBeenCalledWith(kind[r.kind])
      expect(Apply).toHaveBeenCalledWith(r)
      expect(applied).toContainEqual({...r, applied: true})
    }
  })
})

describe("fullCreate()", () => {
  it("resolves applied resources when Get-able from cluster", async () => {
    const Apply = jest.fn((res: object) => Promise.resolve({...res, applied: true}))
    K8s.mockImplementation(() => (
      { Apply } as unknown as ReturnType<typeof K8s<any, any>>
    ))
    live.mockImplementationOnce(() => Promise.resolve(false))
    live.mockImplementationOnce(() => Promise.resolve(false))
    live.mockImplementationOnce(() => Promise.resolve(false))
    live.mockImplementation(() => Promise.resolve(true))
    const resources = [
      { kind: "ConfigMap", metadata: { name: "test-alpha" } },
      { kind: "ConfigMap", metadata: { name: "test-bravo" } },
      { kind: "ConfigMap", metadata: { name: "test-gamma" } }
    ]

    const applied = await fullCreate(resources)

    expect(applied.length).toBe(resources.length)
    for (const r of resources) {
      expect(K8s).toHaveBeenCalledWith(kind[r.kind])
      expect(Apply).toHaveBeenCalledWith(r)
      expect(applied).toContainEqual({...r, applied: true})
    }
  })
})