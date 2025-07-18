# scn-js

[![NPM Version](https://img.shields.io/npm/v/scn-js.svg)](https://www.npmjs.com/package/scn-js)
[![Spec Version](https://img.shields.io/badge/SCN%20Spec-v1.0-blue.svg)](https://github.com/scn-lang/scn)
[![Build Status](https://img.shields.io/github/actions/workflow/status/scn-lang/scn-js/ci.yml?branch=main)](https://github.com/scn-lang/scn-js/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discussions](https://img.shields.io/badge/Discussions-Join_Here-green.svg)](https://github.com/scn-lang/scn/discussions)

**`scn-js` is the official generator for Symbolic Context Notation (SCN) from JavaScript and TypeScript codebases.**

It's a command-line tool and programmatic library that analyzes your project's structure—classes, functions, types, interfaces, and their relationships across files—and outputs a hyper-efficient SCN map. This map is designed to be fed directly into Large Language Models (LLMs), giving them unparalleled architectural context at a fraction of the token cost of raw source code.

This tool is your bridge over the "Context Chasm," enabling smarter, faster, and more accurate AI-assisted development.

## Table of Contents

1.  [**What is SCN?**](#1-what-is-scn)
2.  [**Features**](#2-features)
3.  [**Installation**](#3-installation)
4.  [**Quick Start: CLI Usage**](#4-quick-start-cli-usage)
5.  [**How It Works**](#5-how-it-works)
6.  [**Detailed Examples**](#6-detailed-examples)
    *   [Example 1: TypeScript Class](#example-1-typescript-class)
    *   [Example 2: React Component (TSX)](#example-2-react-component-tsx)
    *   [Example 3: Multi-File Dependency Graph](#example-3-multi-file-dependency-graph)
7.  [**Configuration (`scn.config.js`)**](#7-configuration-scnconfigjs)
8.  [**Command-Line Interface (CLI)**](#8-command-line-interface-cli)
9.  [**Programmatic API**](#9-programmatic-api)
10. [**Advanced: JSDoc Tag Support**](#10-advanced-jsdoc-tag-support)
11. [**Roadmap & Contributing**](#11-roadmap--contributing)
12. [**License**](#12-license)

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

*   **Comprehensive Language Support:** First-class support for **TypeScript** and modern **JavaScript** (ESM, CJS).
*   **Framework Aware:** Natively understands **JSX/TSX** syntax for React, Preact, Solid, etc.
*   **Project-Wide Analysis:** Scans your entire project to build a complete dependency graph, mapping imports/exports (`->`) and call sites (`<-`).
*   **Rich Type Parsing:** Accurately represents `class`, `interface`, `type`, `enum`, and complex generic types.
*   **Flexible Usage:** Can be used as a powerful **CLI tool** for one-off generation or integrated into your toolchain via its **Programmatic API**.
*   **Highly Configurable:** Use a `scn.config.js` file to define include/exclude patterns, project paths, and more.
*   **Watch Mode:** Automatically re-generate the SCN map on file changes for a seamless development experience.

## 3. Installation

`scn-js` is a development dependency, as it's part of your development and build process.

```bash
# Using Bun
bun i -D scn-js

# Using NPM
npm install --save-dev scn-js

# Using Yarn
yarn add --dev scn-js
```

## 4. Quick Start: CLI Usage

The easiest way to get started is to run `scn-js` from the command line in the root of your project.

1.  **Navigate to your project directory.**
2.  **Run the generator:**

    ```bash
    npx scn-js "src/**/*.{ts,tsx,js,jsx}" --output context.scn
    ```

This command will:
*   Find all `.ts`, `.tsx`, `.js`, and `.jsx` files inside your `src/` directory.
*   Analyze their structure and dependencies.
*   Generate a single `context.scn` file in your project root containing the complete SCN map.

You can now copy the contents of `context.scn` and paste it at the beginning of your LLM prompt to provide massive, high-quality context.

## 5. How It Works

`scn-js` is not a simple regex-based tool. It performs a deep, semantic analysis of your code using the same technology that powers your IDE and the TypeScript compiler.

1.  **Parsing:** The tool leverages the **TypeScript Compiler API** to parse every matched file into an Abstract Syntax Tree (AST). This provides a rich, structured understanding of your code, including types.
2.  **Indexing Pass (First Pass):** It traverses the AST of every file to identify and index all major entities: classes (`◇`), functions (`~`), interfaces (`{}`), type aliases (`=:`), enums (`☰`), and top-level variables (`@`). Each entity is assigned a unique, stable ID like `(file_id.entity_id)`.
3.  **Dependency Resolution (Second Pass):** The tool makes a second pass to resolve relationships. It analyzes `import`/`export` statements, function calls, and `new` expressions to build the dependency graph, creating the crucial `->` (dependency) and `<-` (caller) links between entities.
4.  **Serialization:** Finally, this in-memory graph of your project is serialized into the ultra-compact SCN text format, adhering strictly to the [SCN Specification](https://github.com/scn-lang/scn).

This two-pass approach ensures that all relationships can be resolved, even with complex circular dependencies between files.

## 6. Detailed Examples

### Example 1: TypeScript Class

**Source Code (`src/services/auth.ts`, 86 tokens):**
```typescript
import { Database } from '../db';
import { User } from '../models/user';

export class AuthService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Logs a user in.
   * @throws {Error} if login fails.
   */
  public async login(email: string, pass: string): Promise<User> {
    // ... complex implementation details ...
    if (!email) throw new Error("Email required");
    return {} as User;
  }
}
```

**Generated SCN (`context.scn`, 24 tokens - 72% reduction):**
```scn
§ (1) src/services/auth.ts
  -> (db.ts), (models/user.ts)
  ◇ (1.1) AuthService
    - @ db: #(Database)
    + ~ login(email: #, pass: #): #(User) ...!
```
**Analysis:** The SCN captures the public API (`+ ~ login`), its async nature (`...`), its potential to throw an error (`!`), its private field (`- @ db`), and its file-level dependencies, all while discarding the noisy implementation logic.

### Example 2: React Component (TSX)

**Source Code (`src/components/ProfileCard.tsx`, 68 tokens):**
```tsx
import './ProfileCard.css';

interface ProfileCardProps {
  userId: string;
  onFollow: (id: string) => void;
}

export const ProfileCard = ({ userId, onFollow }: ProfileCardProps) => {
  return (
    <div className="profile-card" onClick={() => onFollow(userId)}>
      <img className="profile-avatar" />
      <p>User ID: {userId}</p>
    </div>
  );
};
```

**Generated SCN (`context.scn`, 31 tokens - 54% reduction):**
```scn
§ (2) src/components/ProfileCard.tsx
  -> (ProfileCard.css)
  { (2.1) ProfileCardProps
    @ userId: #(string)
    @ onFollow: #(function)
  }
  ◇ (2.2) ProfileCard { props:#(2.1) }
    ⛶ (2.3) div [ class:.profile-card ]
      ⛶ (2.4) img [ class:.profile-avatar ]
      ⛶ (2.5) p
```
**Analysis:** `scn-js` understands JSX. It maps the props interface (`{}`), the component itself (`◇`), and the HTML-like element tree (`⛶`). It even notes the `className` attributes, which are crucial clues for an LLM when asked to modify styling.

### Example 3: Multi-File Dependency Graph

**`src/utils/string.ts`:**
```typescript
export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
```

**`src/user/service.ts`:**
```typescript
import { capitalize } from '../utils/string';

export function formatUserName(name: string) {
  return capitalize(name);
}
```

**Generated SCN (`context.scn`, 26 tokens):**
```scn
§ (3) src/utils/string.ts
  <- (4.1)
  + ~ (3.1) capitalize(s: #): #(string)

§ (4) src/user/service.ts
  -> (3.1)
  + ~ (4.1) formatUserName(name: #)
    -> (3.1)
```
**Analysis:** This demonstrates the core power of SCN. The `<- (4.1)` link on `capitalize` tells the LLM that `formatUserName` uses it. The `-> (3.1)` link on `formatUserName` explicitly shows the dependency. The LLM can now trace logic across the entire codebase without needing to see the source of both files simultaneously.

## 7. Configuration (`scn.config.js`)

For more control, you can create a `scn.config.js` file in your project root.

```javascript
// scn.config.js
module.exports = {
  /**
   * Path to your tsconfig.json file.
   * This is highly recommended for TypeScript projects to ensure
   * correct type analysis and path alias resolution.
   */
  project: './tsconfig.json',

  /**
   * An array of glob patterns to include.
   * @default ["**/*.{js,ts,jsx,tsx}"]
   */
  include: [
    'src/**/*.{ts,tsx}',
    'lib/**/*.ts',
  ],

  /**
   * An array of glob patterns to exclude.
   * node_modules and output file are always excluded.
   * @default ["**/*.d.ts", "**/*.test.ts", "**/*.spec.ts"]
   */
  exclude: [
    'src/generated/**/*',
    '**/*.stories.tsx',
  ],

  /**
   * The path to the output SCN file.
   * @default "context.scn"
   */
  output: 'ai-context.scn',
};
```

`scn-js` will automatically detect and use this configuration file if it exists.

## 8. Command-Line Interface (CLI)

You can override any configuration setting with command-line flags.

```
npx scn-js [globs...] [options]
```

**Arguments:**
*   `[globs...]`: (Optional) Space-separated glob patterns. If provided, they override the `include` setting in the config file.

**Options:**
| Flag                  | Alias | Description                                                        |
| --------------------- | ----- | ------------------------------------------------------------------ |
| `--output <path>`     | `-o`  | Specify the output file path.                                      |
| `--project <path>`    | `-p`  | Path to the `tsconfig.json`. Essential for TS projects.            |
| `--watch`             | `-w`  | Watch files for changes and re-generate SCN automatically.         |
| `--config <path>`     | `-c`  | Path to a custom config file.                                      |
| `--version`           | `-v`  | Display the version number.                                        |
| `--help`              | `-h`  | Display the help screen.                                           |

## 9. Programmatic API

For advanced integrations, you can use `scn-js` as a library.

```typescript
import { generateScn } from 'scn-js';
import path from 'path';

async function buildAiContext() {
  try {
    const scnOutput = await generateScn({
      // Options are identical to the config file
      project: path.resolve(__dirname, 'tsconfig.json'),
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.spec.ts'],
    });

    console.log('Generated SCN Map:');
    console.log(scnOutput);
    
    // Or write it to a file
    // await fs.promises.writeFile('context.scn', scnOutput, 'utf-8');

  } catch (error) {
    console.error('Failed to generate SCN:', error);
  }
}

buildAiContext();
```

## 10. Advanced: JSDoc Tag Support

To enhance the SCN output, `scn-js` recognizes specific JSDoc tags to add function qualifiers:

*   **`!` (Throws):** Add `@throws` to your function's JSDoc to indicate it can throw an error.

    ```typescript
    /** @throws {AuthError} If the user is not found. */
    function findUser() { /* ... */ }
    // SCN: ~ findUser() ! 
    ```

*   **`o` (Pure):** Add `@pure` to your function's JSDoc to indicate it has no side effects. This is a powerful hint for an LLM.

    ```typescript
    /** @pure */
    function calculateTotal(items) { /* ... */ }
    // SCN: ~ calculateTotal(items: #) o
    ```

## 11. Roadmap & Contributing

The SCN standard and the `scn-js` tool are actively evolving. We welcome community contributions.

**`scn-js` Roadmap:**
*   [ ] Deeper analysis for CSS Modules and Styled Components to create more explicit style links.
*   [ ] Enhanced caller detection (`<-`) to trace function usage within other function bodies.
*   [ ] Performance optimizations for extremely large codebases (>1M LOC).
*   [ ] Plugin architecture to allow for custom language extensions (e.g., Vue, Svelte).

**How to Contribute:**
1.  **Discussions:** Have an idea or a question? Start a conversation on [GitHub Discussions](https://github.com/scn-lang/scn/discussions).
2.  **Issues:** Find a bug or want to request a feature? [Open an issue](https://github.com/scn-lang/scn-js/issues).
3.  **Pull Requests:** Fork the repository, make your changes, and submit a PR. Please ensure your code is formatted and passes existing tests.

## 12. License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.