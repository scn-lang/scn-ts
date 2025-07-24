import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.5 Function & Method Qualifiers', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should prefix public members with +', async () => {
    project = await setupTestProject({
      'test.ts': `export class MyClass { public myMethod() {} }`,
    });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.2) myMethod()');
  });

  it('should prefix private members with -', async () => {
    project = await setupTestProject({
      'test.ts': `export class MyClass { private myMethod() {} }`,
    });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('- ~ (1.2) myMethod()');
  });

  it('should treat default class members as public and prefix with +', async () => {
    project = await setupTestProject({
      'test.ts': `export class MyClass { myMethod() {} }`,
    });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.2) myMethod()');
  });

  it('should append ... to an async function or method', async () => {
    project = await setupTestProject({
      'test.ts': `
        export async function myFunc() {}
        export class MyClass { async myMethod() {} }
      `,
    });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) myFunc() ...');
    expect(scn).toContain('+ ~ (1.3) myMethod() ...');
  });

  it('should append ! to a function that has a throw statement', async () => {
    project = await setupTestProject({
      'test.ts': `export function myFunc() { throw new Error('test'); }`,
    });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) myFunc() !');
  });

  it('should correctly handle functions that are both async and can throw', async () => {
    project = await setupTestProject({
      'test.ts': `export async function myFunc() { throw new Error('test'); }`,
    });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) myFunc() ... !');
  });
  
  it('should append o to a pure function (repograph heuristic)', async () => {
    // This test relies on repograph's isPure heuristic.
    // A simple function with no side effects is a good candidate.
     project = await setupTestProject({
      'test.ts': `export function add(a: number, b: number): number { return a + b; }`,
    });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) add(a: #, b: #): #number o');
  });
});