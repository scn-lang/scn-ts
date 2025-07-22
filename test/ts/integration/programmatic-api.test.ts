import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { serializeGraph } from '../../../src/serializer';
import { setupTestProject, type TestProject } from '../../test.util';
import type { RankedCodeGraph, CodeNode, CodeEdge as RepographEdge } from 'repograph';
import { rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

// Re-define the extended edge type used internally by the serializer
type CodeEdge = Omit<RepographEdge, 'type'> & { type: RepographEdge['type'] | 'contains' | 'references' };

describe('SCN Generation: 2. Programmatic API', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });
  
  describe('2.1 High-Level API (generateScn)', () => {
    it('should generate a valid SCN string given a set of include globs', async () => {
      project = await setupTestProject({
        'a.ts': `export const A = 1;`,
        'b.ts': `export const B = 2;`,
      });

      const scn = await generateScn({ root: project.projectDir, include: ['a.ts'] });
      expect(scn).toContain('§ (1) a.ts');
      expect(scn).not.toContain('b.ts');
    });

    it('should respect exclude patterns', async () => {
      project = await setupTestProject({
        'a.ts': `export const A = 1;`,
        'b.ignore.ts': `export const B = 2;`,
      });

      const scn = await generateScn({
        root: project.projectDir,
        include: ['**/*.ts'],
        exclude: ['**/*.ignore.ts'],
      });
      expect(scn).toContain('§ (1) a.ts');
      expect(scn).not.toContain('b.ignore.ts');
    });

    it('should use the project tsconfig path for better type analysis', async () => {
      project = await setupTestProject({
        'Button.tsx': `export const Button = () => <button>Click</button>;`,
        'tsconfig.json': JSON.stringify({
            "compilerOptions": { "jsx": "react-jsx" },
        }),
      });

      const scn = await generateScn({
        root: project.projectDir,
        include: ['**/*.tsx'],
        project: 'tsconfig.json',
      });
      
      // Correct parsing of JSX depends on tsconfig.json
      expect(scn).toContain('§ (1) Button.tsx');
      expect(scn).toContain('+ ◇ (1.2) Button');
      expect(scn).toContain('⛶ (1.3) button');
    });

    it('should return an empty string for globs that match no files', async () => {
      project = await setupTestProject({
        'a.ts': `export const A = 1;`,
      });
      const scn = await generateScn({ root: project.projectDir, include: ['**/*.js'] });
      expect(scn).toBe('');
    });

    it('should throw an error for non-existent root directory', async () => {
        const nonExistentDir = join(tmpdir(), 'scn-ts-non-existent-dir-test');
        await rm(nonExistentDir, { recursive: true, force: true }).catch(() => {});
        
        const promise = generateScn({ root: nonExistentDir, include: ['**/*.ts'] });
        
        // repograph is expected to throw when the root path does not exist.
        await expect(promise).rejects.toThrow();
    });
  });

  describe('2.2 Low-Level API (serializeGraph)', () => {
    it('should serialize a resolved graph into spec-compliant SCN string', () => {
        const fileNodeA: CodeNode = { id: 'file-a', filePath: 'a.ts', type: 'file', name: 'a.ts', startLine: 1, endLine: 1, codeSnippet: '', };
        const funcNodeA: CodeNode = { id: 'func-a', filePath: 'a.ts', type: 'function', name: 'funcA', visibility: 'public', startLine: 2, endLine: 2, codeSnippet: 'function funcA()', };
        const fileNodeB: CodeNode = { id: 'file-b', filePath: 'b.ts', type: 'file', name: 'b.ts', startLine: 1, endLine: 1, codeSnippet: '', };
        const funcNodeB: CodeNode = { id: 'func-b', filePath: 'b.ts', type: 'function', name: 'funcB', visibility: 'public', startLine: 2, endLine: 2, codeSnippet: 'function funcB()', };

        const nodes = new Map<string, CodeNode>([
            [fileNodeA.id, fileNodeA],
            [funcNodeA.id, funcNodeA],
            [fileNodeB.id, fileNodeB],
            [funcNodeB.id, funcNodeB],
        ]);
        
        const edges: CodeEdge[] = [
            // File A imports File B
            { fromId: 'file-a', toId: 'file-b', type: 'imports' },
            // funcA calls funcB
            { fromId: 'func-a', toId: 'func-b', type: 'references' },
        ];

        const ranks = new Map<string, number>([
            [fileNodeA.id, 0],
            [funcNodeA.id, 0],
            [fileNodeB.id, 0],
            [funcNodeB.id, 0],
        ]);
        const graph: RankedCodeGraph = { nodes, edges: edges as any, ranks };

        const scnOutput = serializeGraph(graph);
        
        const expectedScn = [
            '§ (1) a.ts\n  -> (2.0)\n  + ~ (1.1) funcA()\n    -> (2.1)',
            '§ (2) b.ts\n  <- (1.0)\n  + ~ (2.1) funcB()\n    <- (1.1)'
        ].join('\n\n');
        
        expect(scnOutput).toBe(expectedScn);
    });
  });
});