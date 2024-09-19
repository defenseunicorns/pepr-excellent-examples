import { describe, it, expect, beforeAll } from "@jest/globals";
import { exec, execSync } from "child_process";


//Workflow:
// 0. Create symlink IAW readme
// 1. Change file in pepr
// 2. In pepr, run `npm test:journey:build`
// 3. Execute tests

describe('version tests', () => {
  describe('when pepr is v0.31.1', () => { 
    beforeAll(() =>{
      const installPath = execSync('pwd').toString().trim().concat('/..')
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
  describe('when pepr is a local dev copy', () => { 
    beforeAll(() =>{
      const installPath = execSync('pwd').toString().trim().concat('/..')
      execSync('npm install', {cwd: installPath})
      execSync('rm -rf node_modules/pepr', {cwd: installPath})
      execSync(`ln -s ${installPath}/../pepr ${installPath}/node_modules/pepr`)
    })
    it('shows the correct version', ()=>{
      const result = execSync('npx pepr --version').toString()
      expect(result).toContain('0.0.0-development');
    })
    it('shows the help menu with --unpublished', () =>{
      const result = execSync('npx pepr init --help').toString()
      expect(result).toContain('--unpublished')
    })
  })
})