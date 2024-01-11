import { exec } from 'child_process';

export interface Spec {
  cmd: string
  stdin?: string[]
  cwd?: string
  env?: object  // object containing key-value pairs
}

export interface Result {
  stdout: string[]
  stderr: string[]
  exitcode: number
}

export class Cmd {
  result: Result
  cmd: string
  stdin: string[]
  cwd: string
  env: object

  constructor(spec: Spec) {
    this.result = null
    this.cmd = spec.cmd
    this.stdin = spec.stdin || []
    this.cwd = spec.cwd || process.cwd()
    this.env = spec.env ? { ...process.env, ...spec.env } : process.env
  }

  run(): Promise<Result> {
    return new Promise((resolve) => {
      const proc = exec(this.cmd, {
        cwd: this.cwd,
        env: this.env as NodeJS.ProcessEnv
      })

      this.stdin.forEach(line => proc.stdin.write(`${line}\n`))
      proc.stdin.end()
      
      let stdout: string[] = []
      proc.stdout.on("data", (chunk) => {
        chunk.split(/[\r\n]+/).forEach(line => stdout.push(line))
      })

      let stderr: string[] = []
      proc.stderr.on("data", (chunk) => {
        chunk.split(/[\r\n]+/).forEach(line => stderr.push(line))
      })

      proc.on("close", exitcode => {
        this.result = { stdout, stderr, exitcode }
        resolve(this.result)
      })
    })
  }
}
