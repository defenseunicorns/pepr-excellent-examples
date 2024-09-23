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
    const peprAlias = "file:../pepr-0.0.0-development.tgz"
    const installPath = execSync('pwd').toString().trim().concat('/..') // Top-level package.json
    beforeAll(() =>{
      if(process.env.CI){
        console.log("Testing In CI with .tgz!")
      }
      else{
        console.log("Local testing with .tgz!")
      }
      expect(execSync(`ls -l ../`, {cwd: installPath}).toString()).toContain('pepr-0.0.0-development.tgz')
    })

    afterAll(()=>{
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