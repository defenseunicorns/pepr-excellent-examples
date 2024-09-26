import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { execSync } from "child_process";
import {getPeprAlias} from '../../_helpers/src/pepr'

describe('version tests', () => {
  describe('when pepr version is defined in an example folder (v0.31.1)', () => { 
    beforeAll(() =>{
      execSync(`rm -rf node_modules/pepr`)
    })

    it('shows the correct version', ()=>{
      const result = execSync(`npx pepr --version`).toString()
      expect(result).toContain('0.31.1');
    })
  })
  describe('when pepr version matches the top-level package.json file (v0.36.0)', () => { 
    beforeAll(() =>{
      const installPath = execSync('pwd').toString().trim().concat('/..')
      execSync('npm install', {cwd: installPath})
    })

    it('shows the correct version', ()=>{
      const result = execSync(`npx pepr --version`).toString()
      expect(result).toContain('0.36.0');
    })
  })
  describe('when pepr is a development copy (--local-package or --custom-package)', () => { 
    const peprBuildName = 'pepr-0.0.0-development.tgz';
    beforeAll(async () =>{
      expect(execSync(`ls -l ${process.env.PEPR_PACKAGE}`).toString()).toContain(peprBuildName)
    })

    afterAll(()=>{
      const result = execSync('npx pepr --version').toString()
      expect(result).toContain('0.36.0');
    })

    it('shows the correct version', ()=>{
      const result = execSync(`npx --yes ${getPeprAlias()} --version`).toString()
      expect(result).toContain('0.0.0-development');
    })
  })
})