import { analyzeProject } from 'repograph';
import type { RankedCodeGraph, RepoGraphOptions } from 'repograph';
import { serializeGraph as coreSerializeGraph } from 'scn-ts-core';
import { readFileSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';

export interface ScnTsConfig {
  /**
   * The root directory of the project to analyze. Defaults to the current working directory.
   * Not used if `files` is provided.
   */
  root?: string;
  /**
   * Glob patterns for files to include. Required if `files` is not provided.
   */
  include?: string[];
  /** Glob patterns for files to exclude. */
  exclude?: string[];
  /**
   * For browser or in-memory usage, provide file contents directly. This will
   * bypass all file-system operations (`root`, `include`, `exclude`).
   */
  files?: readonly { path: string; content: string }[];
  /** Path to the project's tsconfig.json. (Not currently used by repograph) */
  project?: string;
  /**
   * The maximum number of parallel workers to use for analysis.
   * When set to 1, analysis runs in the main thread without workers.
   * For faster test execution, use higher values (e.g., 4-8).
   * @default 1
   */
  maxWorkers?: number;
  /** (Future) An array of language parser plugins. */
  // plugins?: unknown[];
}

/**
 * High-level API to generate an SCN context map from a project.
 *
 * This function orchestrates the entire process:
 * 1. Invokes `repograph` to analyze the codebase and build a `RankedCodeGraph`.
 * 2. Serializes the resulting graph into the SCN text format.
 *
 * @param config - The configuration specifying which files to analyze.
 * @returns A promise that resolves to the SCN map as a string.
 */
export const generateScn = async (config: ScnTsConfig): Promise<string> => {
  const sourceFileCache = new Map<string, string>();
  const getSourceContent = (filePath: string): string | undefined => {
    const rootDir = config.root || process.cwd();
    const fullPath = isAbsolute(filePath) ? filePath : join(rootDir, filePath);
    
    if (sourceFileCache.has(fullPath)) {
      return sourceFileCache.get(fullPath);
    }
    try {
      const content = readFileSync(fullPath, 'utf-8');
      sourceFileCache.set(fullPath, content);
      return content;
    } catch {
      sourceFileCache.set(fullPath, ''); // Cache failure
      return undefined;
    }
  };

  // 1. repograph analyzes the project and returns a structured graph.
  const repoGraphOptions: RepoGraphOptions = {
    root: config.root,
    include: config.include,
    ignore: config.exclude,
    maxWorkers: config.maxWorkers,
    files: config.files,
  };
  const graph: RankedCodeGraph = await analyzeProject(repoGraphOptions);

  // 2. scn-ts serializes that graph into the SCN text format.
  const scnOutput = coreSerializeGraph(graph, { getSourceContent });
  return scnOutput;
};

// Low-level API for composition
export { serializeGraph } from 'scn-ts-core';

// Re-export from repograph for advanced users
export {
  // High-Level API
  analyzeProject,
  generateMap,
  // Low-Level API
  createMapGenerator,
  // Pipeline component factories
  createDefaultDiscoverer,
  createTreeSitterAnalyzer,
  createPageRanker,
  createGitRanker,
  createMarkdownRenderer,
  // Logger utilities
  logger,
  initializeParser,
} from 'repograph';

// Re-export types from repograph
export type {
  // Core types
  FileContent,
  CodeNode,
  CodeNodeType,
  CodeNodeVisibility,
  CodeEdge,
  CodeGraph,
  RankedCodeGraph,
  RepoGraphMap,
  RepoGraphOptions,
  RendererOptions,
  FileDiscoverer,
  CssIntent,
  Analyzer,
  Ranker,
  Renderer,
  // Logger types
  Logger,
  LogLevel,
} from 'repograph';