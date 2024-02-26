// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

export function sleep(seconds: number): Promise<void> {
  return new Promise(res => setTimeout(res, secs(seconds)));
}

export function ms(num: number): number { return num }
export function secs(num: number): number { return num * 1000 }
export function mins(num: number): number { return num * secs(60)}

export async function timed(msg, func) {
  console.time(msg)
  await func()
  console.timeEnd(msg)
}