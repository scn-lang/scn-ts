import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.4 Type System Symbols', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should represent an enum with ☰', async () => {
    project = await setupTestProject({ 'test.ts': `export enum Color { Red, Green }` });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ☰ (1.1) Color');
  });

  it('should represent a type alias with =:', async () => {
    project = await setupTestProject({ 'test.ts': `export type UserID = string;` });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ =: (1.1) UserID = string');
  });

  it('should represent type references in function parameters with #', async () => {
    project = await setupTestProject({ 'test.ts': `function process(id: string, value: number) {}` });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.1) process(id: #, value: #)');
  });
  
  it('should represent a function return type with :#Type', async () => {
    project = await setupTestProject({ 'test.ts': `function isActive(): boolean {}` });
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.1) isActive(): #boolean');
  });
  
  it('should correctly represent complex types like Promise<User>', async () => {
    project = await setupTestProject({ 'test.ts': `
      interface User {}
      function getUser(): Promise<User> { return Promise.resolve({} as User); }
    `});
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.2) getUser(): #Promise<User>');
  });

  it('should correctly represent generic type parameters and return types', async () => {
    project = await setupTestProject({ 'test.ts': `
      function transform<T, U>(data: T[], func: (item: T) => U): U[] { return []; }
    `});
    const { scn } = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.1) transform(data: #, func: #): #U[]');
  });
});