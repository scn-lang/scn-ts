import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname } from 'path';

export interface TestProject {
  projectDir: string;
  cleanup: () => Promise<void>;
}

export async function setupTestProject(files: Record<string, string>): Promise<TestProject> {
  const projectDir = await mkdtemp(join(tmpdir(), 'scn-test-'));

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = join(projectDir, relativePath);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, 'utf-8');
  }

  const cleanup = async () => {
    await rm(projectDir, { recursive: true, force: true });
  };

  return { projectDir, cleanup };
}