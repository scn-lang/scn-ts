import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.7 CSS Parsing & Integration', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should generate a ¶ CSS Rule for each selector and include intent symbols', async () => {
    project = await setupTestProject({
      'styles.css': `
        .layout-only {
          display: flex;
          position: absolute;
        }
        .text-only {
          font-weight: bold;
          text-align: center;
        }
        .appearance-only {
          background-color: blue;
          border: 1px solid red;
        }
        .all-intents {
          padding: 8px; /* layout */
          font-size: 16px; /* text */
          color: white; /* appearance */
        }
      `,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.css'] });
    
    // The order of intent symbols is sorted alphabetically by the serializer.
    expect(scn).toContain('  ¶ (1.1) .layout-only { 📐 }');
    expect(scn).toContain('  ¶ (1.2) .text-only { ✍ }');
    expect(scn).toContain('  ¶ (1.3) .appearance-only { 💧 }');
    expect(scn).toContain('  ¶ (1.4) .all-intents { 📐 💧 ✍ }');
  });

  it('should create links between a JSX element and CSS rules via className', async () => {
    project = await setupTestProject({
      'Button.css': `
        .btn { color: white; }
        .btn-primary { background-color: blue; }
      `,
      'Button.tsx': `
        import './Button.css';
        export function Button() {
          return <button className="btn btn-primary">Click</button>;
        }
      `,
      // tsconfig needed for repograph to process jsx/css imports
      'tsconfig.json': JSON.stringify({
        "compilerOptions": { "jsx": "react-jsx", "allowJs": true },
        "include": ["**/*.ts", "**/*.tsx"]
      }),
    });
    
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.{ts,tsx,css}'], project: 'tsconfig.json' });

    // File sorting is alphabetical: Button.css -> 1, Button.tsx -> 2
    const tsxScn = scn.split('\n\n').find(s => s.includes('Button.tsx'));
    const cssScn = scn.split('\n\n').find(s => s.includes('Button.css'));

    expect(cssScn).toBeDefined();
    expect(tsxScn).toBeDefined();

    // Check file-level links
    expect(cssScn!).toContain('§ (1) Button.css\n  <- (2.0)');
    expect(tsxScn!).toContain('§ (2) Button.tsx\n  -> (1.0)');

    // Check entity-level links
    // ⛶ button (2.2) should link to both .btn (1.1) and .btn-primary (1.2)
    expect(tsxScn!).toContain('    ⛶ (2.2) button [ class:.btn .btn-primary ]\n      -> (1.1), (1.2)');
    
    // ¶ .btn (1.1) should link back to ⛶ button (2.2)
    expect(cssScn!).toContain('  ¶ (1.1) .btn\n    <- (2.2)');
    
    // ¶ .btn-primary (1.2) should link back to ⛶ button (2.2)
    expect(cssScn!).toContain('  ¶ (1.2) .btn-primary\n    <- (2.2)');
  });

  it('should create links between a JSX element and a CSS rule via id', async () => {
    project = await setupTestProject({
      'App.css': `
        #main-container { border: 1px solid black; }
      `,
      'App.tsx': `
        import './App.css';
        export function App() {
          return <div id="main-container">...</div>;
        }
      `,
      'tsconfig.json': JSON.stringify({
        "compilerOptions": { "jsx": "react-jsx", "allowJs": true },
        "include": ["**/*.ts", "**/*.tsx"]
      }),
    });
    
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.{ts,tsx,css}'], project: 'tsconfig.json' });
    
    // File sorting is alphabetical: App.css -> 1, App.tsx -> 2
    const tsxScn = scn.split('\n\n').find(s => s.includes('App.tsx'));
    const cssScn = scn.split('\n\n').find(s => s.includes('App.css'));

    expect(cssScn).toBeDefined();
    expect(tsxScn).toBeDefined();

    // Check entity-level links
    // ⛶ div (2.2) should link to #main-container (1.1)
    expect(tsxScn!).toContain('    ⛶ (2.2) div [ id:#main-container ]\n      -> (1.1)');
    // ¶ #main-container (1.1) should link back to ⛶ div (2.2)
    expect(cssScn!).toContain('  ¶ (1.1) #main-container\n    <- (2.2)');
  });
});