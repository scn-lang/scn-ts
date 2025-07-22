import { analyzeProject } from 'repograph';
import type { RankedCodeGraph, RepoGraphOptions } from 'repograph';
import { serializeGraph } from './serializer';

/**
 * Configuration options for generating an SCN map.
 * These options are passed to the underlying `repograph` engine.
 */
export interface ScnTsConfig {
  /** The root directory of the project to analyze. Defaults to the current working directory. */
  root?: string;
  /** Glob patterns for files to include. */
  include: string[];
  /** Glob patterns for files to exclude. */
  exclude?: string[];
  /** Path to the project's tsconfig.json, used by `repograph` for type analysis. */
  project?: string;
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
  // 1. repograph analyzes the project and returns a structured graph.
  const repoGraphOptions: RepoGraphOptions = {
    root: config.root,
    include: config.include,
    ignore: config.exclude,
    project: config.project,
    // We can set other repograph options here if needed, e.g. rankingStrategy
  };
  const graph: RankedCodeGraph = await analyzeProject(repoGraphOptions);

  // 2. scn-ts serializes that graph into the SCN text format.
  const scnOutput = serializeGraph(graph, config.root);
  return scnOutput;
};
