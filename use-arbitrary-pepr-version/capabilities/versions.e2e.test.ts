import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { exec, execSync } from "child_process";


//Workflow:
// 1. Change file in pepr
// 2. In pepr, run `npm test:journey:build`
// 3. Execute tests

//In Pepr CI:
// Excellent-Examples is cloned to PEXEX directory
// See `pepr-excellent-examples.yaml`

//In Excellent-Examples:
// pepr.ts has moduleUp() which is used by each E2E test
// moduleUp() calls peprBuild(), which in turn calls peprVersion()

describe('version tests', () => {
  describe.skip('when pepr version is defined in an example folder (0.31.1)', () => { 
    beforeAll(() =>{
      const installPath = execSync('pwd').toString().trim().concat('/..') // Top-level package.json
      execSync('npm install', {cwd: installPath})
    })

    it('shows the correct version', ()=>{
      const result = execSync('npx pepr --version').toString()
      expect(result).toContain('0.31.1');
    })
    it('shows the help menu without --unpublished', () =>{
      const result = execSync('npx pepr init --help').toString()
      expect(result).not.toContain('--unpublished')
    })
  })
  describe('when pepr version matches the top-level package.json file (v0.36.0)', () => { 
    beforeAll(() =>{
      const installPath = execSync('pwd').toString().trim().concat('/..')
      execSync('npm install', {cwd: installPath})
    })

    it('shows the correct version', ()=>{
      const result = execSync('npx pepr --version').toString()
      expect(result).toContain('0.36.0');
    })
    it('shows the help menu without --unpublished', () =>{
      const result = execSync('npx pepr init --help').toString()
      expect(result).not.toContain('--unpublished')
    })
  })
  describe('when pepr is a local dev copy', () => { 
    let peprAlias = "pepr"
    const installPath = execSync('pwd').toString().trim().concat('/..') // Top-level package.json
    beforeAll(() =>{
      execSync('npm install', {cwd: installPath})
      if(process.env.CI){
        console.log("Testing In CI with .tgz!")
        peprAlias = "file:../pepr-0.0.0-development.tgz"
        expect(execSync(`ls -l ../`, {cwd: installPath}).toString()).toContain('pepr-0.0.0-development.tgz')
      }
      else{
        console.log("Local testing via symlink!")
        execSync(`npm install`, {cwd: installPath})
        execSync(`rm -rf node_modules/pepr`)
        execSync(`ln -s $(pwd)/../pepr/ node_modules/pepr`)
        execSync(`rm -rf node_modules/pepr`, {cwd: installPath})
        execSync(`ln -s $(pwd)/../pepr/ node_modules/pepr`, {cwd: installPath})
        expect(execSync(`ls -l node_modules/pepr`, {cwd: installPath}).toString()).toContain('->')
      }
    })

    afterAll(()=>{
      execSync(`rm -rf node_modules/pepr`)
      execSync(`rm -rf node_modules/pepr`, {cwd: installPath})
      execSync(`npm install`, {cwd: installPath})
      const result = execSync('npx pepr --version').toString()
      expect(result).toContain('0.36.0');
    })

    it('shows the correct version', ()=>{
      const result = execSync(`npx --yes ${peprAlias} --version`, {cwd: installPath}).toString()
      expect(result).toContain('0.0.0-development');
    })
    it('shows the help menu with --unpublished', () =>{
      const result = execSync(`npx --yes ${peprAlias} init --help`, {cwd: installPath}).toString()
      expect(result).toContain('--unpublished')
    })
  })
})