import { describe, it, expect, afterEach } from 'bun:test';
import { setupTestProject, type TestProject } from '../../test.util';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';

// Path to the CLI script in the main workspace
const CLI_PATH = resolve(process.cwd(), 'src/cli.ts');

describe('SCN Generation: 4. Configuration (scn.config.js)', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });
  
  it('should automatically find and load scn.config.js from the project root', async () => {
    project = await setupTestProject({
      'a.ts': 'const a = 1;',
      'b.ts': 'const b = 2;',
      'scn.config.js': `export default { include: ['a.ts'] };`,
    });
    
    const proc = Bun.spawn(['bun', 'run', CLI_PATH], { 
      cwd: project.projectDir,
      stderr: 'pipe',
      stdout: 'pipe',
    });
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;
    
    expect(proc.exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
    expect(stdout).not.toContain('b.ts');
  });
  
  it('should correctly apply `exclude` patterns from the config', async () => {
    project = await setupTestProject({
      'a.ts': 'const a = 1;',
      'b.ignore.ts': 'const b = 2;',
      'scn.config.js': `export default { include: ['**/*.ts'], exclude: ['**/*.ignore.ts'] };`,
    });
    
    const proc = Bun.spawn(['bun', 'run', CLI_PATH], { 
      cwd: project.projectDir,
      stderr: 'pipe',
      stdout: 'pipe',
    });
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;
    
    expect(proc.exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
    expect(stdout).not.toContain('b.ignore.ts');
  });

  it('should write to the `output` path specified in the config', async () => {
    const outputPath = 'dist/output.scn';
    project = await setupTestProject({
      'a.ts': 'const a = 1;',
      'scn.config.js': `import {mkdirSync} from 'fs'; mkdirSync('dist'); export default { include: ['a.ts'], output: '${outputPath}' };`,
    });
    
    const proc = Bun.spawn(['bun', 'run', CLI_PATH], { 
      cwd: project.projectDir,
      stderr: 'pipe',
      stdout: 'pipe',
    });
    await proc.exited;

    expect(proc.exitCode).toBe(0);
    const outputContent = await readFile(join(project.projectDir, outputPath), 'utf-8');
    expect(outputContent).toContain('§ (1) a.ts');
  });

  it('should override config file settings with CLI flags', async () => {
    const configOutputPath = 'config-output.scn';
    const cliOutputPath = 'cli-output.scn';
    
    project = await setupTestProject({
      'a.ts': 'const a = 1;',
      'b.ts': 'const b = 2;',
      'scn.config.js': `export default { include: ['a.ts'], output: '${configOutputPath}' };`,
    });
    
    // Override both `include` and `output`
    const proc = Bun.spawn(['bun', 'run', CLI_PATH, 'b.ts', '-o', cliOutputPath], {
      cwd: project.projectDir,
      stderr: 'pipe',
      stdout: 'pipe',
    });
    await proc.exited;

    expect(proc.exitCode).toBe(0);

    // Check that the CLI output path was used and has the correct content
    const cliOutputContent = await readFile(join(project.projectDir, cliOutputPath), 'utf-8');
    expect(cliOutputContent).toContain('§ (1) b.ts');
    expect(cliOutputContent).not.toContain('a.ts');

    // Check that the config output path was NOT created
    await expect(readFile(join(project.projectDir, configOutputPath), 'utf-8')).rejects.toThrow();
  });

  it('should respect the config file specified by --config or -c', async () => {
    project = await setupTestProject({
      'a.ts': 'const a = 1;',
      'config/my.config.js': `export default { include: ['a.ts'] };`,
    });
    
    const proc = Bun.spawn(['bun', 'run', CLI_PATH, '-c', 'config/my.config.js'], { 
      cwd: project.projectDir,
      stderr: 'pipe',
      stdout: 'pipe',
    });
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;
    
    expect(proc.exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
  });
});