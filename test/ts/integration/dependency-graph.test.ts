import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.2 Inter-File Dependency Graphs', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should resolve and add <- annotations to entities that are used by other entities', async () => {
    project = await setupTestProject({
      'util.ts': `export function helper() {}`,
      'main.ts': `import { helper } from './util'; function main() { helper(); }`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    const utilScn = scn.split('\n\n').find(s => s.includes('util.ts'));
    expect(utilScn).toBeDefined();
    // main.ts is file 1, util.ts is file 2.
    // main.ts's 'main' (1.1) calls util.ts's 'helper' (2.1)
    expect(utilScn).toContain('§ (2) util.ts\n  <- (1.0)');
    expect(utilScn).toContain('  + ~ (2.1) helper()\n    <- (1.1)');
  });

  it('should add a summary of file-level dependencies and callers on the § file declaration line', async () => {
    project = await setupTestProject({
      'config.ts': `export const setting = 1;`,
      'service.ts': `import { setting } from './config'; export const value = setting;`,
      'main.ts': `import { value } from './service'; console.log(value);`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    // Files are sorted alphabetically: config.ts (1), main.ts (2), service.ts (3)
    // main.ts imports service.ts. service.ts imports config.ts
    expect(scn).toContain('§ (1) config.ts\n  <- (3.0)');
    expect(scn).toContain('§ (2) main.ts\n  -> (3.0)');
    expect(scn).toContain('§ (3) service.ts\n  -> (1.0)\n  <- (2.0)');
  });

  it('should correctly represent a multi-step dependency chain (A -> B -> C)', async () => {
    project = await setupTestProject({
      'c.ts': `export const C = 'c';`,
      'b.ts': `import { C } from './c'; export const B = C;`,
      'a.ts': `import { B } from './b'; function run() { console.log(B); }`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    // File-level links. a.ts (1), b.ts (2), c.ts (3)
    expect(scn).toContain('§ (1) a.ts\n  -> (2.0)');
    expect(scn).toContain('§ (2) b.ts\n  -> (3.0)\n  <- (1.0)');
    expect(scn).toContain('§ (3) c.ts\n  <- (2.0)');

    // Entity-level links
    const aScn = scn.split('\n\n').find(s => s.includes('a.ts'));
    const bScn = scn.split('\n\n').find(s => s.includes('b.ts'));
    const cScn = scn.split('\n\n').find(s => s.includes('c.ts'));

    expect(aScn).toContain('  ~ (1.1) run()\n    -> (2.1)'); // run() in a.ts uses B from b.ts
    expect(bScn).toContain('  + ◇ (2.1) B = C\n    -> (3.1)\n    <- (1.1)'); // B in b.ts uses C from c.ts and is used by run() from a.ts
    expect(cScn).toContain('  + ◇ (3.1) C = \'c\'\n    <- (2.1)'); // C is used by B
  });
  
  it('should link a dependency from the function that uses it, not just the file', async () => {
    project = await setupTestProject({
      'util.ts': `export function log() {}`,
      'main.ts': `
        import { log } from './util';
        function run() {
          log();
        }
      `,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
    expect(mainScn).toBeDefined();
    expect(mainScn).toContain('§ (1) main.ts\n  -> (2.0)');
    expect(mainScn).toContain('  ~ (1.1) run()\n    -> (2.1)');
  });

  it('should support linking to multiple entities on one line', async () => {
     project = await setupTestProject({
      'util.ts': `
        export function helperA() {}
        export function helperB() {}
      `,
      'main.ts': `
        import { helperA, helperB } from './util';
        export function run() {
          helperA();
          helperB();
        }
      `,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
    expect(mainScn).toBeDefined();
    // main.ts is file 1, util.ts is file 2.
    // run is 1.1, helperA is 2.1, helperB is 2.2
    expect(mainScn).toContain('§ (1) main.ts\n  -> (2.0)');
    expect(mainScn).toContain('  + ~ (1.1) run()\n    -> (2.1), (2.2)');
  });
});