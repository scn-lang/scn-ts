import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.1 General & Structural', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should generate a § file declaration with a unique ID and correct relative path', async () => {
    project = await setupTestProject({
      'a.ts': ``,
      'b.ts': ``,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    expect(scn).toContain('§ (1) a.ts');
    expect(scn).toContain('§ (2) b.ts');
  });

  it('should assign unique, incrementing entity IDs within a file, starting from 1', async () => {
    project = await setupTestProject({
      'test.ts': `
        export function funcA() {}
        export class ClassB {}
      `,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    expect(scn).toContain('+ ~ (1.1) funcA()');
    expect(scn).toContain('+ ◇ (1.2) ClassB');
  });

  it('should represent a side-effect import with a .0 entity ID', async () => {
    project = await setupTestProject({
      'a.ts': `import './b.ts';`,
      'b.ts': `console.log('side effect');`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    expect(scn).toContain('§ (1) a.ts -> (2.0)');
    expect(scn).toContain('§ (2) b.ts <- (1.0)');
  });
});