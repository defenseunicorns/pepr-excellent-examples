// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it
} from '@jest/globals';
import {
  resourceGone,
  untilGone
} from "./general";

// const cluster = "peprexex-helpers-cluster-clean"
// let trc: TestRunCfg
// const originalEnv = { ...process.env }

// beforeAll(async () => {
//   const kubeConfig = await up(cluster)
//   trc = {
//     kubeConfig,
//     labelKey: jest.fn(() => "test-transient/capability-name")
//   } as unknown as TestRunCfg
// }, mins(2))

// beforeEach(() => {
//   // configure test-driven KFC to use test-defined kube config
//   process.env.KUBECONFIG = trc.kubeConfig
// })

// afterEach(() => { process.env = { ...originalEnv } })

// afterAll(async () => { await down(cluster) }, mins(1))


// TODO: need to pull in cluster lock stuff to serialize cluster access to peprexex cluster... right?


describe("resourceGone()", () => {
  it("is tested", () => {
    console.log("TODO")
  })
})

describe.skip("untilGone()", () => {
  it("is tested", () => {
    console.log("TODO")
  })
})
