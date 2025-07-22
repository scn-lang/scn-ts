import { describe, it, expect, afterEach } from 'bun:test';
import { setupTestProject, type TestProject } from '../../test.util';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { version } from '../../../package.json';

// Path to the CLI script in the main workspace
const CLI_PATH = resolve(process.cwd(), 'src/cli.ts');

describe('SCN Generation: 3. Command-Line Interface (CLI)', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should process glob patterns provided as arguments and print to stdout', async () => {
    project = await setupTestProject({
      'a.ts': 'export const A = 1;',
      'b.ts': 'export const B = 2;',
    });
    
    const proc = Bun.spawn(['bun', 'run', CLI_PATH, 'a.ts'], {
      cwd: project.projectDir,
      stderr: 'pipe',
      stdout: 'pipe',
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;
    const exitCode = proc.exitCode;

    expect(exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
    expect(stdout).not.toContain('b.ts');
    expect(stderr).toContain('[SCN-TS] Analyzing project...');
  });
  
  it('should write the output to the file specified by --output', async () => {
    project = await setupTestProject({ 'a.ts': 'export const A = 1;' });
    const outputPath = join(project.projectDir, 'output.scn');

    const proc = Bun.spawn(['bun', 'run', CLI_PATH, 'a.ts', '--output', outputPath], {
      cwd: project.projectDir,
    });
    
    await proc.exited;
    
    const outputContent = await readFile(outputPath, 'utf-8');
    expect(outputContent).toContain('§ (1) a.ts');
  });

  it('should respect the tsconfig file specified by --project', async () => {
    project = await setupTestProject({
      'Comp.tsx': 'export const C = () => <div />',
      'tsconfig.test.json': JSON.stringify({ compilerOptions: { jsx: 'react-jsx' } }),
    });

    const proc = Bun.spawn(['bun', 'run', CLI_PATH, 'Comp.tsx', '-p', 'tsconfig.test.json'], {
      cwd: project.projectDir,
    });
    
    const stdout = await new Response(proc.stdout).text();
    await proc.exited;
    expect(proc.exitCode).toBe(0);
    expect(stdout).toContain('◇ (1.1) C');
  });

  it('should display the correct version with --version', async () => {
    const proc = Bun.spawn(['bun', 'run', CLI_PATH, '--version']);
    const stdout = await new Response(proc.stdout).text();
    expect(stdout.trim()).toBe(version);
  });
  
  it('should display the help screen with --help', async () => {
    const proc = Bun.spawn(['bun', 'run', CLI_PATH, '--help']);
    const stdout = await new Response(proc.stdout).text();
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('--output <path>');
  });
  
  it('should exit with a non-zero code on error', async () => {
    project = await setupTestProject({}); // Empty project
    
    // Test with no input files specified - this should trigger the error
    const proc = Bun.spawn(['bun', 'run', CLI_PATH], {
      cwd: project.projectDir,
      stderr: 'pipe',
      stdout: 'pipe',
    });

    const stderr = await new Response(proc.stderr).text();
    await proc.exited;
    const exitCode = proc.exitCode;
    
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Error: No input files specified');
  });
});