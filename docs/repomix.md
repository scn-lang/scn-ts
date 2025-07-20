# Directory Structure
```
docs/
  scn-ts-2.report.md
  scn.readme.md
package.json
README.md
tsconfig.json
```

# Files

## File: docs/scn-ts-2.report.md
````markdown
## Analysis Report: `repograph` and `scn-ts` Integration

### Executive Summary

`repograph` proved to be an excellent engine for `scn-ts`. Its core architecture, particularly the composable pipeline and Tree-sitter-based analysis, provided the vast majority of the necessary foundation for this integration.

The work did not require fundamental re-architecture. Instead, it involved **targeted enhancements to enrich the `CodeGraph` data model**. By adding more semantic detail to `CodeNode` and `CodeEdge` types, `repograph` became a more powerful general-purpose analysis tool, while incidentally providing `scn-ts` with a complete, high-fidelity data source to construct its map.

### Core Design Philosophy: Separation of Concerns

The integration was guided by a clean separation of responsibilities, which has now been successfully implemented:

*   **`repograph`'s Role:** To discover, parse, and model a codebase into a language-agnostic graph (`RankedCodeGraph`). It has no knowledge of SCN-specific syntax. Its product is a rich, structured data object.
*   **`scn-ts`'s Role:** To consume the `RankedCodeGraph` from `repograph`. Its sole job is to act as a "rendering target," transforming and serializing this structured data into the SCN text format.

### I. `repograph` as the Analysis Engine

`repograph`'s existing strengths were leveraged, and its data model was enhanced to meet the full requirements of the SCN specification.

#### Leveraged Foundation

The initial `repograph` implementation provided a robust starting point:

1.  **Composable Pipeline:** The `createMapGenerator` function was the ideal entry point, allowing `scn-ts` to reuse the `discover`, `analyze`, and `rank` stages while providing a custom renderer.
2.  **Rich `CodeNode` Model:** The existing `CodeNode` already captured visibility, asynchronicity, entity types (class, function), parameters, and return types.
3.  **Relationship Modeling:** The `CodeEdge` types (`'imports'`, `'calls'`, `'inherits'`) provided the exact information needed to generate dependency arrows.

#### Implemented Semantic Upgrades

To fully support SCN, the `repograph` analyzer and data model were enhanced as follows:

**1. Deeper Code Semantics in `CodeNode`:**
The `CodeNode` model was enriched to capture finer-grained details about code behavior:
*   `canThrow: boolean`: Added to indicate if a function's body contains a `throw` statement, mapping to SCN's `!` symbol.
*   `isPure: boolean`: Added to identify pure functions via heuristics (e.g., absence of external calls or state mutation), mapping to SCN's `o` symbol.
*   `isStatic: boolean`: This field's capture was reviewed and solidified across all supported languages.

**2. First-Class UI Language Support:**
Analysis capabilities were extended beyond procedural/OO languages to include UI structure and styling:
*   **New `CodeNodeType`s:** The enum was expanded with `'html_element'` and `'css_rule'`.
*   **UI-Specific Fields:** New `CodeNode` attributes like `htmlTag`, `cssSelector`, and `cssIntents` were added to hold structural and styling information.
*   **Enhanced Analyzer:** The analyzer was updated to parse HTML/JSX element hierarchies and infer the intent of CSS rules (`layout`, `typography`, etc.).

**3. Solidified API Contract:**
The `RankedCodeGraph` data structure was formalized and documented as a stable, public API. This ensures that `scn-ts` and other downstream tools have a reliable and versioned data contract to depend on.

### II. `scn-ts` as the Rendering Layer

With a complete and semantically rich `CodeGraph` available from `repograph`, the implementation of `scn-ts` became simple and focused. Its responsibilities are:

1.  **Invoke** `repograph`'s processing pipeline.
2.  **Receive** the final `RankedCodeGraph` data object.
3.  **Perform** a direct, stateless translation of the graph's nodes and edges into SCN text format, mapping data attributes like `visibility` or `canThrow` to their corresponding SCN symbols.

### Conclusion

The integration was a success. By enhancing `repograph`'s generic analysis capabilities, it became a more powerful standalone tool while simultaneously providing the perfect data source for `scn-ts`. This project validates the "smart engine, simple renderer" architectural approach and the critical value of maintaining a clean separation of concerns.
````

## File: docs/scn.readme.md
````markdown
# Symbolic Context Notation (◮ SCN) Specification v1.0

**Symbolic Context Notation (SCN) is a hyper-efficient, language-agnostic format for representing the structural surface, API, and inter-file relationships of a software codebase.** It acts as a compressed blueprint of a project, designed to provide Large Language Models (LLMs) with unparalleled context at a fraction of the token cost of raw source code.

This document is the official specification. It's intended for developers, tool-builders, and anyone interested in the future of AI-assisted software development.

---

## 1. The Problem: The "Context Chasm"

Large Language Models are powerful, but they operate with a critical handicap: they lack true understanding of a project's architecture. When we paste code into a prompt, we face a trade-off:

*   **Provide Too Little Code:** The LLM hallucinates, inventing functions, misusing APIs, and failing to see connections between files.
*   **Provide Too Much Code:** We hit token limits, incur high costs, and the LLM gets lost in irrelevant implementation details, leading to slower, lower-quality responses.

This is the **Context Chasm**. SCN is the bridge.

## 2. The Solution: SCN Philosophy

SCN bridges the chasm by adhering to four principles:

1.  **Extreme Token Efficiency:** Every symbol is chosen to be a single ASCII character where possible, maximizing the information-to-token ratio.
2.  **Language Agnosticism:** The system abstracts concepts from OOP, FP, and Declarative paradigms into a unified format.
3.  **Structural Representation:** SCN maps the *graph* of a project—which entity uses which, and which is used by which—revealing the true architecture.
4.  **Human Scannability:** While machine-optimized, the format is surprisingly readable, allowing developers to quickly grasp a project's structure.

---

## 3. Comparison with Other Representations (AST, CST)

To understand SCN's unique value, it's essential to compare it with traditional code representations like Concrete Syntax Trees (CSTs) and Abstract Syntax Trees (ASTs).

| Feature               | **Concrete Syntax Tree (CST)**                               | **Abstract Syntax Tree (AST)**                               | **Symbolic Context Notation (SCN)**                          |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Purpose**           | Perfectly represent the source text, including all syntax.   | Represent the abstract semantic structure of the code.       | **Represent the architectural surface & relationships.**     |
| **Detail Level**      | **Hyper-Detailed.** Includes whitespace, comments, parentheses. | **Detailed.** Abstracts away syntax, focuses on structure.   | **Ultra-Concise.** Abstracts away implementation logic.      |
| **Scope**             | Single file.                                                 | Single file.                                                 | **Project-wide.** Natively represents inter-file dependencies. |
| **Language Agnostic?**| No. Highly specific to a language's grammar.                 | Mostly no. Structure is language-specific.                   | **Yes.** Symbolic system unifies concepts across languages.  |
| **Token Cost**        | Extremely High.                                              | Very High.                                                   | **Extremely Low.** Designed for maximum token efficiency.    |
| **Example Node**      | `(`, `function`, `myFunc`, `)`, `{`, `}`                     | `FunctionDeclaration(name: "myFunc", body: BlockStatement)`  | `~ (1.1) myFunc()`                                           |
| **Primary Use Case**  | Parsers, formatters (like Prettier).                         | Compilers, linters, transpilers (like Babel).                | **LLM context, architecture visualization, dependency analysis.** |

**Conclusion:** SCN is not a replacement for ASTs/CSTs. It is a **higher-level abstraction built on top of them**. A tool would first parse source code into an AST and then traverse that AST to generate the even more abstract and relationship-focused SCN map.

---

## 4. Before & After: The Power of SCN

The best way to understand SCN is to see it in action.

### Example 1: A Simple JavaScript Class

#### **Before SCN: Raw Source Code (105 tokens)**
```javascript
// services/auth.js
import { findUserByEmail, hashPassword } from './utils';

/**
 * Manages user authentication.
 */
export class AuthService {
  constructor(database) {
    this.db = database;
  }

  // Tries to log a user in
  async login(email, password) {
    const user = await findUserByEmail(this.db, email);
    if (!user) {
      throw new Error('User not found');
    }

    const hash = hashPassword(password);
    if (user.passwordHash !== hash) {
      throw new Error('Invalid password');
    }

    return user;
  }
}
```

#### **After SCN: The Context Map (21 tokens)**
```scn
§ (1) services/auth.js
  -> (utils.js)       // File-level dependency
  ◇ (1.1) AuthService
    + @ db: #(Database)
    + ~ login(email: #, pass: #): #(User) ...!
```
**Result:** A **79% reduction** in tokens. We've thrown away implementation details (`if` statements, internal calls) but preserved the essential API surface: the `AuthService` class has a public `login` method that is `async`, can `throw`, and returns a `User`.

### Example 2: A React Component with CSS

#### **Before SCN: Raw Source Code (HTML, CSS - 131 tokens)**
```jsx
// Button.jsx
import './Button.css';

export function Button({ label, onClick }) {
  return (
    <button className="btn btn-primary" onClick={onClick}>
      {label}
    </button>
  );
}

// Button.css
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
}
.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
}
```

#### **After SCN: The Context Map (38 tokens)**
```scn
§ (2) Button.jsx
  -> (3.0)
  ◇ (2.1) Button
    { props: { label:#, onClick:# } }
    ⛶ (2.2) button [ class:.btn .btn-primary ]
      -> (3.1), (3.2)

§ (3) Button.css
  <- (2.0)
  ¶ (3.1) .btn { 📐 ✍ }
  ¶ (3.2) .btn-primary { 💧 }
```
**Result:** A **71% reduction**. The SCN clearly shows that the `Button` component `(2.1)` has a `button` element `(2.2)` which is styled by two separate CSS rules `(3.1, 3.2)`. The LLM now understands the structural link between the JSX and the CSS without seeing a single pixel value.

### Example 3: A Multi-File Python Application

#### **Before SCN: Raw Source Code (118 tokens)**
```python
# services.py
from models import User
from database import db_session

def get_user_profile(user_id: int) -> User:
    user = db_session.query(User).get(user_id)
    return user

# main.py
from services import get_user_profile

def main():
    user = get_user_profile(1)
    if user:
        print(f"Hello, {user.name}")

if __name__ == "__main__":
    main()
```
#### **After SCN: The Context Map (31 tokens)**
```scn
§ (4) models.py
  <- (5.0)
  ◇ (4.1) User
    + @ id: #(int)
    + @ name: #(str)

§ (5) services.py
  -> (4.1), (database.py)
  <- (6.1)
  + ~ (5.1) get_user_profile(user_id: #): #(4.1)

§ (6) main.py
  -> (5.1)
  ~ (6.1) main()
    -> (5.1)
```
**Result:** A **74% reduction**. The SCN creates a complete dependency graph. It shows that `main.py` calls a function in `services.py`, which in turn depends on the `User` model from `models.py`. An LLM can now reason about the entire application flow.

---

## 5. The SCN Specification v1.0

### Core Structure: Files & Entity IDs
An SCN document is a plain text file representing a project's context.

*   **File Declaration (`§`):** Each file is introduced with a `§` symbol, a unique integer ID, and the file path.
    `§ (1) path/to/file.js`
*   **Entity Declaration:** Every significant entity (class, function, etc.) gets a compound ID: `(file_id.entity_id)`.
    `◇ (1.1) MyClass`
*   **Dependency Linking (`->`/`<-`):** Relationships are defined by pointing an entity's `->` (dependency) or `<-` (caller) to another entity's unique ID.
    `~ (1.2) myMethod() -> (2.1)`

### Master Symbol Legend

#### General & Structural
| Symbol | Meaning | Description |
| :---: | :--- | :--- |
| `§` | **File Path** | Declares a new source file context. |
| `->` | **Dependency** | Points to an entity ID that this entity *uses*. |
| `<-` | **Caller** | Points to an entity ID that *uses* this entity. |

#### Code Entities (JS, Python, Go, C#, etc.)
| Symbol | Meaning | Description |
| :---: | :--- | :--- |
| `◇` | **Container** | A Class, Struct, Module, or Namespace. |
| `~` | **Function** | A function, method, or procedure. |
| `@` | **Variable** | A property, field, constant, or state variable. |

#### Type System Definitions & References
| Symbol | Meaning | Description |
| :---: | :--- | :--- |
| `{}` | **Interface/Struct** | Defines a data shape, contract, or complex object type. |
| `☰` | **Enum** | Defines a set of named constant values. |
| `=:` | **Type Alias** | Assigns a new name to an existing type. |
| `#` | **Type Reference** | *References* an existing type in a signature or property. |

#### Markup (HTML) & Style (CSS)
| Symbol | Meaning | Description |
| :---: | :--- | :--- |
| `⛶` | **HTML Element** | Represents an element tag. Indentation denotes hierarchy. |
| `¶` | **CSS Rule** | Represents a selector and its associated style block. |
| `📐` | **Layout Intent** | CSS rule affects geometry (box model, flex, grid, position). |
| `✍` | **Text Intent** | CSS rule affects typography (font, text styles). |
| `💧` | **Appearance Intent**| CSS rule affects appearance (color, background, border, shadow). |

#### Function & Method Qualifiers
| Symbol | Meaning | Description |
| :---: | :--- | :--- |
| `+` / `-` | **Access** | Public (+) or Private (-) visibility. |
| `...` | **Async** | The function is asynchronous (`await`able). |
| `!` | **Throws** | The function can throw an exception or return an error. |
| `o` | **Pure** | The function has no side effects. |

---


## 7. Detailed Examples by Paradigm

#### Object-Oriented Programming (OOP)
```scn
§ (10) models/user.ts
  <- (11.1)
  ◇ (10.1) User
    + @ id: #(string)

§ (11) services/auth.ts
  -> (10.1)
  <- (12.1)
  ◇ (11.1) AuthService
    - @ db: #(DB)
    + ~ login(email: #, pass: #): #(10.1) ...!
```
**Shows:** Encapsulation (`- @ db`), dependency injection, and a public method with async/throws qualifiers.

#### Functional Programming (FP)
```scn
§ (20) utils/validators.js
  <- (22.1)
  + ~ (20.1) isEmail(str: #): #(bool) o
  + ~ (20.2) isSecure(pwd: #): #(bool) o

§ (21) api/client.js
  <- (22.1)
  + ~ (21.1) postUser(data: #): #(Promise) ...!

§ (22) pipelines/registration.js
  -> (20.1), (20.2), (21.1)
  + ~ (22.1) register(userData: #): #(Result) ...
```
**Shows:** Pure functions (`o`), composition (one function `(22.1)` depending on three others), and separation of pure/impure logic.

#### Declarative UI (HTML/CSS)
```scn
§ (30) login.html
  -> (31.0)
  ⛶ (30.1) form [ id:#login-form ]
    ⛶ (30.2) input [ class:.input ] -> (31.1)
    ⛶ (30.3) button [ class:.btn ] -> (31.2)

§ (31) login.css
  ¶ (31.1) .input { 📐 ✍ }
  ¶ (31.2) .btn { 📐 ✍ 💧 }
```
**Shows:** HTML hierarchy, `class` attributes linking directly to CSS rules, and CSS intent symbols summarizing the purpose of each rule.

---
````

## File: tsconfig.json
````json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    // Bundler mode
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,

    // Best practices
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,

    // Some stricter flags (disabled by default)
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
````

## File: package.json
````json
{
  "name": "scn-ts",
  "module": "index.ts",
  "type": "module",
  "private": true,
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
````

## File: README.md
````markdown
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
````
