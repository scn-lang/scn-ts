# Directory Structure
```
repograph/
  test/
    e2e/
      cli.test.ts
    unit/
      high-level.test.ts
```

# Files

## File: repograph/test/e2e/cli.test.ts
````typescript
import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { spawn } from 'node:child_process';
import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
  createGitignore,
  assertFileExists,
  readFile,
  isValidMarkdown,
  containsValidMermaid,
  loadFixture,
  createProjectFromFixture
} from '../test.util.js';
import path from 'node:path';

describe('CLI End-to-End Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  const runCLI = async (args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/index.ts', ...args], {
        cwd: cwd || process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      });

      child.on('error', reject);
    });
  };

  describe('Basic CLI Usage', () => {
    it('should generate map with default options', async () => {
      const files = {
        'src/index.ts': `export class Example {
  method(): string {
    return 'hello';
  }
}`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      await assertFileExists(path.join(tempDir, 'repograph.md'));
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('Example');
    });

    it('should accept custom output path', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const outputPath = path.join(tempDir, 'custom-output.md');
      const result = await runCLI([tempDir, '--output', outputPath]);

      expect(result.exitCode).toBe(0);
      await assertFileExists(outputPath);
    });

    it('should accept include patterns', async () => {
      const files = {
        'src/index.ts': 'export const ts = true;',
        'src/index.js': 'export const js = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).not.toContain('src/index.js');
    });

    it('should accept ignore patterns', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'src/test.spec.ts': 'test code'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ignore', '**/*.spec.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).not.toContain('src/test.spec.ts');
    });

    it('should accept ranking strategy option', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ranking-strategy', 'git-changes'
      ]);

      expect(result.exitCode).toBe(0);
      await assertFileExists(path.join(tempDir, 'repograph.md'));
    });

    it('should accept no-gitignore flag', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'dist/index.js': 'compiled code'
      };
      await createTestFiles(tempDir, files);
      await createGitignore(tempDir, ['dist/']);

      const result = await runCLI([
        tempDir,
        '--no-gitignore'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('dist/index.js');
    });

    it('should show help when --help flag is used', async () => {
      const result = await runCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Options:');
    });

    it('should show version when --version flag is used', async () => {
      const result = await runCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent directory', async () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      const result = await runCLI([nonExistentDir]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Error');
    });

    it('should handle invalid output directory', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const invalidOutput = '/root/cannot-write-here.md';
      const result = await runCLI([
        tempDir,
        '--output', invalidOutput
      ]);

      expect(result.exitCode).not.toBe(0);
    });

    it('should handle invalid ranking strategy', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ranking-strategy', 'invalid-strategy'
      ]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Invalid ranking strategy');
    });

    it('should handle malformed include patterns gracefully', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '[invalid-pattern'
      ]);

      // Should not crash, but might produce empty output
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Multiple Arguments', () => {
    it('should handle multiple include patterns', async () => {
      const files = {
        'src/index.ts': 'export const ts = true;',
        'lib/utils.js': 'export const js = true;',
        'docs/readme.md': '# Documentation'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts',
        '--include', '**/*.js'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).toContain('lib/utils.js');
      expect(content).not.toContain('docs/readme.md');
    });

    it('should handle multiple ignore patterns', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'src/test.spec.ts': 'test code',
        'src/utils.test.ts': 'test utils',
        'src/helper.ts': 'helper code'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ignore', '**/*.spec.ts',
        '--ignore', '**/*.test.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).toContain('src/helper.ts');
      expect(content).not.toContain('src/test.spec.ts');
      expect(content).not.toContain('src/utils.test.ts');
    });
  });

  describe('Output Customization Flags', () => {
    beforeEach(async () => {
      const files = {
        'src/index.ts': `import { helper, another, onemore } from './utils.js';
export function main() { helper(); another(); onemore(); }`,
        'src/utils.ts': `export function helper() {}
export function another() {}
export function onemore() {}`
      };
      await createTestFiles(tempDir, files);
    });
    
    const flagTestCases = [
      { name: 'no-header', args: ['--no-header'], notToContain: '# RepoGraph' },
      { name: 'no-overview', args: ['--no-overview'], notToContain: '## 🚀 Project Overview' },
      { name: 'no-mermaid', args: ['--no-mermaid'], notToContain: '```mermaid' },
      { name: 'no-file-list', args: ['--no-file-list'], notToContain: '### Top 10 Most Important Files' },
      { name: 'no-symbol-details', args: ['--no-symbol-details'], notToContain: '## 📂 File & Symbol Breakdown' },
      { name: 'top-file-count', args: ['--top-file-count', '1'], toContain: '### Top 1 Most Important Files' },
      { name: 'file-section-separator', args: ['--file-section-separator', '***'], toContain: '\n***\n\n' },
      { name: 'no-symbol-relations', args: ['--no-symbol-relations'], notToContain: '(calls' },
      { name: 'no-symbol-line-numbers', args: ['--no-symbol-line-numbers'], notToContain: '_L2_' },
      { name: 'no-symbol-snippets', args: ['--no-symbol-snippets'], notToContain: '```typescript' },
      { name: 'max-relations-to-show', args: ['--max-relations-to-show', '1'], toContain: 'calls `helper`...', notToContain: '`another`' },
    ];

    it.each(flagTestCases)('should handle flag $name', async ({ args, toContain, notToContain }) => {
      await runCLI([tempDir, ...args]);
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      if (toContain) {
        expect(content).toContain(toContain);
      }
      if (notToContain) {
        expect(content).not.toContain(notToContain);
      }
    });
  });

  describe('Output Validation', () => {
    it('should generate valid markdown structure', async () => {
      const files = {
        'src/calculator.ts': `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}`,
        'src/logger.ts': `export class Logger {
  log(message: string): void {
    console.log(message);
  }
}`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      
      // Check markdown structure
      expect(content).toContain('# RepoGraph');
      expect(content).toContain('## 🚀 Project Overview');
      expect(content).toContain('### Module Dependency Graph');
      expect(content).toContain('### Top 10 Most Important Files');
      expect(content).toContain('## 📂 File & Symbol Breakdown');
      
      // Check Mermaid graph
      expect(containsValidMermaid(content)).toBe(true);
      
      // Check symbol details
      expect(content).toContain('Calculator');
      expect(content).toContain('Logger');
    });

    it('should handle projects with complex dependencies', async () => {
      const files = {
        'src/index.ts': `import { Database } from './database.js';
import { ApiServer } from './api.js';

export class App {
  constructor(
    private db: Database,
    private api: ApiServer
  ) {}
}`,
        'src/database.ts': `export class Database {
  connect(): Promise<void> {
    return Promise.resolve();
  }
}`,
        'src/api.ts': `import { Database } from './database.js';

export class ApiServer {
  constructor(private db: Database) {}
}`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('App');
      expect(content).toContain('Database');
      expect(content).toContain('ApiServer');
      expect(containsValidMermaid(content)).toBe(true);
    });
  });

  describe('Integration with Fixtures', () => {
    it('should process sample-project fixture via CLI', async () => {
      const fixture = await loadFixture('sample-project');
      await createProjectFromFixture(tempDir, fixture);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('Calculator');
      expect(content).toContain('Logger');
      expect(content).toContain('AdvancedCalculator');
    });

    it('should process complex-project fixture via CLI', async () => {
      const fixture = await loadFixture('complex-project');
      await createProjectFromFixture(tempDir, fixture);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts',
        '--ranking-strategy', 'pagerank'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('Database');
      expect(content).toContain('ApiServer');
      expect(content).toContain('UserService');
    });

    it('should handle minimal-project fixture via CLI', async () => {
      const fixture = await loadFixture('minimal-project');
      await createProjectFromFixture(tempDir, fixture);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('src/main.ts');
      expect(content).toContain('hello');
      expect(content).toContain('greet');
    });
  });

  describe('Performance', () => {
    it('should handle moderately large projects in reasonable time', async () => {
      // Create a project with many files
      const files: Record<string, string> = {};
      
      for (let i = 0; i < 30; i++) {
        files[`src/module${i}.ts`] = `export class Module${i} {
  process(): string {
    return 'module${i}';
  }
}`;
      }

      // Add some imports
      files['src/index.ts'] = Array.from({ length: 30 }, (_, i) => 
        `import { Module${i} } from './module${i}.js';`
      ).join('\n') + '\n\nexport const modules = [' + 
      Array.from({ length: 30 }, (_, i) => `Module${i}`).join(', ') + '];';

      await createTestFiles(tempDir, files);

      const startTime = Date.now();
      const result = await runCLI([tempDir]);
      const endTime = Date.now();

      expect(result.exitCode).toBe(0);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('Module0');
      expect(content).toContain('Module29');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should work with TypeScript project structure', async () => {
      const files = {
        'package.json': JSON.stringify({
          name: 'my-project',
          version: '1.0.0',
          type: 'module',
          scripts: {
            build: 'tsc',
            test: 'bun test'
          }
        }, null, 2),
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            outDir: './dist'
          }
        }, null, 2),
        'src/index.ts': `export { Calculator } from './lib/calculator.js';
export type { CalculatorOptions } from './types.js';`,
        'src/lib/calculator.ts': `import type { CalculatorOptions } from '../types.js';

export class Calculator {
  constructor(private options: CalculatorOptions) {}
  
  calculate(expression: string): number {
    return eval(expression);
  }
}`,
        'src/types.ts': `export interface CalculatorOptions {
  precision: number;
  mode: 'strict' | 'loose';
}`,
        'README.md': '# My Calculator Project'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', 'src/**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('Calculator');
      expect(content).toContain('CalculatorOptions');
      expect(content).not.toContain('package.json');
      expect(content).not.toContain('README.md');
    });

    it('should work with monorepo structure', async () => {
      const files = {
        'packages/core/src/index.ts': `export { Engine } from './engine.js';`,
        'packages/core/src/engine.ts': `export class Engine {
  start(): void {
    console.log('Engine started');
  }
}`,
        'packages/ui/src/index.ts': `export { Component } from './component.js';`,
        'packages/ui/src/component.ts': `import { Engine } from '../../core/src/engine.js';

export class Component {
  private engine = new Engine();
  
  render(): void {
    this.engine.start();
  }
}`,
        'apps/web/src/main.ts': `import { Component } from '../../../packages/ui/src/component.js';

const component = new Component();
component.render();`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('Engine');
      expect(content).toContain('Component');
      expect(content).toContain('packages/core/src/engine.ts');
      expect(content).toContain('packages/ui/src/component.ts');
      expect(content).toContain('apps/web/src/main.ts');
    });

    it('should respect gitignore in real project', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'src/utils.ts': 'export const util = true;',
        'dist/index.js': 'compiled code',
        'node_modules/package/index.js': 'dependency',
        'coverage/lcov.info': 'coverage data',
        '.env': 'SECRET=value',
        'logs/app.log': 'log content'
      };
      await createTestFiles(tempDir, files);
      await createGitignore(tempDir, [
        'dist/',
        'node_modules/',
        'coverage/',
        '.env',
        'logs/'
      ]);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).toContain('src/utils.ts');
      expect(content).not.toContain('dist/index.js');
      expect(content).not.toContain('node_modules/package/index.js');
      expect(content).not.toContain('coverage/lcov.info');
      expect(content).not.toContain('.env');
      expect(content).not.toContain('logs/app.log');
    });
  });
});
````

## File: repograph/test/unit/high-level.test.ts
````typescript
import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { generateMap } from '../../src/high-level.js';
import type { RepoGraphOptions } from '../../src/types.js';
import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
  assertFileExists,
  readFile,
  isValidMarkdown
} from '../test.util.js';
import path from 'node:path';

describe('High-Level API', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('generateMap()', () => {
    it('should be a function', () => {
      expect(typeof generateMap).toBe('function');
    });

    it('should accept RepoGraphOptions parameter', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'test.md')
      };

      await generateMap(options);
      // If we get here without throwing, the test passes
    });

    it('should use default values for missing options', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const originalCwd = process.cwd();
      
      try {
        process.chdir(tempDir);
        await generateMap();
        await assertFileExists(path.join(tempDir, 'repograph.md'));
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should validate ranking strategy option', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'test.md'),
        rankingStrategy: 'invalid-strategy' as any
      };

      await expect(generateMap(options)).rejects.toThrow('Invalid ranking strategy');
    });

    it('should accept valid ranking strategies', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const pageRankOptions: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'pagerank.md'),
        rankingStrategy: 'pagerank'
      };

      const gitOptions: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'git.md'),
        rankingStrategy: 'git-changes'
      };

      await generateMap(pageRankOptions);
      await generateMap(gitOptions);
      // If we get here without throwing, the test passes
    });

    it('should pass through all options to pipeline', async () => {
      const files = {
        'src/index.ts': 'export const ts = true;',
        'src/index.js': 'export const js = true;',
        'src/test.spec.ts': 'test code'
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'filtered.md'),
        include: ['**/*.ts'],
        ignore: ['**/*.spec.ts'],
        noGitignore: true,
        rankingStrategy: 'pagerank',
        rendererOptions: {
          customHeader: '# Custom Header',
          includeMermaidGraph: false,
          includeSymbolDetails: false
        }
      };

      await generateMap(options);

      const content = await readFile(path.join(tempDir, 'filtered.md'));
      expect(content).toStartWith('# Custom Header');
      expect(content).toContain('src/index.ts');
      expect(content).not.toContain('src/index.js');
      expect(content).not.toContain('src/test.spec.ts');
      expect(content).not.toContain('```mermaid');
    });

    it('should handle relative paths correctly', async () => {
      const files = {
        'project/src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const projectDir = path.join(tempDir, 'project');
      const relativePath = path.relative(process.cwd(), projectDir);

      const options: RepoGraphOptions = {
        root: relativePath,
        output: path.join(tempDir, 'relative.md')
      };

      await generateMap(options);
      await assertFileExists(path.join(tempDir, 'relative.md'));
    });

    it('should create output directory if it does not exist', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const nestedOutput = path.join(tempDir, 'nested', 'deep', 'output.md');
      
      const options: RepoGraphOptions = {
        root: tempDir,
        output: nestedOutput
      };

      await generateMap(options);
      await assertFileExists(nestedOutput);
    });

    it('should handle empty projects gracefully', async () => {
      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'empty.md')
      };

      await generateMap(options);

      const content = await readFile(path.join(tempDir, 'empty.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('This repository contains 0 nodes (0 files)');
    });

    it('should handle projects with only non-code files', async () => {
      const files = {
        'README.md': '# Project',
        'package.json': '{"name": "test"}',
        'LICENSE': 'MIT License'
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'non-code.md'),
        include: ['**/*.ts', '**/*.js'] // Only include code files
      };

      await generateMap(options);

      const content = await readFile(path.join(tempDir, 'non-code.md'));
      expect(content).toContain('This repository contains 0 nodes (0 files)');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-existent root directory', async () => {
      const options: RepoGraphOptions = {
        root: path.join(tempDir, 'non-existent'),
        output: path.join(tempDir, 'error.md')
      };

      await expect(generateMap(options)).rejects.toThrow();
    });

    it('should throw error for invalid output path', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: '/root/cannot-write-here.md'
      };

      await expect(generateMap(options)).rejects.toThrow();
    });

    it('should handle malformed include patterns gracefully', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'malformed.md'),
        include: ['[invalid-pattern']
      };

      // Should not throw, but may result in empty output
      await generateMap(options);
    });

    it('should validate renderer options', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'test.md'),
        rendererOptions: {
          customHeader: '', // Empty header should be handled
          includeMermaidGraph: true,
          includeSymbolDetails: true
        }
      };

      await generateMap(options);
    });
  });

  describe('Option Validation', () => {
    it('should accept all valid RepoGraphOptions properties', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const completeOptions: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'complete.md'),
        include: ['**/*.ts'],
        ignore: ['**/*.spec.ts'],
        noGitignore: false,
        rankingStrategy: 'pagerank',
        rendererOptions: {
          customHeader: '# Test Project',
          includeMermaidGraph: true,
          includeSymbolDetails: true
        }
      };

      await generateMap(completeOptions);
    });

    it('should handle partial options correctly', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const minimalOptions: RepoGraphOptions = {
        root: tempDir
      };

      await generateMap(minimalOptions);
    });

    it('should handle empty options object', async () => {
      const originalCwd = process.cwd();
      
      try {
        process.chdir(tempDir);
        
        const files = {
          'src/test.ts': 'export const test = true;'
        };
        await createTestFiles(tempDir, files);

        await generateMap({});
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Integration with Components', () => {
    it('should use default pipeline components', async () => {
      const files = {
        'src/calculator.ts': `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}`,
        'src/index.ts': `import { Calculator } from './calculator.js';
export { Calculator };`
      };
      await createTestFiles(tempDir, files);

      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'default-components.md')
      };

      await generateMap(options);

      const content = await readFile(path.join(tempDir, 'default-components.md'));
      
      // Should contain results from all pipeline stages
      expect(content).toContain('Calculator'); // From analysis
      expect(content).toContain('```mermaid'); // From rendering
      expect(content).toContain('src/calculator.ts'); // From discovery
    });

    it('should work with different ranking strategies', async () => {
      const files = {
        'src/hub.ts': 'export class Hub {}',
        'src/a.ts': `import { Hub } from './hub.js';`,
        'src/b.ts': `import { Hub } from './hub.js';`
      };
      await createTestFiles(tempDir, files);

      const pageRankOptions: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'pagerank.md'),
        rankingStrategy: 'pagerank'
      };

      const gitOptions: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'git.md'),
        rankingStrategy: 'git-changes'
      };

      await generateMap(pageRankOptions);
      await generateMap(gitOptions);

      const pageRankContent = await readFile(path.join(tempDir, 'pagerank.md'));
      const gitContent = await readFile(path.join(tempDir, 'git.md'));

      expect(isValidMarkdown(pageRankContent)).toBe(true);
      expect(isValidMarkdown(gitContent)).toBe(true);
      
      // Both should contain the same files but potentially different rankings
      expect(pageRankContent).toContain('Hub');
      expect(gitContent).toContain('Hub');
    });
  });

  describe('Performance', () => {
    it('should handle reasonable project sizes efficiently', async () => {
      const files: Record<string, string> = {};
      
      // Create 20 files with some dependencies
      for (let i = 0; i < 20; i++) {
        files[`src/module${i}.ts`] = `export class Module${i} {
  getValue(): number {
    return ${i};
  }
}`;
      }

      // Add an index file that imports everything
      files['src/index.ts'] = Array.from({ length: 20 }, (_, i) => 
        `import { Module${i} } from './module${i}.js';`
      ).join('\n');

      await createTestFiles(tempDir, files);

      const startTime = Date.now();
      
      const options: RepoGraphOptions = {
        root: tempDir,
        output: path.join(tempDir, 'performance.md')
      };

      await generateMap(options);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      const content = await readFile(path.join(tempDir, 'performance.md'));
      expect(content).toContain('Module0');
      expect(content).toContain('Module19');
    });
  });
});
````
