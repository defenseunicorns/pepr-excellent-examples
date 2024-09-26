import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { execSync } from "child_process";
import findUp from 'find-up' // TODO: Would rather use findUpSync()
import {getPeprAlias} from '../../_helpers/src/pepr'

describe('version tests', () => {
  describe('when pepr version is defined in an example folder (v0.31.1)', () => { 
    const peprAlias = 'pepr@0.31.1'
    beforeAll(() =>{
      execSync(`rm -rf node_modules/pepr`)
    })

    it('shows the correct version', ()=>{
      const result = execSync(`npx ${peprAlias} --version`).toString()
      expect(result).toContain('0.31.1');
    })
    it('shows the help menu without --unpublished', () =>{
      const result = execSync(`npx ${peprAlias} init --help`).toString()
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
    const peprBuildName = 'pepr-0.0.0-development.tgz';
    let peprBuildPath = '';
    let peprAlias = process.env.PEPR_PACKAGE ? process.env.PEPR_PACKAGE : 'pepr';
    peprAlias = process.env.PEPR_PACKAGE ? process.env.PEPR_PACKAGE : process.env.PEPR_PACKAGE as string;
    let peprExcellentExamplesRepo = '';
    beforeAll(async () =>{
      peprBuildPath = await findUp(peprBuildName) as string //TODO: Type coercion
      peprAlias = `file:${peprBuildPath}`
      peprExcellentExamplesRepo = await findUp('pepr-excellent-examples', {type: 'directory'}) as string //TODO: type coercion
      expect(execSync(`ls -l ${process.env.PEPR_PACKAGE}`, {cwd: peprExcellentExamplesRepo}).toString()).toContain(peprBuildName)
    })

    afterAll(()=>{
      const result = execSync('npx pepr --version').toString()
      expect(result).toContain('0.36.0');
    })

    it('shows the correct version', ()=>{
      const result = execSync(`npx --yes ${getPeprAlias()} --version`, {cwd: peprExcellentExamplesRepo}).toString()
      expect(result).toContain('0.0.0-development');
    })
    it('shows the help menu with --unpublished', () =>{
      const result = execSync(`npx --yes ${getPeprAlias()} init --help`, {cwd: peprExcellentExamplesRepo}).toString()
      expect(result).toContain('--unpublished')
    })
  })
})