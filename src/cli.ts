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