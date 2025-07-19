# scn-ts: The SCN Generator Engine

[![NPM Version](https://img.shields.io/npm/v/scn-ts.svg)](https://www.npmjs.com/package/scn-ts)
[![Spec Version](https://img.shields.io/badge/SCN%20Spec-v1.0-blue.svg)](https://github.com/scn-lang/scn)
[![Build Status](https://img.shields.io/github/actions/workflow/status/scn-lang/scn-ts/ci.yml?branch=main)](https://github.com/scn-lang/scn-ts/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discussions](https://img.shields.io/badge/Discussions-Join_Here-green.svg)](https://github.com/scn-lang/scn/discussions)

**`scn-ts` is the official reference implementation and generator engine for Symbolic Context Notation (SCN).**

This is a command-line tool and a powerful programmatic library designed to create SCN context maps from any codebase. While its core is built in TypeScript and it has first-class support for **JS/TS**, its architecture is designed to be **language-agnostic** through a plugin system.

`scn-ts` analyzes your project's structure—classes, functions, types, and their relationships—and outputs a hyper-efficient SCN map. This map gives Large Language Models (LLMs) unparalleled architectural context at a fraction of the token cost of raw source code, bridging the "Context Chasm" and enabling smarter, faster, and more accurate AI-assisted development.

## Table of Contents

1.  [**What is SCN?**](#1-what-is-scn)
2.  [**Features**](#2-features)
3.  [**Installation**](#3-installation)
4.  [**Quick Start: CLI Usage**](#4-quick-start-cli-usage)
5.  [**How It Works: A Pluggable Pipeline**](#5-how-it-works-a-pluggable-pipeline)
6.  [**Programmatic API: High & Low Level**](#6-programmatic-api-high--low-level)
    *   [High-Level API (Simple)](#high-level-api-simple)
    *   [Low-Level API (Advanced)](#low-level-api-advanced)
7.  [**Configuration (`scn.config.js`)**](#7-configuration-scnconfigjs)
8.  [**Command-Line Interface (CLI)**](#8-command-line-interface-cli)
9.  [**Roadmap & The Multi-Language Vision**](#9-roadmap--the-multi-language-vision)
10. [**Contributing**](#10-contributing)
11. [**License**](#11-license)

---

## 1. What is SCN?

**Symbolic Context Notation (SCN)** is a format designed to represent a software project's structural surface, API, and inter-file relationships. It strips away implementation logic to create a compressed blueprint of your codebase.

| Before SCN (Raw Code)                                    | After SCN (Context Map)                     | Token Savings |
| -------------------------------------------------------- | ------------------------------------------- | ------------- |
| A 200-line React component with state, effects, and JSX. | A 15-line SCN block showing its props,      | ~92%          |
| A 5-file utility library with complex internal logic.    | A 25-line SCN graph showing public exports  | ~85%          |

By providing an SCN map to an LLM instead of raw code, you can fit 10-20x more relevant context into a single prompt, eliminating hallucinations and enabling the AI to reason about your entire project architecture.

For the complete specification, please see the [**Official SCN Spec v1.0**](https://github.com/scn-lang/scn).

## 2. Features

*   **Multi-Language by Design:** A core engine with a plugin architecture to support dozens of languages (JS, TS, Python, Go, Rust, and more).
*   **Deep JS/TS Support:** The default plugin uses the TypeScript Compiler API for best-in-class analysis of JavaScript and TypeScript projects, including JSX/TSX.
*   **Powerful Programmatic APIs:** Use a simple high-level API for quick generation, or a low-level API for deep integration and custom tooling.
*   **Project-Wide Graph Analysis:** Scans your entire project to build a complete dependency graph, mapping imports/exports (`->`) and call sites (`<-`).
*   **Highly Configurable:** Use a `scn.config.js` file to define include/exclude patterns, plugins, and output settings.
*   **Watch Mode:** Automatically re-generate the SCN map on file changes for a seamless development experience.

## 3. Installation

Install `scn-ts` as a development dependency.

```bash
# Using Bun
bun i -D scn-ts

# Using NPM
npm install --save-dev scn-ts

# Using Yarn
yarn add --dev scn-ts
```

## 4. Quick Start: CLI Usage

The easiest way to get started is to run `scn-ts` from your project's root directory.

```bash
npx scn-ts "src/**/*.{ts,tsx}" --output context.scn
```

This command will:
*   Find all `.ts` and `.tsx` files inside your `src/` directory.
*   Analyze them using the built-in TypeScript/JavaScript parser.
*   Generate a single `context.scn` file containing the complete SCN map.

## 5. How It Works: A Pluggable Pipeline

`scn-ts` processes code in a four-stage pipeline. This design allows new languages to be "plugged in" by providing a custom parser.

1.  **Glob & Load:** The tool finds all files matching the include/exclude patterns.
2.  **Parse (Pluggable):** Each file's content is passed to the appropriate language parser. The parser's job is to convert the source code into a standardized **SCN Abstract Syntax Tree (AST)**.
    *   *Default:* The built-in parser uses the **TypeScript Compiler API** for `.ts`, `.tsx`, `.js`, and `.jsx` files.
    *   *Future:* A Python plugin would use a Python parser (e.g., Tree-sitter) to produce the same SCN AST format.
3.  **Index & Resolve:** The engine takes the SCN ASTs from all files and builds a single, project-wide graph. It indexes all entities (classes, functions, etc.) and resolves the `->` (dependency) and `<-` (caller) relationships between them.
4.  **Serialize:** The final in-memory graph is serialized into the ultra-compact SCN text format.

## 6. Programmatic API: High & Low Level

`scn-ts` exposes a flexible API for programmatic use.

### High-Level API (Simple)

For most use cases, the `generateScn` function is all you need. It handles the entire pipeline in one call.

```typescript
import { generateScn } from 'scn-ts';
import fs from 'fs/promises';

async function buildContext() {
  const scnOutput = await generateScn({
    // Options are identical to the config file
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['**/*.spec.ts'],
    // plugins: [pythonParser()] // Future plugin usage
  });

  await fs.writeFile('context.scn', scnOutput, 'utf-8');
  console.log('SCN map generated!');
}

buildContext();
```

### Low-Level API (Advanced)

For building custom tools, you can access each stage of the pipeline. This allows you to inspect or modify the intermediate data structures.

```typescript
import {
  loadFiles,
  parse,
  buildGraph,
  serializeGraph
} from 'scn-ts';
import fs from 'fs/promises';

async function customBuildContext() {
  // 1. Load file contents
  const files = await loadFiles({ include: ['src/**/*.ts'] });

  // 2. Parse files into SCN ASTs
  // The 'parse' function automatically uses the correct plugin
  const scnAsts = await parse(files);

  // --- You can now inspect or transform the ASTs ---
  console.log(`Parsed ${scnAsts.length} files.`);

  // 3. Build the final, resolved graph
  const scnGraph = buildGraph(scnAsts);

  // --- You could now perform your own analysis on the graph ---
  console.log(`Graph has ${scnGraph.entities.length} total entities.`);

  // 4. Serialize the graph to the SCN format
  const scnOutput = serializeGraph(scnGraph);

  await fs.writeFile('context.scn', scnOutput, 'utf-8');
  console.log('Custom SCN build complete!');
}

customBuildContext();
```

## 7. Configuration (`scn.config.js`)

For project-wide settings, create a `scn.config.js` file in your root.

```javascript
// scn.config.js
module.exports = {
  /**
   * Path to tsconfig.json for the default JS/TS parser.
   * Highly recommended for correct type analysis and path aliases.
   */
  project: './tsconfig.json',

  /** Glob patterns to include. */
  include: [
    'src/**/*.{ts,tsx}',
    'app/**/*.py', // Example for a future python plugin
  ],

  /** Glob patterns to exclude. */
  exclude: [
    '**/*.d.ts',
    '**/*.test.ts',
    'dist/**/*',
  ],

  /** Path for the final output file. */
  output: 'context.scn',

  /** (Future) An array of language parser plugins. */
  // plugins: [
  //   require('scn-parser-python')()
  // ],
};
```

## 8. Command-Line Interface (CLI)

Override any config setting with command-line flags.

```
npx scn-ts [globs...] [options]
```

| Flag              | Alias | Description                                        |
| ----------------- | ----- | -------------------------------------------------- |
| `--output <path>` | `-o`  | Specify the output file path.                      |
| `--project <path>`| `-p`  | Path to `tsconfig.json` for TS/JS projects.        |
| `--watch`         | `-w`  | Watch files and re-generate on changes.            |
| `--config <path>` | `-c`  | Path to a custom config file.                      |
| `--version`       | `-v`  | Display the version number.                        |
| `--help`          | `-h`  | Display the help screen.                           |

## 9. Roadmap & The Multi-Language Vision

The SCN standard and `scn-ts` are actively evolving. Our primary goal is to create a truly universal SCN generator.

*   [ ] **Formalize the Plugin API:** Define and document the official interface for creating custom language parsers.
*   [ ] **Release Official Language Plugins:**
    *   [ ] `scn-parser-python`
    *   [ ] `scn-parser-go`
    *   [ ] `scn-parser-rust`
*   [ ] **Enhance Caller Resolution (`<-`):** Deepen analysis to trace function calls inside other function bodies for a more complete graph.
*   [ ] **Performance Optimizations:** Ensure `scn-ts` can handle codebases with millions of lines of code across multiple languages.
*   [ ] **Configuration File Support:** Add plugins for parsing `.json`, `.yaml`, and `.xml` files into SCN.

## 10. Contributing

We welcome community contributions, especially for new language support!

1.  **Discussions:** Have an idea or a question? Start a conversation on [GitHub Discussions](https://github.com/scn-lang/scn/discussions).
2.  **Language Plugins:** If you have expertise in a language's AST or tooling (e.g., Tree-sitter, ANTLR), we would love your help in creating a new parser plugin. Check the issues for our Plugin API proposal.
3.  **Issues & PRs:** Find a bug or want to improve the core engine? [Open an issue](https://github.com/scn-lang/scn-ts/issues) or submit a Pull Request.

## 11. License

This project is licensed under the **MIT License**.
