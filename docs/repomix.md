# Directory Structure
```
src/
  cli.ts
  index.ts
  serializer.ts
test/
  ts/
    e2e/
      cli.test.ts
      config-file.test.ts
      filesystem.test.ts
    integration/
      css-parsing.test.ts
      dependency-graph.test.ts
      programmatic-api.test.ts
    unit/
      code-entities.test.ts
      general-structural.test.ts
      jsx.test.ts
      qualifiers.test.ts
      type-system.test.ts
  test.util.ts
package.json
tsconfig.json
tsup.config.ts
```

# Files

## File: src/cli.ts
```typescript
import { generateScn, type ScnTsConfig } from './index.js';
import { existsSync, readFileSync, watch } from 'fs';
import { writeFile, readdir, mkdir, copyFile } from 'fs/promises';
import { resolve, relative, dirname, join } from 'path';
import { version } from '../package.json';
import { createRequire } from 'node:module';

interface CliOptions {
  include: string[];
  output?: string;
  project?: string;
  config?: string;
  maxWorkers?: number;
  watch: boolean;
  help: boolean;
  version: boolean;
}

const copyWasmFiles = async (destination: string) => {
  try {
    const require = createRequire(import.meta.url);
    const repographMainPath = require.resolve('repograph');
    const sourceDir = resolve(dirname(repographMainPath), 'wasm');

    if (!existsSync(sourceDir)) {
      console.error(
        `[SCN-TS] Error: Could not find WASM files directory for 'repograph'. Looked in ${sourceDir}. Please check your 'repograph' installation.`,
      );
      process.exit(1);
    }

    await mkdir(destination, { recursive: true });

    const wasmFiles = (await readdir(sourceDir)).filter((file) => file.endsWith('.wasm'));
    if (wasmFiles.length === 0) {
      console.error(
        `[SCN-TS] Error: No WASM files found in ${sourceDir}. This might be an issue with the 'repograph' package installation.`,
      );
      process.exit(1);
    }
    for (const file of wasmFiles) {
      const srcPath = join(sourceDir, file);
      const destPath = join(destination, file);
      await copyFile(srcPath, destPath);
      console.error(`[SCN-TS] Copied ${file} to ${relative(process.cwd(), destPath)}`);
    }
    console.error(`\n[SCN-TS] All ${wasmFiles.length} WASM files copied successfully.`);
  } catch (err) {
    console.error('[SCN-TS] Error copying WASM files.', err);
  }
};

const ARG_CONFIG: Record<string, { key: keyof CliOptions; takesValue: boolean }> = {
  '-o': { key: 'output', takesValue: true },
  '--output': { key: 'output', takesValue: true },
  '-p': { key: 'project', takesValue: true },
  '--project': { key: 'project', takesValue: true },
  '-c': { key: 'config', takesValue: true },
  '--config': { key: 'config', takesValue: true },
  '--max-workers': { key: 'maxWorkers', takesValue: true },
  '--watch': { key: 'watch', takesValue: false },
  '-h': { key: 'help', takesValue: false },
  '--help': { key: 'help', takesValue: false },
  '-v': { key: 'version', takesValue: false },
  '--version': { key: 'version', takesValue: false },
};

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    include: [],
    watch: false,
    help: false,
    version: false,
  };
  const cliArgs = args.slice(2);

  for (let i = 0; i < cliArgs.length; i++) {
    const arg = cliArgs[i];
    if (!arg) continue;
    const config = ARG_CONFIG[arg];
    if (config) {
      if (config.takesValue) {
        const value = cliArgs[++i];
        if (value === undefined) {
          console.error(`Error: Missing value for argument ${arg}`);
          process.exit(1);
        }
        if (config.key === 'maxWorkers') {
          const numValue = parseInt(value, 10);
          if (isNaN(numValue) || numValue < 1) {
            console.error(`Invalid value for --max-workers: ${value}. Must be a positive integer.`);
            process.exit(1);
          }
          (options as any)[config.key] = numValue;
        } else {
          (options as any)[config.key] = value;
        }
      } else {
        (options as any)[config.key] = true;
      }
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    } else {
      options.include.push(arg);
    }
  }

  return options;
}

async function loadConfig(configPath?: string): Promise<Partial<ScnTsConfig> & { output?: string }> {
  const path = resolve(process.cwd(), configPath || 'scn.config.js');
  if (existsSync(path)) {
    try {
      if (path.endsWith('.js')) {
        const configModule = await import(path);
        return configModule.default || configModule;
      }
      if (path.endsWith('.json')) {
         return JSON.parse(readFileSync(path, 'utf-8'));
      }
    } catch (e) {
      console.error(`Error loading config file: ${path}`);
      console.error(e);
      process.exit(1);
    }
  }
  return {};
}

function showHelp() {
  console.log(`
  scn-ts v${version}
  
  Generates a Symbolic Context Notation map from a TypeScript/JavaScript project.

  Usage:
    scn-ts [globs...] [options]
    scn-ts copy-wasm [destination]

  Arguments:
    globs...         Glob patterns specifying files to include.

  Commands:
    [globs...]       (default) Analyze a repository at the given path.
    copy-wasm        Copy Tree-sitter WASM files to a directory for browser usage.

  Arguments:
    globs...         Glob patterns specifying files to include.
    destination      For 'copy-wasm', the destination directory. (default: ./public/wasm)


  Options:
    -o, --output <path>      Path to write the SCN output file. (default: stdout)
    -p, --project <path>     Path to tsconfig.json.
    -c, --config <path>      Path to a config file. (default: scn.config.js)
    --max-workers <num>      Number of parallel workers for analysis. (default: 1)
    --watch                  Watch files for changes and re-generate.
    -v, --version            Display version number.
    -h, --help               Display this help message.
  `);
}

async function run() {
  const cliArgs = process.argv.slice(2);

  if (cliArgs[0] === 'copy-wasm') {
    const destDir = cliArgs[1] || './public/wasm';
    console.error(`[SCN-TS] Copying WASM files to "${resolve(destDir)}"...`);
    await copyWasmFiles(destDir);
    return;
  }
  const cliOptions = parseArgs(process.argv);

  if (cliOptions.version) {
    console.log(version);
    return;
  }
  
  if (cliOptions.help) {
    showHelp();
    return;
  }

  const fileConfig = await loadConfig(cliOptions.config);

  const config: ScnTsConfig = {
    root: process.cwd(),
    include: cliOptions.include.length > 0 ? cliOptions.include : fileConfig.include,
    exclude: fileConfig.exclude,
    project: cliOptions.project || fileConfig.project,
    maxWorkers: cliOptions.maxWorkers || fileConfig.maxWorkers,
  };
  
  const output = cliOptions.output || fileConfig.output;

  if (!config.include || config.include.length === 0) {
    console.error('Error: No input files specified. Provide glob patterns as arguments or in a config file.');
    showHelp();
    process.exit(1);
  }

  const executeGeneration = async () => {
    try {
      console.error(`[SCN-TS] Analyzing project...`);
      const scn = await generateScn(config);
      if (output) {
        await writeFile(output, scn, 'utf-8');
        console.error(`[SCN-TS] SCN map written to ${relative(process.cwd(), output)}`);
      } else {
        console.log(scn);
      }
    } catch (e: any) {
      console.error(`[SCN-TS] Error during generation: ${e.message}`);
      if (!cliOptions.watch) {
         process.exit(1);
      }
    }
  };

  await executeGeneration();
  
  if (cliOptions.watch) {
    console.error('[SCN-TS] Watching for file changes...');
    watch(config.root || process.cwd(), { recursive: true }, async (_eventType, filename) => {
        if (filename) {
            console.error(`[SCN-TS] Change detected in '${filename}'. Re-generating...`);
            await executeGeneration();
        }
    });
  }
}

run().catch(e => {
    console.error(e);
    process.exit(1);
});
```

## File: src/index.ts
```typescript
import { analyzeProject } from 'repograph';
import type { RankedCodeGraph, RepoGraphOptions } from 'repograph';
import { serializeGraph } from './serializer';

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
  // 1. repograph analyzes the project and returns a structured graph.
  const repoGraphOptions: RepoGraphOptions = {
    root: config.root,
    include: config.include,
    ignore: config.exclude,
    maxWorkers: config.maxWorkers,
    files: config.files,
    // We can set other repograph options here if needed, e.g. rankingStrategy
  };
  const graph: RankedCodeGraph = await analyzeProject(repoGraphOptions);

  // 2. scn-ts serializes that graph into the SCN text format.
  const scnOutput = serializeGraph(graph, config.root);
  return scnOutput;
};

// Low-level API for composition
export { serializeGraph };

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
```

## File: src/serializer.ts
```typescript
import type {
  RankedCodeGraph,
  CodeNode,
  CodeEdge as RepographEdge,
  CssIntent,
  CodeNodeType,
} from "repograph";

// Allow for 'contains' and 'references' edges which might be produced by repograph
// but not present in a minimal type definition.
type CodeEdge = Omit<RepographEdge, 'type'> & {
  type: RepographEdge['type'] | 'contains' | 'references';
};
import { readFileSync } from "fs";
import { join } from "path";

type ScnSymbol = "◇" | "~" | "@" | "{}" | "☰" | "=:" | "⛶" | "¶" | "?";
type QualifierSymbol = "+" | "-" | "..." | "!" | "o";
type CssIntentSymbol = "📐" | "✍" | "💧";

const ENTITY_TYPE_TO_SYMBOL: Record<CodeNodeType, ScnSymbol | undefined> = {
  class: '◇',
  function: '~',
  method: '~',
  interface: '{}',
  enum: '☰',
  type: '=:',
  html_element: '⛶',
  css_rule: '¶',
  namespace: '◇',
  struct: '◇',
  property: '@',
  field: '@',
  variable: '@',
  constant: '@',
  arrow_function: '~',
  constructor: '~',
  file: undefined,
  trait: undefined,
  impl: undefined,
  static: undefined,
  union: undefined,
  template: undefined,
};

const CSS_INTENT_TO_SYMBOL: Record<CssIntent, CssIntentSymbol> = {
  layout: '📐',
  typography: '✍',
  appearance: '💧',
};

class ScnIdManager {
  private fileIdCounter = 1;
  private entityIdCounters = new Map<string, number>(); // file path -> counter
  private repographIdToScnId = new Map<string, string>();
  private fileRepoIdToPath = new Map<string, string>();

  constructor(sortedFileNodes: CodeNode[], nodesByFile: Map<string, CodeNode[]>) {
    for (const fileNode of sortedFileNodes) {
      const fileId = `${this.fileIdCounter++}`;
      this.repographIdToScnId.set(fileNode.id, fileId);
      this.fileRepoIdToPath.set(fileNode.id, fileNode.filePath);
      this.entityIdCounters.set(fileNode.filePath, 1);

      const entities = nodesByFile.get(fileNode.filePath) || [];
      entities.sort((a, b) => a.startLine - b.startLine);

      for (const entityNode of entities) {
        const entityCounter = this.entityIdCounters.get(entityNode.filePath)!;
        const entityId = `${fileId}.${entityCounter}`;
        this.repographIdToScnId.set(entityNode.id, entityId);
        this.entityIdCounters.set(entityNode.filePath, entityCounter + 1);
      }
    }
  }

  getScnId(repographId: string): string | undefined {
    return this.repographIdToScnId.get(repographId);
  }

  isFilePath(repographId: string): boolean {
    return this.fileRepoIdToPath.has(repographId);
  }
}

// Cache for source file contents to avoid reading files multiple times
const sourceFileCache = new Map<string, string>();

const getSourceContent = (filePath: string, rootDir?: string): string => {
  const fullPath = rootDir ? join(rootDir, filePath) : filePath;
  if (!sourceFileCache.has(fullPath)) {
    try {
      const content = readFileSync(fullPath, 'utf-8');
      sourceFileCache.set(fullPath, content);
    } catch {
      sourceFileCache.set(fullPath, '');
    }
  }
  return sourceFileCache.get(fullPath) || '';
};

const getVisibilitySymbol = (node: CodeNode, rootDir?: string): '+' | '-' | undefined => {
  if (node.visibility === 'public') return '+';
  if (node.visibility === 'private' || node.visibility === 'protected') return '-';
  if (node.type === 'file') return undefined;

  // Fallback to source-based inference if repograph doesn't provide visibility.
  const source = getSourceContent(node.filePath, rootDir);
  if (!source) return undefined;
  
  const line = (source.split('\n')[node.startLine - 1] || '').trim();

  // For class members, default is public unless explicitly private/protected.
  if (['method', 'property', 'field'].includes(node.type)) {
    return (line.startsWith('private') || line.startsWith('protected')) ? '-' : '+';
  }

  // For other top-level entities, check for an `export` keyword in the source.
  const name = node.name.split('.').pop() || node.name;
  const isExported = [
    // `export const MyVar`, `export class MyClass`, `export default function ...`
    `export\\s+(default\\s+)?(async\\s+)?(class|function|interface|enum|type|const|let|var|namespace)\\s+${name}\\b`,
    // `export { MyVar }`
    `export\\s*\\{[^}]*\\b${name}\\b`,
    // `export default` for anonymous functions/arrow functions
    name === 'default' ? `export\\s+default\\s+` : null,
  ].filter(Boolean).some(p => new RegExp(p!).test(source));

  if (isExported) {
    return '+';
  }

  return undefined;
};

const isComponentNode = (node: CodeNode): boolean =>
  (node.type === 'function' || node.type === 'arrow_function') && /^[A-Z]/.test(node.name);

const getNodeSymbol = (node: CodeNode): ScnSymbol => {
  // Heuristic: Treat PascalCase functions as components (e.g., React)
  if (isComponentNode(node)) {
    return '◇';
  }
  // Heuristic: Treat uppercase constants/variables as containers (module pattern)
  if ((node.type === 'variable' || node.type === 'constant') && /^[A-Z]/.test(node.name)) {
    return '◇';
  }
  return ENTITY_TYPE_TO_SYMBOL[node.type] ?? '?';
};

const getQualifiers = (node: CodeNode, rootDir?: string): { access?: '+' | '-'; others: QualifierSymbol[] } => {
  const access = getVisibilitySymbol(node, rootDir);
  
  const others: QualifierSymbol[] = [];
  
  // Check for async
  const isAsync = node.isAsync || (node.codeSnippet && /\basync\s+/.test(node.codeSnippet));
  if (isAsync) others.push('...');
  
  // Check for throw
  const canThrow = node.canThrow || (node.codeSnippet && /\bthrow\b/.test(node.codeSnippet));
  if (canThrow) others.push('!');
  
  // Check for pure function heuristic
  const isPure = node.isPure || isPureFunction(node, rootDir);
  if (isPure) others.push('o');
  
  return { access, others };
};

const isPureFunction = (node: CodeNode, rootDir?: string): boolean => {
  if (!['function', 'method', 'arrow_function'].includes(node.type)) return false;
  if (!node.codeSnippet) return false;
  
  // Get the full source to analyze the function body
  const source = getSourceContent(node.filePath, rootDir);
  if (!source) return false;
  
  const lines = source.split('\n');
  const startLine = node.startLine - 1;
  const endLine = node.endLine - 1;
  
  if (startLine < 0 || endLine >= lines.length) return false;
  
  const functionBody = lines.slice(startLine, endLine + 1).join('\n');
  
  // Simple heuristics for pure functions
  const impurePatterns = [
    /console\./,
    /document\./,
    /window\./,
    /localStorage/,
    /sessionStorage/,
    /fetch\(/,
    /XMLHttpRequest/,
    /setTimeout/,
    /setInterval/,
    /Math\.random/,
    /Date\(/,
    /new Date/,
    /\.push\(/,
    /\.pop\(/,
    /\.shift\(/,
    /\.unshift\(/,
    /\.splice\(/,
    /\.sort\(/,
    /\.reverse\(/,
    /\+\+/,
    /--/,
    /\w+\s*=\s*(?!.*return)/,
  ];
  
  // If it contains any impure patterns, it's not pure
  if (impurePatterns.some(pattern => pattern.test(functionBody))) {
    return false;
  }
  
  // If it only contains return statements and basic operations, likely pure
  const hasOnlyReturn = /^\s*export\s+(?:async\s+)?function\s+\w+\([^)]*\)(?:\s*:\s*[^{]+)?\s*{\s*return\s+[^;]+;\s*}\s*$/.test(functionBody.replace(/\n/g, ' '));
  
  return hasOnlyReturn;
};

const formatCssIntents = (intents: readonly CssIntent[] = []): string => {
  if (intents.length === 0) return '';
  // Sort intents alphabetically first, then map to symbols
  const sortedIntents = [...intents].sort();
  const symbols = sortedIntents.map(intent => CSS_INTENT_TO_SYMBOL[intent] ?? '');
  return `{ ${symbols.join(' ')} }`;
};

const formatFunctionSignature = (snippet: string): string => {
  // Find parameters part, e.g., (a: string, b: number)
  const paramsMatch = snippet.match(/\(([^)]*)\)/);
  let params = '()';
  if (paramsMatch && paramsMatch[1] !== undefined) {
    // Replace type annotations with #
    const paramContent = paramsMatch[1].replace(/:[^\,)]+/g, ': #');
    params = `(${paramContent})`;
  }

  // Find return type, e.g., ): string
  const returnMatch = snippet.match(/\)\s*:\s*([\w\.<>\[\]\| &]+)/);
  let returnType = '';
  if (returnMatch && returnMatch[1]) {
    const type = returnMatch[1].trim();
    if (type !== 'void' && type !== 'any' && type !== 'unknown') {
       returnType = `: #${type}`;
    }
  }

  return `${params}${returnType}`;
}

const formatJsxAttributes = (snippet: string): string => {
    const attrs = [];
    const idMatch = snippet.match(/id="([^"]+)"/);
    if (idMatch) attrs.push(`id:#${idMatch[1]}`);
    
    const classMatch = snippet.match(/className="([^"]+)"/);
    if (classMatch?.[1]) {
        const classes = classMatch[1].split(' ').map(c => `.${c}`).join(' ');
        attrs.push(`class:${classes}`);
    }
    
    return attrs.length > 0 ? `[ ${attrs.join(' ')} ]` : '';
}

const formatSignature = (node: CodeNode, rootDir?: string): string => {
  if (isComponentNode(node)) {
    // For components, we need to extract props from the full function signature
    // Get the source content to find the complete function definition
    const source = getSourceContent(node.filePath, rootDir);
    if (source) {
      const lines = source.split('\n');
      const startLine = node.startLine - 1;
      const endLine = Math.min(startLine + 10, lines.length); // Look at more lines to get the full signature
      
      // Look for the complete function signature in the source
      const functionText = lines.slice(startLine, endLine).join('\n');
      
      // Try multiple patterns to match React component props
      const patterns = [
        /function\s+\w+\s*\(\s*\{\s*([^}]+)\s*\}\s*:\s*\{[^}]*\}/,  // function Name({ prop1, prop2 }: { ... })
        /\(\s*\{\s*([^}]+)\s*\}\s*:\s*\{[^}]*\}/,                   // ({ prop1, prop2 }: { ... })
        /\(\s*\{\s*([^}]+)\s*\}[^)]*\)/,                            // ({ prop1, prop2 })
      ];
      
      for (const pattern of patterns) {
        const propMatch = functionText.match(pattern);
        if (propMatch?.[1]) {
          const props = propMatch[1].split(',').map(p => p.trim().split(/[:=]/)[0]?.trim()).filter(Boolean);
          const propsString = props.map(p => `${p}:#`).join(', ');
          return `{ props: { ${propsString} } }`;
        }
      }
    }
    return ''; // Component with no destructured props
  }

  // For functions, format as name() instead of showing full code snippet
  if ((node.type === 'function' || node.type === 'method' || node.type === 'constructor' || node.type === 'arrow_function') && node.codeSnippet) {
    return formatFunctionSignature(node.codeSnippet);
  }
  
  // For JSX/HTML elements, show attributes
  if (node.type === 'html_element' && node.codeSnippet) {
    return formatJsxAttributes(node.codeSnippet);
  }

  // For CSS rules, show intents
  if (node.type === 'css_rule' && node.cssIntents) {
    return formatCssIntents(node.cssIntents);
  }

  // For type aliases, show the aliased type
  if (node.type === 'type' && node.codeSnippet) {
     const match = node.codeSnippet.match(/=\s*(.+);?/);
     return match?.[1] ? `= ${match[1].trim().replace(/;$/, '')}` : '';
  }

  // For variables/constants, show the value if it's simple
  if ((node.type === 'variable' || node.type === 'constant') && node.codeSnippet) {
    // For uppercase constants that are treated as modules (◇ symbol), show different formatting
    if (/^[A-Z]/.test(node.name)) {
      // If it's an object literal, show it without = prefix (module pattern)
      if (node.codeSnippet.startsWith('{') && node.codeSnippet.endsWith('}')) {
        return node.codeSnippet;
      }
    }
    
    // For regular variables/constants, add = prefix if needed
    if (!node.codeSnippet.includes('=')) {
      return `= ${node.codeSnippet}`;
    }
    // Extract simple values like "123", "'value'", etc.
    const match = node.codeSnippet.match(/=\s*(.+)$/);
    if (match && match[1]) {
      return `= ${match[1].trim()}`;
    }
    // If no assignment found, just return the snippet
    return node.codeSnippet;
  }
  
  // For container types like class/interface/namespace, we don't show a signature.
  // Their contents are represented by nested symbols.
  if (node.type === 'class' || node.type === 'interface' || node.type === 'namespace') {
    return '';
  }
  
  return '';
};

const formatNode = (node: CodeNode, graph: RankedCodeGraph, idManager: ScnIdManager, rootDir?: string, level = 0): string => {
  const symbol = getNodeSymbol(node);
  const { access, others } = getQualifiers(node, rootDir);
  const signature = formatSignature(node, rootDir);
  const scnId = idManager.getScnId(node.id);
  const id = scnId ? `(${scnId})` : '';
  const indent = '  '.repeat(level + 1);

  // Build the main line: qualifiers symbol id name signature
  const parts = [];
  if (access) parts.push(access);
  parts.push(symbol);
  if (id) parts.push(id);

  // For functions, combine name and signature without space, unless it's a component
  if (['function', 'method', 'constructor', 'arrow_function'].includes(node.type) && !isComponentNode(node)) {
    const displayName = node.name.includes('.') ? node.name.split('.').pop() || node.name : node.name;
    parts.push(displayName + signature);
  } else {
    const displayName = (node.type === 'property' || node.type === 'field' || node.type === 'html_element') && node.name.includes('.')
      ? node.name.split('.').pop() || node.name
      : node.name;
    parts.push(displayName);
    if (signature) parts.push(signature);
  }

  let mainLine = indent + parts.join(' ');
  if (others.length > 0) {
    // Sort qualifiers in specific order: ... ! o
    const sortedOthers = others.sort((a, b) => {
      const order = ['...', '!', 'o'];
      return order.indexOf(a) - order.indexOf(b);
    });
    mainLine += ` ${sortedOthers.join(' ')}`;
  }

  const formatLinks = (prefix: string, edges: readonly CodeEdge[]): string => {
    if (edges.length === 0) return '';
    const links = edges.map((edge: CodeEdge) => {
      const isCallerLink = prefix === '<-';
      const targetRepographId = isCallerLink ? edge.fromId : edge.toId;
      const targetNode = graph.nodes.get(targetRepographId);
      let targetScnId = idManager.getScnId(targetRepographId);

      // Per spec, file-level dependencies use a .0 suffix.
      // This applies if the target of the link is a file itself.
      if (targetNode?.type === 'file') {
        targetScnId = `${targetScnId}.0`;
      }
      return `(${targetScnId})`;
    }).filter(Boolean).sort().join(', ');

    if (!links) return '';
    return `\n${indent}  ${prefix} ${links}`;
  };

  const dependencyEdges = (graph.edges as CodeEdge[]).filter(edge => edge.fromId === node.id && edge.type !== 'contains');
  const callerEdges = (graph.edges as CodeEdge[]).filter(edge => {
    if (edge.toId !== node.id || edge.type === 'contains') return false;
    
    // For entity nodes, exclude file-level imports entirely
    if (node.type !== 'file' && edge.type === 'imports') return false;
    
    // For entity nodes, also exclude edges from file nodes (file-level dependencies)
    if (node.type !== 'file') {
      const sourceNode = graph.nodes.get(edge.fromId);
      if (sourceNode?.type === 'file') return false;
    }
    
    return edge.type !== 'imports';
  });

  return mainLine + formatLinks('->', dependencyEdges) + formatLinks('<-', callerEdges);
};

const serializeFile = (
  fileNode: CodeNode,
  symbols: CodeNode[],
  graph: RankedCodeGraph,
  idManager: ScnIdManager,
  rootDir?: string
): string => {
  const scnId = idManager.getScnId(fileNode.id) ?? '';

  const formatFileLinks = (prefix: string, edges: readonly CodeEdge[]): string => {
    if (edges.length === 0) return '';
    const links = edges.map((edge: CodeEdge) => {
      const targetId = prefix === '->' ? edge.toId : edge.fromId;
      const targetNode = graph.nodes.get(targetId);
      
      // If the target is an entity (not a file), we need to get its file's ID
      let fileId: string;
      if (targetNode?.type === 'file') {
        fileId = targetId;
      } else {
        // Find the file that contains this entity
        const entityFilePath = targetNode?.filePath;
        const fileNode = Array.from(graph.nodes.values()).find(n => n.type === 'file' && n.filePath === entityFilePath);
        fileId = fileNode?.id || targetId;
      }
      
      const targetScnId = idManager.getScnId(fileId);
      return `(${targetScnId}.0)`;
    }).filter(Boolean);
    
    // Remove duplicates and sort
    const uniqueLinks = [...new Set(links)].sort().join(', ');
    if (!uniqueLinks) return '';
    return `\n  ${prefix} ${uniqueLinks}`;
  };

  // File-level dependencies: imports or calls from this file to other files
  const fileDependencies = graph.edges.filter(e => 
    e.fromId === fileNode.id && 
    (e.type === 'imports' || (e.type === 'calls' && graph.nodes.get(e.toId)?.type !== 'file'))
  );
  
  // File-level callers: imports or calls to entities in this file from other files  
  const fileCallers = graph.edges.filter(e => {
    const toNode = graph.nodes.get(e.toId);
    const fromNode = graph.nodes.get(e.fromId);
    
    // If the target is an entity in this file and the source is from a different file
    return toNode?.filePath === fileNode.filePath && 
           fromNode?.filePath !== fileNode.filePath &&
           (e.type === 'imports' || e.type === 'calls');
  });

  const formattedPath = fileNode.filePath.includes(' ') ? `"${fileNode.filePath}"` : fileNode.filePath;
  let header = `§ (${scnId}) ${formattedPath}`;
  const fileDepLine = formatFileLinks('->', fileDependencies);
  if (fileDepLine) header += fileDepLine;
  const fileCallerLine = formatFileLinks('<-', fileCallers);
  if (fileCallerLine) header += fileCallerLine;

  // Hierarchical rendering
  const nodeWrappers = symbols.map(s => ({ node: s, children: [] as {node: CodeNode, children: any[]}[] })).sort((a,b) => a.node.startLine - b.node.startLine);
  const topLevelSymbols: typeof nodeWrappers = [];

  for (let i = 0; i < nodeWrappers.length; i++) {
    const currentWrapper = nodeWrappers[i];
    if (!currentWrapper) continue;
    let parentWrapper = null;
    
    // Find the tightest parent by looking backwards through the sorted list
    for (let j = i - 1; j >= 0; j--) {
        const potentialParentWrapper = nodeWrappers[j];
        if (!potentialParentWrapper) continue;
        // Check if current node is contained within the potential parent
        // For JSX elements, use a more flexible containment check
        const isContained = currentWrapper.node.startLine > potentialParentWrapper.node.startLine && 
                           currentWrapper.node.startLine < potentialParentWrapper.node.endLine;
        
        // Additional check for JSX elements - if they're on consecutive lines and the parent is a container element
        const isJsxNesting = currentWrapper.node.type === 'html_element' && 
                            potentialParentWrapper.node.type === 'html_element' &&
                            currentWrapper.node.startLine === potentialParentWrapper.node.startLine + 1;
        
        if (isContained || isJsxNesting) {
            parentWrapper = potentialParentWrapper;
            break;
        }
    }
    
    if (parentWrapper) {
        parentWrapper.children.push(currentWrapper);
    } else {
        topLevelSymbols.push(currentWrapper);
    }
  }

  const nodeLines: string[] = [];
  const processNode = (wrapper: {node: CodeNode, children: any[]}, level: number) => {
    nodeLines.push(formatNode(wrapper.node, graph, idManager, rootDir, level));
    for (const childWrapper of wrapper.children) {
      processNode(childWrapper, level + 1);
    }
  };

  for (const wrapper of topLevelSymbols) {
    processNode(wrapper, 0);
  }

  return [header, ...nodeLines].join('\n');
};

/**
 * Serializes a RankedCodeGraph into the SCN text format.
 * This function is the core rendering layer of `scn-ts`.
 *
 * @param graph - The `RankedCodeGraph` produced by `repograph`.
 * @param rootDir - The root directory of the project (for reading source files).
 * @returns A string containing the full SCN map.
 */
export const serializeGraph = (graph: RankedCodeGraph, rootDir?: string): string => {
  const nodesByFile = new Map<string, CodeNode[]>(); // filePath -> nodes
  const fileNodes: CodeNode[] = [];

  for (const node of graph.nodes.values()) {
    if (node.type === 'file') {
      fileNodes.push(node);
      nodesByFile.set(node.filePath, []);
    } else {
      if (!nodesByFile.has(node.filePath)) {
        // This case can happen if repograph finds an entity but not its parent file.
        // We'll create a dummy map entry, but it won't be processed without a file node.
        nodesByFile.set(node.filePath, []); 
      }
      nodesByFile.get(node.filePath)!.push(node);
    }
  }

  const sortedFileNodes = fileNodes.sort((a, b) => a.filePath.localeCompare(b.filePath));
  const idManager = new ScnIdManager(sortedFileNodes, nodesByFile);

  const scnParts = sortedFileNodes.map(fileNode => {
    const symbols = nodesByFile.get(fileNode.filePath) || [];
    // Sort symbols by line number to ensure deterministic output for hierarchical processing
    symbols.sort((a,b) => a.startLine - b.startLine);
    return serializeFile(fileNode, symbols, graph, idManager, rootDir);
  });

  return scnParts.join('\n\n');
};
```

## File: test/ts/e2e/cli.test.ts
```typescript
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
```

## File: test/ts/e2e/config-file.test.ts
```typescript
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
```

## File: test/ts/e2e/filesystem.test.ts
```typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { setupTestProject, type TestProject } from '../../test.util';
import { readFile, writeFile, rm } from 'fs/promises';
import { join, resolve } from 'path';

// Path to the CLI script in the main workspace
const CLI_PATH = resolve(process.cwd(), 'src/cli.ts');

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

    watcherProc = Bun.spawn(['bun', 'run', CLI_PATH, '--watch', '-o', outputPath, '**/*.ts'], {
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

    watcherProc = Bun.spawn(['bun', 'run', CLI_PATH, '--watch', '-o', outputPath, '**/*.ts'], {
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

    watcherProc = Bun.spawn(['bun', 'run', CLI_PATH, '--watch', '-o', outputPath, '**/*.ts'], {
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
      ['bun', 'run', CLI_PATH, 'my component.ts', '-o', 'output with spaces.scn'],
      { cwd: project.projectDir }
    );
    await proc.exited;

    expect(proc.exitCode).toBe(0);
    const outputContent = await readFile(outputPath, 'utf-8');
    expect(outputContent).toContain('§ (1) "my component.ts"');
  });
});
```

## File: test/ts/integration/css-parsing.test.ts
```typescript
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
    expect(scn).toContain('  ¶ (1.4) .all-intents { 💧 📐 ✍ }');
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

    // Check file-level links (import relationship)
    expect(tsxScn!).toContain('§ (2) Button.tsx\n  -> (1.0)');
    expect(cssScn!).toContain('§ (1) Button.css\n  <- (2.0)');

    // Check entity-level links
    // ⛶ button (2.2) should link to both .btn (1.1) and .btn-primary (1.2)
    expect(tsxScn!).toContain('    ⛶ (2.2) button [ class:.btn .btn-primary ]\n      -> (1.1), (1.2)');
    
    // ¶ .btn (1.1) should link back to ⛶ button (2.2)
    expect(cssScn!).toContain('  ¶ (1.1) .btn { 💧 }\n    <- (2.2)');
    
    // ¶ .btn-primary (1.2) should link back to ⛶ button (2.2)
    expect(cssScn!).toContain('  ¶ (1.2) .btn-primary { 💧 }\n    <- (2.2)');
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
    expect(cssScn!).toContain('  ¶ (1.1) #main-container { 💧 }\n    <- (2.2)');
  });
});
```

## File: test/ts/integration/dependency-graph.test.ts
```typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.2 Inter-File Dependency Graphs', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should resolve and add <- annotations to entities that are used by other entities', async () => {
    project = await setupTestProject({
      'util.ts': `export function helper() {}`,
      'main.ts': `import { helper } from './util'; function main() { helper(); }`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    const utilScn = scn.split('\n\n').find(s => s.includes('util.ts'));
    expect(utilScn).toBeDefined();
    // main.ts is file 1, util.ts is file 2.
    // main.ts's 'main' (1.1) calls util.ts's 'helper' (2.1)
    expect(utilScn).toContain('§ (2) util.ts\n  <- (1.0)');
    expect(utilScn).toContain('  + ~ (2.1) helper()\n    <- (1.1)');
  });

  it('should add a summary of file-level dependencies and callers on the § file declaration line', async () => {
    project = await setupTestProject({
      'config.ts': `export const setting = 1;`,
      'service.ts': `import { setting } from './config'; export const value = setting;`,
      'main.ts': `import { value } from './service'; console.log(value);`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    // Files are sorted alphabetically: config.ts (1), main.ts (2), service.ts (3)
    // main.ts imports service.ts. service.ts imports config.ts
    expect(scn).toContain('§ (1) config.ts\n  <- (3.0)');
    expect(scn).toContain('§ (2) main.ts\n  -> (3.0)');
    expect(scn).toContain('§ (3) service.ts\n  -> (1.0)\n  <- (2.0)');
  });

  it('should correctly represent a multi-step dependency chain (A -> B -> C)', async () => {
    project = await setupTestProject({
      'c.ts': `export const C = 'c';`,
      'b.ts': `import { C } from './c'; export const B = C;`,
      'a.ts': `import { B } from './b'; function run() { console.log(B); }`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    // File-level links. a.ts (1), b.ts (2), c.ts (3)
    expect(scn).toContain('§ (1) a.ts\n  -> (2.0)');
    expect(scn).toContain('§ (2) b.ts\n  -> (3.0)\n  <- (1.0)');
    expect(scn).toContain('§ (3) c.ts\n  <- (2.0)');

    // Entity-level links
    const aScn = scn.split('\n\n').find(s => s.includes('a.ts'));
    const bScn = scn.split('\n\n').find(s => s.includes('b.ts'));
    const cScn = scn.split('\n\n').find(s => s.includes('c.ts'));

    expect(aScn).toContain('  ~ (1.1) run()\n    -> (2.1)'); // run() in a.ts uses B from b.ts
    expect(bScn).toContain('  + ◇ (2.1) B = C\n    -> (3.1)\n    <- (1.1)'); // B in b.ts uses C from c.ts and is used by run() from a.ts
    expect(cScn).toContain('  + ◇ (3.1) C = \'c\'\n    <- (2.1)'); // C is used by B
  });
  
  it('should link a dependency from the function that uses it, not just the file', async () => {
    project = await setupTestProject({
      'util.ts': `export function log() {}`,
      'main.ts': `
        import { log } from './util';
        function run() {
          log();
        }
      `,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
    expect(mainScn).toBeDefined();
    expect(mainScn).toContain('§ (1) main.ts\n  -> (2.0)');
    expect(mainScn).toContain('  ~ (1.1) run()\n    -> (2.1)');
  });

  it('should support linking to multiple entities on one line', async () => {
     project = await setupTestProject({
      'util.ts': `
        export function helperA() {}
        export function helperB() {}
      `,
      'main.ts': `
        import { helperA, helperB } from './util';
        export function run() {
          helperA();
          helperB();
        }
      `,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
    expect(mainScn).toBeDefined();
    // main.ts is file 1, util.ts is file 2.
    // run is 1.1, helperA is 2.1, helperB is 2.2
    expect(mainScn).toContain('§ (1) main.ts\n  -> (2.0)');
    expect(mainScn).toContain('  + ~ (1.1) run()\n    -> (2.1), (2.2)');
  });
});
```

## File: test/ts/integration/programmatic-api.test.ts
```typescript
import { describe, it, expect, afterEach } from 'bun:test';
import {
  generateScn,
  serializeGraph,
  type RankedCodeGraph,
  type CodeNode,
  type CodeEdge as RepographEdge,
} from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';
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
```

## File: test/ts/unit/code-entities.test.ts
```typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.3 Code Entities', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should represent a class with ◇', async () => {
    project = await setupTestProject({ 'test.ts': `export class MyClass {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  + ◇ (1.1) MyClass');
  });

  it('should represent a namespace with ◇', async () => {
    project = await setupTestProject({ 'test.ts': `export namespace MyNamespace {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  + ◇ (1.1) MyNamespace');
  });

  it('should represent an exported uppercase object literal (module pattern) with ◇', async () => {
    project = await setupTestProject({ 'test.ts': `export const MyModule = { key: 'value' };` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain(`  + ◇ (1.1) MyModule { key: 'value' }`);
  });

  it('should represent an interface with {}', async () => {
    project = await setupTestProject({ 'test.ts': `export interface MyInterface {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  + {} (1.1) MyInterface');
  });

  it('should represent an export function with + ~', async () => {
    project = await setupTestProject({ 'test.ts': `export function myFunc() {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  + ~ (1.1) myFunc()');
  });

  it('should represent a const arrow function with ~', async () => {
    project = await setupTestProject({ 'test.ts': `const myFunc = () => {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  ~ (1.1) myFunc()');
  });

  it('should represent a class method with ~ and a property with @', async () => {
    project = await setupTestProject({
      'test.ts': `
      export class MyClass {
        myProp: string = '';
        myMethod() {}
      }`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('    + @ (1.2) myProp');
    expect(scn).toContain('    + ~ (1.3) myMethod()');
  });

  it('should represent a top-level const with @', async () => {
    project = await setupTestProject({ 'test.ts': `const myVar = 123;` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    // Note: repograph represents this as a "variable" and heuristic makes it not a container
    expect(scn).toContain('  @ (1.1) myVar = 123');
  });

  it('should correctly handle export default class', async () => {
    project = await setupTestProject({ 'test.ts': `export default class MyClass {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  + ◇ (1.1) MyClass');
  });

  it('should correctly handle export default function', async () => {
    project = await setupTestProject({ 'test.ts': `export default function myFunc() {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  + ~ (1.1) myFunc()');
  });

  it('should correctly handle export default anonymous function', async () => {
    project = await setupTestProject({ 'test.ts': `export default () => {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('  + ~ (1.1) default()'); // repograph names it 'default'
  });
});
```

## File: test/ts/unit/general-structural.test.ts
```typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.1 General & Structural', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should generate a § file declaration with a unique ID and correct relative path', async () => {
    project = await setupTestProject({
      'a.ts': ``,
      'b.ts': ``,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    expect(scn).toContain('§ (1) a.ts');
    expect(scn).toContain('§ (2) b.ts');
  });

  it('should assign unique, incrementing entity IDs within a file, starting from 1', async () => {
    project = await setupTestProject({
      'test.ts': `
        export function funcA() {}
        export class ClassB {}
      `,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    expect(scn).toContain('+ ~ (1.1) funcA()');
    expect(scn).toContain('+ ◇ (1.2) ClassB');
  });

  it('should represent a side-effect import with a .0 entity ID', async () => {
    project = await setupTestProject({
      'a.ts': `import './b.ts';`,
      'b.ts': `console.log('side effect');`,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    expect(scn).toContain('§ (1) a.ts\n  -> (2.0)');
    expect(scn).toContain('§ (2) b.ts\n  <- (1.0)');
  });

  it('should represent hierarchical code structures with correct indentation', async () => {
    project = await setupTestProject({
      'test.ts': `
        export namespace MyNamespace {
          export class MyClass {
            public myMethod() {}
          }
        }
      `,
    });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });

    const expected = [
      '  + ◇ (1.1) MyNamespace',
      '    + ◇ (1.2) MyClass',
      '      + ~ (1.3) myMethod()'
    ].join('\n');
    expect(scn).toContain(expected);
  });
});
```

## File: test/ts/unit/jsx.test.ts
```typescript
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
    
    const mainIndentation = lines[mainIndex]!.match(/^\s*/)?.[0].length ?? 0;
    const h1Indentation = lines[h1Index]!.match(/^\s*/)?.[0].length ?? 0;
    
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
```

## File: test/ts/unit/qualifiers.test.ts
```typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.5 Function & Method Qualifiers', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should prefix public members with +', async () => {
    project = await setupTestProject({
      'test.ts': `export class MyClass { public myMethod() {} }`,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.2) myMethod()');
  });

  it('should prefix private members with -', async () => {
    project = await setupTestProject({
      'test.ts': `export class MyClass { private myMethod() {} }`,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('- ~ (1.2) myMethod()');
  });

  it('should treat default class members as public and prefix with +', async () => {
    project = await setupTestProject({
      'test.ts': `export class MyClass { myMethod() {} }`,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.2) myMethod()');
  });

  it('should append ... to an async function or method', async () => {
    project = await setupTestProject({
      'test.ts': `
        export async function myFunc() {}
        export class MyClass { async myMethod() {} }
      `,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) myFunc() ...');
    expect(scn).toContain('+ ~ (1.3) myMethod() ...');
  });

  it('should append ! to a function that has a throw statement', async () => {
    project = await setupTestProject({
      'test.ts': `export function myFunc() { throw new Error('test'); }`,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) myFunc() !');
  });

  it('should correctly handle functions that are both async and can throw', async () => {
    project = await setupTestProject({
      'test.ts': `export async function myFunc() { throw new Error('test'); }`,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) myFunc() ... !');
  });
  
  it('should append o to a pure function (repograph heuristic)', async () => {
    // This test relies on repograph's isPure heuristic.
    // A simple function with no side effects is a good candidate.
     project = await setupTestProject({
      'test.ts': `export function add(a: number, b: number): number { return a + b; }`,
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ~ (1.1) add(a: #, b: #): #number o');
  });
});
```

## File: test/ts/unit/type-system.test.ts
```typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.4 Type System Symbols', () => {
  let project: TestProject | undefined;

  afterEach(async () => {
    if (project) {
      await project.cleanup();
      project = undefined;
    }
  });

  it('should represent an enum with ☰', async () => {
    project = await setupTestProject({ 'test.ts': `export enum Color { Red, Green }` });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ ☰ (1.1) Color');
  });

  it('should represent a type alias with =:', async () => {
    project = await setupTestProject({ 'test.ts': `export type UserID = string;` });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('+ =: (1.1) UserID = string');
  });

  it('should represent type references in function parameters with #', async () => {
    project = await setupTestProject({ 'test.ts': `function process(id: string, value: number) {}` });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.1) process(id: #, value: #)');
  });
  
  it('should represent a function return type with :#Type', async () => {
    project = await setupTestProject({ 'test.ts': `function isActive(): boolean {}` });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.1) isActive(): #boolean');
  });
  
  it('should correctly represent complex types like Promise<User>', async () => {
    project = await setupTestProject({ 'test.ts': `
      interface User {}
      function getUser(): Promise<User> { return Promise.resolve({} as User); }
    `});
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.2) getUser(): #Promise<User>');
  });

  it('should correctly represent generic type parameters and return types', async () => {
    project = await setupTestProject({ 'test.ts': `
      function transform<T, U>(data: T[], func: (item: T) => U): U[] { return []; }
    `});
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    expect(scn).toContain('~ (1.1) transform(data: #, func: #): #U[]');
  });
});
```

## File: test/test.util.ts
```typescript
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
```

## File: package.json
```json
{
  "name": "scn-ts",
  "version": "1.0.4",
  "description": "Generate Symbolic Context Notation (SCN) maps from your TypeScript/JavaScript codebase.",
  "author": "anton",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/scn-ts.git"
  },
  "keywords": [
    "scn",
    "typescript",
    "code-analysis",
    "context-map",
    "repograph",
    "cli"
  ],
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "scn-ts": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "repograph": "0.1.46"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^20.11.24",
    "tsup": "^8.0.2",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

## File: tsconfig.json
```json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    // Path mapping for local development
    // "baseUrl": ".",
    // "paths": {
    //   "repograph": ["../../src/index.ts"]
    // },

    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "noPropertyAccessFromIndexSignature": false
  },
  "include": ["src", "test"],
  "exclude": ["node_modules", "dist"]
}
```

## File: tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true, // Cleans the dist folder once before building.
    splitting: false,
    shims: true,
    external: ['repograph'],
  },
  {
    entry: ['src/cli.ts'],
    format: ['cjs', 'esm'],
    sourcemap: true,
    splitting: false,
    shims: true,
    external: ['repograph'],
    banner: {
      js: '#!/usr/bin/env node',
    },
    // No .d.ts files for the CLI entry point.
  },
]);
```
