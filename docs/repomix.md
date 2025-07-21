# Directory Structure
```
docs/
  scn.readme.md
  test.plan.md
src/
  index.ts
  serializer.ts
test/
  ts/
    integration/
      dependency-graph.test.ts
    unit/
      code-entities.test.ts
      general-structural.test.ts
  test.util.ts
package.json
tsconfig.json
```

# Files

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

## File: docs/test.plan.md
````markdown
# SCN-TS Test Plan

This document outlines the testing strategy for `scn-ts`, the reference implementation for Symbolic Context Notation. The tests are categorized by feature area and test type (unit, integration, e2e).

---

## 1. Core SCN Generation (JS/TS Parser)

This section focuses on the correctness of the SCN output for various JavaScript and TypeScript language features. These tests are primarily **unit tests**, feeding source code snippets to the parser and asserting the resulting SCN AST/string.

### 1.1. General & Structural Symbols

-   `[unit]` it should generate a `§` file declaration with a unique ID and correct relative path for each file.
-   `[unit]` it should assign unique, incrementing entity IDs within a file, starting from 1 (e.g., `(1.1)`, `(1.2)`).
-   `[unit]` it should represent a direct import of another entity with `-> (file_id.entity_id)`.
-   `[unit]` it should represent a dependency on an entire file (e.g., side-effect import `import './style.css'`) with a `.0` entity ID: `-> (file_id.0)`.
-   `[unit]` it should support linking to multiple entities on one line (e.g. `-> (3.1), (3.2)`).
-   `[integration]` it should resolve and add `<- (caller_file.caller_entity)` annotations to entities that are used by other entities.

### 1.2. Inter-File Dependency Graphs

-   `[integration]` it should add a summary of file-level dependencies on the `§` file declaration line itself (e.g., `§ (1) a.ts -> (2.0), (3.1)`).
-   `[integration]` it should add a summary of file-level callers on the `§` file declaration line (e.g., `§ (2) b.ts <- (1.0)`).
-   `[integration]` it should correctly resolve and represent a multi-step dependency chain across three or more files (e.g., `A.ts -> B.ts -> C.ts`).
-   `[integration]` it should resolve dependencies used inside a function's body and link them from that function's entity, not just from the file's top-level imports.

### 1.3. Code Entities (Classes, Functions, Variables)

-   `[unit]` it should represent a `class`, TypeScript `namespace`, or an exported object literal (module pattern) with the `◇` symbol.
-   `[unit]` it should represent an `interface` declaration with the `{}` symbol.
-   `[unit]` it should represent an `export function` with the `+ ~` symbols.
-   `[unit]` it should represent a `const myFunction = () => {}` with the `~` symbol.
-   `[unit]` it should represent a class `method` with the `~` symbol.
-   `[unit]` it should represent a class `property` or `field` with the `@` symbol.
-   `[unit]` it should represent a top-level `const` variable with the `@` symbol.
-   `[unit]` it should correctly handle `export default class/function`.

### 1.4. Type System Symbols

-   `[unit]` it should represent an `enum` with the `☰` symbol.
-   `[unit]` it should represent a `type` alias (`type ID = string`) with the `=:` symbol.
-   `[unit]` it should represent a type reference in a function signature or property with the `#` symbol (e.g., `id: string` becomes `id: #`).
-   `[unit]` it should correctly represent complex types like `Promise<User>` as `#(Promise<User>)`.

### 1.5. Function & Method Qualifiers

-   `[unit]` it should prefix `public` members with `+`.
-   `[unit]` it should prefix `private` members with `-`.
-   `[unit]` it should append `...` to an `async` function or method.
-   `[unit]` it should append `!` to a function that has a `throw` statement in its body.
-   `[unit]` it should correctly handle functions that are both `async` and can `throw` (e.g., `... !`).
-   `[unit]` it should append `o` to a pure function (one with no side-effects).

### 1.6. JS/TS Specifics (including JSX)

-   `[unit]` it should correctly parse a React functional component with props as `◇ (id) MyComponent { props: { p1:#, p2:# } }`.
-   `[unit]` it should represent a JSX element like `<button>` with the `⛶` symbol.
-   `[unit]` it should represent a JSX element's attributes of interest (e.g., `class`, `id`) inside brackets `[ ]`.
-   `[unit]` it should represent JSX hierarchy with indentation.
-   `[unit]` it should link a JSX element's `className` to a CSS file import.
-   `[unit]` it should correctly parse various export syntaxes (`export {}`, `export default`, `export * from`).
-   `[unit]` it should correctly parse various import syntaxes (`import X`, `import {Y}`, `import * as Z`).

### 1.7. CSS Parsing

-   `[unit]` it should generate a `¶` CSS Rule for each selector in a CSS file.
-   `[integration]` it should correctly create `-> (css_file.rule_id)` links from a `⛶` JSX element to the corresponding `¶` CSS rule based on `className` or `id`.
-   `[integration]` it should correctly create `<- (jsx_file.element_id)` links on a `¶` CSS rule pointing back to the `⛶` JSX element that uses it.
-   `[unit]` it should include the `📐` layout intent symbol for rules containing box model, flex, grid, or positioning properties.
-   `[unit]` it should include the `✍` text intent symbol for rules containing font or text styling properties.
-   `[unit]` it should include the `💧` appearance intent symbol for rules containing color, background, border, or shadow properties.
-   `[unit]` it should correctly handle a rule having multiple intents (e.g., `{ 📐 ✍ 💧 }`).

---

## 2. Programmatic API

This section focuses on testing the exposed Node.js API for programmatic use. These are primarily **integration tests**.

### 2.1. High-Level API (`generateScn`)

-   `[integration]` it should generate a valid SCN string given a set of `include` globs.
-   `[integration]` it should respect `exclude` patterns.
-   `[integration]` it should use the `project` tsconfig path for better type analysis.
-   `[integration]` it should throw an error for invalid options or non-existent files.

### 2.2. Low-Level API

-   `[integration]` `loadFiles`: it should correctly read files from disk based on glob patterns.
-   `[integration]` `parse`: it should take file content and produce an array of SCN ASTs.
-   `[integration]` `buildGraph`: it should take SCN ASTs and create a single, resolved graph with correct entity IDs and relationships.
-   `[integration]` `serializeGraph`: it should take a resolved graph and produce a spec-compliant SCN string.

---

## 3. Command-Line Interface (CLI)

This section covers the `scn-ts` executable. These are **end-to-end (e2e) tests** that run the CLI as a subprocess and inspect its output and side effects.

-   `[e2e]` it should process glob patterns provided as arguments.
-   `[e2e]` it should write the output to the file specified by `--output <path>` or `-o <path>`.
-   `[e2e]` it should print the output to stdout if no output path is given.
-   `[e2e]` it should respect the tsconfig file specified by `--project <path>` or `-p <path>`.
-   `[e2e]` it should respect the config file specified by `--config <path>` or `-c <path>`.
-   `[e2e]` it should override config file settings with CLI flags.
-   `[e2e]` it should display the correct version with `--version` or `-v`.
-   `[e2e]` it should display the help screen with `--help` or `-h`.
-   `[e2e]` it should exit with a non-zero code on error (e.g., file not found, parse error).

---

## 4. Configuration (`scn.config.js`)

This section tests the tool's ability to be configured via a `scn.config.js` file. These are **integration tests**.

-   `[integration]` it should automatically find and load `scn.config.js` from the project root.
-   `[integration]` it should correctly apply `include` patterns from the config.
-   `[integration]` it should correctly apply `exclude` patterns from the config, overriding includes.
-   `[integration]` it should use the `project` path from the config.
-   `[integration]` it should write to the `output` path specified in the config.

---

## 5. File System & Watch Mode

This section tests file system interactions, particularly watch mode. These are **e2e tests**.

-   `[e2e]` `--watch`: it should start in watch mode and perform an initial scan.
-   `[e2e]` `--watch`: it should re-generate the SCN map when a tracked file is modified.
-   `[e2e]` `--watch`: it should re-generate the SCN map when a new file matching the glob is added.
-   `[e2e]` `--watch`: it should re-generate the SCN map when a tracked file is deleted.
-   `[e2e]` it should handle file paths with spaces or special characters correctly.
````

## File: src/index.ts
````typescript
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
  /** Path to the project's tsconfig.json. (Not currently used by repograph) */
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
    // We can set other repograph options here if needed, e.g. rankingStrategy
  };
  const graph: RankedCodeGraph = await analyzeProject(repoGraphOptions);

  // 2. scn-ts serializes that graph into the SCN text format.
  const scnOutput = serializeGraph(graph, config.root);
  return scnOutput;
};
````

## File: src/serializer.ts
````typescript
import type {
  RankedCodeGraph,
  CodeNode,
  CodeEdge,
  CodeNodeVisibility as Visibility,
  CssIntent,
  CodeNodeType,
} from "repograph";
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

const isExported = (node: CodeNode, rootDir?: string): boolean => {
  if (node.type === 'file') return false;
  
  const sourceContent = getSourceContent(node.filePath, rootDir);
  if (!sourceContent) return false;
  
  // For class members (properties, methods), check if they're public by default
  // In TypeScript, class members are public by default unless marked private/protected
  if (node.type === 'property' || node.type === 'field' || node.type === 'method') {
    // Check if it's explicitly marked as private or protected
    const memberName = node.name.includes('.') ? node.name.split('.').pop() : node.name;
    const privatePattern = new RegExp(`private\\s+${memberName}\\b`);
    const protectedPattern = new RegExp(`protected\\s+${memberName}\\b`);
    
    if (privatePattern.test(sourceContent) || protectedPattern.test(sourceContent)) {
      return false;
    }
    // If not explicitly private/protected, it's public
    return true;
  }
  
  // Check for export patterns
  const exportPatterns = [
    new RegExp(`export\\s+class\\s+${node.name}\\b`),
    new RegExp(`export\\s+function\\s+${node.name}\\b`),
    new RegExp(`export\\s+interface\\s+${node.name}\\b`),
    new RegExp(`export\\s+namespace\\s+${node.name}\\b`),
    new RegExp(`export\\s+const\\s+${node.name}\\b`),
    new RegExp(`export\\s+let\\s+${node.name}\\b`),
    new RegExp(`export\\s+var\\s+${node.name}\\b`),
    new RegExp(`export\\s+default\\s+class\\s+${node.name}\\b`),
    new RegExp(`export\\s+default\\s+function\\s+${node.name}\\b`),
    new RegExp(`export\\s*{[^}]*\\b${node.name}\\b[^}]*}`),
  ];
  
  return exportPatterns.some(pattern => pattern.test(sourceContent));
};

const getVisibilitySymbol = (visibility?: Visibility, node?: CodeNode, rootDir?: string): '+' | '-' | undefined => {
  if (visibility === 'public') return '+';
  if (visibility === 'private') return '-';
  
  // If repograph doesn't provide visibility info, infer it from source
  if (node && isExported(node, rootDir)) {
    return '+';
  }
  
  return undefined;
};

const getNodeSymbol = (node: CodeNode): ScnSymbol => {
  // Heuristic: Treat uppercase constants/variables as containers (module pattern)
  if ((node.type === 'variable' || node.type === 'constant') && node.name.match(/^[A-Z]/)) {
      return '◇';
  }
  return ENTITY_TYPE_TO_SYMBOL[node.type] ?? '?';
};

const getQualifiers = (node: CodeNode, rootDir?: string): QualifierSymbol[] => {
  const qualifiers: QualifierSymbol[] = [];
  const visibilitySymbol = getVisibilitySymbol(node.visibility, node, rootDir);
  if (visibilitySymbol) qualifiers.push(visibilitySymbol);
  if (node.isAsync) qualifiers.push('...');
  if (node.canThrow) qualifiers.push('!');
  if (node.isPure) qualifiers.push('o');
  return qualifiers;
};

const formatCssIntents = (intents: readonly CssIntent[] = []): string => {
  if (intents.length === 0) return '';
  const symbols = intents.map(intent => CSS_INTENT_TO_SYMBOL[intent] ?? '');
  return `{ ${symbols.sort().join(' ')} }`;
};

const formatSignature = (node: CodeNode): string => {
  // For functions, format as name() instead of showing full code snippet
  if (node.type === 'function' || node.type === 'method' || node.type === 'constructor') {
    return '()';
  }
  
  // For arrow functions, show the arrow function syntax
  if (node.type === 'arrow_function' && node.codeSnippet) {
    // Clean up the arrow function display - remove variable name duplication
    const cleanSnippet = node.codeSnippet.replace(new RegExp(`^${node.name}\\s*=\\s*`), '');
    return cleanSnippet;
  }
  
  // For CSS rules, show intents
  if (node.type === 'css_rule' && node.cssIntents) {
    return formatCssIntents(node.cssIntents);
  }
  
  // For variables/constants, show the value if it's simple
  if ((node.type === 'variable' || node.type === 'constant') && node.codeSnippet) {
    // For uppercase constants that are treated as modules (◇ symbol), show different formatting
    if (/^[A-Z]/.test(node.name)) {
      // If it's an object literal, show it without = prefix (module pattern)
      if (node.codeSnippet.startsWith('{') && node.codeSnippet.endsWith('}')) {
        return node.codeSnippet;
      }
      // If it's a reference to another variable, don't show the assignment
      if (!node.codeSnippet.startsWith('{')) {
        return '';
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
  
  // For other container types, show their code snippet if available
  if (node.codeSnippet && (node.type === 'class' || node.type === 'interface' || node.type === 'namespace')) {
    return node.codeSnippet;
  }
  
  return '';
};

const formatNode = (node: CodeNode, graph: RankedCodeGraph, idManager: ScnIdManager, rootDir?: string): string => {
  const symbol = getNodeSymbol(node);
  const qualifiers = getQualifiers(node, rootDir).join(' ');
  const signature = formatSignature(node);
  const scnId = idManager.getScnId(node.id);
  const id = scnId ? `(${scnId})` : '';

  // Build the main line: qualifiers symbol id name signature
  const parts = [];
  if (qualifiers) parts.push(qualifiers);
  parts.push(symbol);
  if (id) parts.push(id);
  
  // For functions, combine name and signature without space
  if ((node.type === 'function' || node.type === 'method' || node.type === 'constructor') && signature === '()') {
    // For class methods, use just the method name, not the qualified name
    const displayName = node.name.includes('.') ? node.name.split('.').pop() || node.name : node.name;
    parts.push(displayName + signature);
  } else if (node.type === 'arrow_function') {
    // For arrow functions, show name and the arrow function syntax
    parts.push(node.name);
    if (signature) {
      parts.push(signature);
    }
  } else {
    // For properties and other entities, use just the simple name
    const displayName = (node.type === 'property' || node.type === 'field') && node.name.includes('.') 
      ? node.name.split('.').pop() || node.name 
      : node.name;
    parts.push(displayName);
    if (signature) parts.push(signature);
  }
  
  const mainLine = parts.join(' ');

  const formatLinks = (prefix: string, edges: readonly CodeEdge[]): string => {
    if (edges.length === 0) return '';
    const links = edges.map(edge => {
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
    }).sort().join(', ');
    return `\n    ${prefix} ${links}`;
  };

  const dependencyEdges = graph.edges.filter(edge => edge.fromId === node.id);
  const callerEdges = graph.edges.filter(edge => edge.toId === node.id && edge.type !== 'imports');

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
    const links = edges.map(edge => {
      const targetId = prefix === '->' ? edge.toId : edge.fromId;
      const targetScnId = idManager.getScnId(targetId);
      return `(${targetScnId}.0)`;
    }).sort().join(', ');
    return ` ${prefix} ${links}`;
  };

  const fileDependencies = graph.edges.filter(e => e.type === 'imports' && e.fromId === fileNode.id);
  const fileCallers = graph.edges.filter(e => e.type === 'imports' && e.toId === fileNode.id);

  let header = `§ (${scnId}) ${fileNode.filePath}`;
  header += formatFileLinks('->', fileDependencies);
  header += formatFileLinks('<-', fileCallers);

  const nodeLines = symbols.map(node => formatNode(node, graph, idManager, rootDir));

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
    // Sorting is now handled inside the ID manager's constructor to ensure consistent IDs.
    return serializeFile(fileNode, symbols, graph, idManager, rootDir);
  });

  return scnParts.join('\n\n');
};
````

## File: test/ts/integration/dependency-graph.test.ts
````typescript
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
    // main.ts is file 1, its function 'main' is entity 1.1
    // util.ts is file 2, its function 'helper' is entity 2.1
    expect(utilScn).toContain('+ ~ (2.1) helper()\n    <- (1.1)');
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

    expect(scn).toContain('§ (1) config.ts <- (3.0)');
    expect(scn).toContain('§ (2) main.ts -> (3.0)');
    expect(scn).toContain('§ (3) service.ts -> (1.0) <- (2.0)');
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

    // File-level links
    expect(scn).toContain('§ (1) a.ts -> (2.0)');
    expect(scn).toContain('§ (2) b.ts -> (3.0) <- (1.0)');
    expect(scn).toContain('§ (3) c.ts <- (2.0)');

    // Entity-level links
    const aScn = scn.split('\n\n').find(s => s.includes('a.ts'));
    const bScn = scn.split('\n\n').find(s => s.includes('b.ts'));
    const cScn = scn.split('\n\n').find(s => s.includes('c.ts'));

    expect(aScn).toContain('~ (1.1) run()\n    -> (2.1)'); // run() in a.ts uses B from b.ts
    expect(bScn).toContain('+ ◇ (2.1) B\n    -> (3.1)\n    <- (1.1)'); // B in b.ts uses C from c.ts and is used by run() from a.ts
    expect(cScn).toContain('+ ◇ (3.1) C\n    <- (2.1)'); // C is used by B
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
    expect(mainScn).toContain('~ (1.1) run()\n    -> (2.1)');
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
    expect(mainScn).toContain('+ ~ (1.1) run()\n    -> (2.1), (2.2)');
  });
});
````

## File: test/ts/unit/code-entities.test.ts
````typescript
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
    expect(scn).toContain('+ ◇ (1.1) MyClass');
  });

  it('should represent a namespace with ◇', async () => {
    project = await setupTestProject({ 'test.ts': `export namespace MyNamespace {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('+ ◇ (1.1) MyNamespace');
  });

  it('should represent an exported uppercase object literal (module pattern) with ◇', async () => {
    project = await setupTestProject({ 'test.ts': `export const MyModule = { key: 'value' };` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain(`+ ◇ (1.1) MyModule { key: 'value' }`);
  });

  it('should represent an interface with {}', async () => {
    project = await setupTestProject({ 'test.ts': `export interface MyInterface {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('+ {} (1.1) MyInterface');
  });

  it('should represent an export function with + ~', async () => {
    project = await setupTestProject({ 'test.ts': `export function myFunc() {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('+ ~ (1.1) myFunc()');
  });

  it('should represent a const arrow function with ~', async () => {
    project = await setupTestProject({ 'test.ts': `const myFunc = () => {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('~ (1.1) myFunc () => {}');
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
    expect(scn).toContain('+ @ (1.2) myProp');
    expect(scn).toContain('+ ~ (1.3) myMethod()');
  });

  it('should represent a top-level const with @', async () => {
    project = await setupTestProject({ 'test.ts': `const myVar = 123;` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    // Note: repograph represents this as a "variable" and heuristic makes it not a container
    expect(scn).toContain('@ (1.1) myVar = 123');
  });

  it('should correctly handle export default class', async () => {
    project = await setupTestProject({ 'test.ts': `export default class MyClass {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('+ ◇ (1.1) MyClass');
  });

  it('should correctly handle export default function', async () => {
    project = await setupTestProject({ 'test.ts': `export default function myFunc() {}` });
    const scn = await generateScn({
      root: project.projectDir,
      include: [`**/*.ts`],
    });
    expect(scn).toContain('+ ~ (1.1) myFunc()');
  });
});
````

## File: test/ts/unit/general-structural.test.ts
````typescript
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

    expect(scn).toContain('§ (1) a.ts -> (2.0)');
    expect(scn).toContain('§ (2) b.ts <- (1.0)');
  });
});
````

## File: test/test.util.ts
````typescript
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
````

## File: package.json
````json
{
  "name": "scn-ts",
  "module": "src/index.ts",
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

    // Path mapping for local development
    "baseUrl": ".",
    "paths": {
      "repograph": ["repograph/src/index.ts"]
    },

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
  },
  "include": ["src", "test"],
  "exclude": ["node_modules", "dist"]
}
````
