import { describe, it, expect, afterEach } from 'bun:test';
import { setupTestProject, type TestProject } from '../../test.util';
import { readFile, writeFile, rm } from 'fs/promises';
import { join, resolve } from 'path';

const CLI_PATH = resolve(process.cwd(), 'dist/cli.js');

// Helper to wait for a file to contain specific content
async function waitForFileContent(filePath: string, expectedContent: string, timeout = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const content = await readFile(filePath, 'utf-8');
      if (content.includes(expectedContent)) {
        return;
      }
    } catch {
      // File might not exist yet
    }
    await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms
  }
  throw new Error(`Timeout waiting for "${expectedContent}" in ${filePath}`);
}

describe('SCN Generation: 5. File System & Watch Mode', () => {
  let project: TestProject | undefined;
  let watcherProc: ReturnType<typeof Bun.spawn> | undefined;

  afterEach(async () => {
    if (watcherProc) {
      watcherProc.kill();
      watcherProc = undefined;
    }
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('--watch: should perform an initial scan and re-generate when a file is modified', async () => {
    project = await setupTestProject({
      'a.ts': 'export const A = 1;',
    });
    const outputPath = join(project.projectDir, 'output.scn');

    watcherProc = Bun.spawn(['bun', CLI_PATH, '--watch', '-o', outputPath, '**/*.ts'], {
      cwd: project.projectDir,
    });

    // 1. Wait for initial generation
    await waitForFileContent(outputPath, 'A = 1');
    const initialContent = await readFile(outputPath, 'utf-8');
    expect(initialContent).toContain('§ (1) a.ts');
    expect(initialContent).toContain('◇ (1.1) A = 1');
    
    // 2. Modify the file
    await writeFile(join(project.projectDir, 'a.ts'), 'export const A = 42;');

    // 3. Wait for re-generation
    await waitForFileContent(outputPath, 'A = 42');
    const updatedContent = await readFile(outputPath, 'utf-8');
    expect(updatedContent).toContain('◇ (1.1) A = 42');
  });

  it('--watch: should re-generate when a new file matching the glob is added', async () => {
    project = await setupTestProject({
      'a.ts': 'export const A = 1;',
    });
    const outputPath = join(project.projectDir, 'output.scn');

    watcherProc = Bun.spawn(['bun', CLI_PATH, '--watch', '-o', outputPath, '**/*.ts'], {
      cwd: project.projectDir,
    });
    
    // 1. Wait for initial generation
    await waitForFileContent(outputPath, 'a.ts');
    
    // 2. Add a new file
    await writeFile(join(project.projectDir, 'b.ts'), 'export const B = 2;');

    // 3. Wait for re-generation to include the new file
    await waitForFileContent(outputPath, 'b.ts');
    const updatedContent = await readFile(outputPath, 'utf-8');
    expect(updatedContent).toContain('§ (1) a.ts');
    expect(updatedContent).toContain('§ (2) b.ts');
  });

  it('--watch: should re-generate when a tracked file is deleted', async () => {
    project = await setupTestProject({
      'a.ts': 'export const A = 1;',
      'b.ts': 'export const B = 2;',
    });
    const outputPath = join(project.projectDir, 'output.scn');
    const fileToDelete = join(project.projectDir, 'b.ts');

    watcherProc = Bun.spawn(['bun', CLI_PATH, '--watch', '-o', outputPath, '**/*.ts'], {
      cwd: project.projectDir,
    });

    // 1. Wait for initial generation
    await waitForFileContent(outputPath, 'b.ts');
    const initialContent = await readFile(outputPath, 'utf-8');
    expect(initialContent).toContain('b.ts');

    // 2. Delete the file
    await rm(fileToDelete);

    // 3. Wait for re-generation (b.ts should be gone)
    const start = Date.now();
    let contentHasB = true;
    while(contentHasB && Date.now() - start < 5000) {
        const content = await readFile(outputPath, 'utf-8');
        if (!content.includes('b.ts')) {
            contentHasB = false;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    expect(contentHasB).toBe(false);
    const updatedContent = await readFile(outputPath, 'utf-8');
    expect(updatedContent).toContain('a.ts');
    expect(updatedContent).not.toContain('b.ts');
  });

  it('should handle file paths with spaces correctly', async () => {
     project = await setupTestProject({
      'my component.ts': 'export const MyComponent = 1;',
    });
    const outputPath = join(project.projectDir, 'output with spaces.scn');
    
    const proc = Bun.spawn(
      ['bun', CLI_PATH, 'my component.ts', '-o', 'output with spaces.scn'],
      { cwd: project.projectDir }
    );
    await proc.exited;

    expect(proc.exitCode).toBe(0);
    const outputContent = await readFile(outputPath, 'utf-8');
    expect(outputContent).toContain('§ (1) "my component.ts"');
  });
});