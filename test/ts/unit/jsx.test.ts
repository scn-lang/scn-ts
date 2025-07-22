import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.6 JS/TS Specifics (JSX & Modules)', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should correctly parse a React functional component with props with ◇', async () => {
    project = await setupTestProject({
      'Button.tsx': `
        export function Button({ label, onClick }: { label: string, onClick: () => void }) {
          return <button>{label}</button>
        }
      `,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.tsx'], project: 'tsconfig.json' });
    expect(scn).toContain('+ ◇ (1.1) Button { props: { label:#, onClick:# } }');
  });
  
  it('should represent a JSX element with ⛶ and its attributes', async () => {
    project = await setupTestProject({
      'Component.tsx': `
        export function Component() {
          return <div id="main" className="container fluid">Hello</div>;
        }
      `,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.tsx'], project: 'tsconfig.json' });
    const divLine = scn.split('\n').find(line => line.includes('⛶ (1.2) div'));
    expect(divLine).toBeDefined();
    expect(divLine!).toContain('id:#main');
    expect(divLine!).toContain('class:.container .fluid');
  });

  it('should represent JSX hierarchy with indentation', async () => {
    project = await setupTestProject({
      'App.tsx': `
        export function App() {
          return (
            <main>
              <h1>Title</h1>
            </main>
          );
        }
      `,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.tsx'], project: 'tsconfig.json' });
    const lines = scn.split('\n');
    const mainIndex = lines.findIndex(l => l.includes('⛶ (1.2) main'));
    const h1Index = lines.findIndex(l => l.includes('⛶ (1.3) h1'));

    expect(mainIndex).toBeGreaterThan(-1);
    expect(h1Index).toBeGreaterThan(-1);
    expect(h1Index).toBe(mainIndex + 1);
    
    const mainIndentation = lines[mainIndex].match(/^\s*/)?.[0].length ?? 0;
    const h1Indentation = lines[h1Index].match(/^\s*/)?.[0].length ?? 0;
    
    expect(h1Indentation).toBeGreaterThan(mainIndentation);
  });

  it('should correctly parse various export syntaxes, including re-exports and aliases', async () => {
    project = await setupTestProject({
      'mod.ts': `
        const internal = 1;
        function b() {}
        export { internal as exported, b };
        export * from './another';
      `,
      'another.ts': 'export const c = 3;',
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    const modScn = scn.split('\n\n').find(s => s.includes('mod.ts'));
    // Files: another.ts (1), mod.ts (2)
    expect(modScn).toContain('§ (2) mod.ts\n  -> (1.0)');
    expect(modScn).toContain('@ (2.1) internal = 1');
    expect(modScn).toContain('~ (2.2) b()');
    // Note: The alias `exported` is not represented as a separate SCN entity.
    // The link is to the original `internal` variable.
  });

  it('should correctly parse various import syntaxes and link them from the consuming function', async () => {
    project = await setupTestProject({
      'util.ts': `
        export const val = 1;
        export function func() {}
        export default class MyClass {}
      `,
      'main.ts': `
        import MyClass, { val } from './util';
        import * as utils from './util';
        
        function run() {
            const x = val;
            utils.func();
            new MyClass();
        }
      `
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
    // Files: main.ts (1), util.ts (2)
    // Entities in util.ts: val (2.1), func (2.2), MyClass (2.3)
    // Entity in main.ts: run (1.1)
    expect(mainScn).toContain('§ (1) main.ts\n  -> (2.0)');
    expect(mainScn).toContain('  ~ (1.1) run()\n    -> (2.1), (2.2), (2.3)');
  });
});