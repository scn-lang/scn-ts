import { generateScn, type ScnTsConfig } from './index.js';
import { existsSync, readFileSync, watch } from 'fs';
import { writeFile } from 'fs/promises';
import { resolve, join, relative } from 'path';
import { version } from '../package.json';

interface CliOptions {
  include: string[];
  output?: string;
  project?: string;
  config?: string;
  watch: boolean;
  help: boolean;
  version: boolean;
}

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
    if (arg.startsWith('-')) {
      switch (arg) {
        case '-o':
        case '--output':
          options.output = cliArgs[++i];
          break;
        case '-p':
        case '--project':
          options.project = cliArgs[++i];
          break;
        case '-c':
        case '--config':
          options.config = cliArgs[++i];
          break;
        case '--watch':
          options.watch = true;
          break;
        case '-h':
        case '--help':
          options.help = true;
          break;
        case '-v':
        case '--version':
          options.version = true;
          break;
        default:
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
      }
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

  Arguments:
    globs...         Glob patterns specifying files to include.

  Options:
    -o, --output <path>    Path to write the SCN output file. (default: stdout)
    -p, --project <path>   Path to tsconfig.json.
    -c, --config <path>    Path to a config file. (default: scn.config.js)
    --watch                Watch files for changes and re-generate.
    -v, --version          Display version number.
    -h, --help             Display this help message.
  `);
}

async function run() {
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
    include: cliOptions.include.length > 0 ? cliOptions.include : (fileConfig.include || []),
    exclude: fileConfig.exclude,
    project: cliOptions.project || fileConfig.project,
  };
  
  const output = cliOptions.output || fileConfig.output;

  if (config.include.length === 0) {
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
    watch(config.root || process.cwd(), { recursive: true }, async (eventType, filename) => {
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