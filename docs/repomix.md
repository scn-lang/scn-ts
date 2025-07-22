# Directory Structure
```
docs/
  scn.readme.md
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
      jsx.test.ts new
      qualifiers.test.ts new
      type-system.test.ts new
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

## File: src/cli.ts
````typescript
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
  CodeEdge as RepographEdge,
  CodeNodeVisibility as Visibility,
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

  // In TypeScript, class members are public by default.
  if (node && (node.type === 'method' || node.type === 'property' || node.type === 'field')) {
      const source = getSourceContent(node.filePath, rootDir);
      // A simple check to see if it is explicitly private/protected. If not, it's public.
      const line = (source.split('\n')[node.startLine - 1] || '').trim();
      if (!line.startsWith('private') && !line.startsWith('protected')) {
        return '+';
      }
  }

  // If repograph doesn't provide visibility info, infer it from source for other types
  if (node && isExported(node, rootDir)) {
    return '+';
  }

  return undefined;
};

const getNodeSymbol = (node: CodeNode): ScnSymbol => {
  // Heuristic: Treat PascalCase functions as components (e.g., React)
  if ((node.type === 'function' || node.type === 'arrow_function') && /^[A-Z]/.test(node.name)) {
    return '◇';
  }
  // Heuristic: Treat uppercase constants/variables as containers (module pattern)
  if ((node.type === 'variable' || node.type === 'constant') && /^[A-Z]/.test(node.name)) {
    return '◇';
  }
  return ENTITY_TYPE_TO_SYMBOL[node.type] ?? '?';
};

const getQualifiers = (node: CodeNode, rootDir?: string): { access?: '+' | '-'; others: QualifierSymbol[] } => {
  const qualifiers: { access?: '+' | '-'; others: QualifierSymbol[] } = { others: [] };
  const visibilitySymbol = getVisibilitySymbol(node.visibility, node, rootDir);
  if (visibilitySymbol) qualifiers.access = visibilitySymbol;

  const others: QualifierSymbol[] = [];
  if (node.isAsync) others.push('...');
  if (node.canThrow) others.push('!');
  if (node.isPure) others.push('o');
  qualifiers.others = others;
  
  return qualifiers;
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
    
    return attrs.length > 0 ? ` [ ${attrs.join(' ')} ]` : '';
}

const formatSignature = (node: CodeNode): string => {
  const isComponent = (node.type === 'function' || node.type === 'arrow_function') && /^[A-Z]/.test(node.name);

  if (isComponent && node.codeSnippet) {
    const propMatch = node.codeSnippet.match(/\(\s*\{([^}]+)\}/);
    if (propMatch?.[1]) {
      const props = propMatch[1].split(',').map(p => p.trim().split(/[:=]/)[0]?.trim()).filter(Boolean);
      const propsString = props.map(p => `${p}:#`).join(', ');
      return `{ props: { ${propsString} } }`;
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
  
  // For other container types, show their code snippet if available
  if (node.codeSnippet && (node.type === 'class' || node.type === 'interface' || node.type === 'namespace')) {
    return node.codeSnippet;
  }
  
  return '';
};

const formatNode = (node: CodeNode, graph: RankedCodeGraph, idManager: ScnIdManager, rootDir?: string, level = 0): string => {
  const symbol = getNodeSymbol(node);
  const { access, others } = getQualifiers(node, rootDir);
  const signature = formatSignature(node);
  const scnId = idManager.getScnId(node.id);
  const id = scnId ? `(${scnId})` : '';
  const indent = '  '.repeat(level + 1);

  // Build the main line: qualifiers symbol id name signature
  const parts = [];
  if (access) parts.push(access);
  parts.push(symbol);
  if (id) parts.push(id);

  // For functions, combine name and signature without space, unless it's a component
  const isComponent = (node.type === 'function' || node.type === 'arrow_function') && /^[A-Z]/.test(node.name);
  if ((node.type === 'function' || node.type === 'method' || node.type === 'constructor' || node.type === 'arrow_function') && !isComponent) {
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
    mainLine += ` ${others.sort().join(' ')}`;
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
  const callerEdges = (graph.edges as CodeEdge[]).filter(edge => edge.toId === node.id && edge.type !== 'imports' && edge.type !== 'contains');

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
      const targetScnId = idManager.getScnId(targetId);
      return `(${targetScnId}.0)`;
    }).sort().join(', ');
    if (!links) return '';
    return `\n  ${prefix} ${links}`;
  };

  const fileDependencies = graph.edges.filter(e => e.type === 'imports' && e.fromId === fileNode.id);
  const fileCallers = graph.edges.filter(e => e.type === 'imports' && e.toId === fileNode.id);

    const formattedPath = fileNode.filePath.includes(' ') ? `"${fileNode.filePath}"` : fileNode.filePath;
    let header = `§ (${scnId}) ${formattedPath}`;
  const fileDepLine = formatFileLinks('->', fileDependencies);
  if (fileDepLine) header += fileDepLine;
  const fileCallerLine = formatFileLinks('<-', fileCallers);
  if (fileCallerLine) header += fileCallerLine;

  // Hierarchical rendering
  const nodeWrappers = symbols.map(s => ({ node: s, children: [] as {node: CodeNode, children: any[]}[] })).sort((a,b) => a.node.startLine - b.node.startLine);
  const nodeMap = new Map(nodeWrappers.map(w => [w.node.id, w]));
  const topLevelSymbols: typeof nodeWrappers = [];

  for (let i = 0; i < nodeWrappers.length; i++) {
    const currentWrapper = nodeWrappers[i];
    if (!currentWrapper) continue;
    let parentWrapper = null;
    
    // Find the tightest parent by looking backwards through the sorted list
    for (let j = i - 1; j >= 0; j--) {
        const potentialParentWrapper = nodeWrappers[j];
        if (!potentialParentWrapper) continue;
        if (currentWrapper.node.startLine >= potentialParentWrapper.node.startLine && currentWrapper.node.endLine <= potentialParentWrapper.node.endLine) {
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
````

## File: test/ts/e2e/cli.test.ts
````typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { setupTestProject, type TestProject } from '../../test.util';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { version } from '../../../package.json';

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
    
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', 'a.ts'], {
      cwd: project.projectDir,
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exitCode;

    expect(exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
    expect(stdout).not.toContain('b.ts');
    expect(stderr).toContain('[SCN-TS] Analyzing project...');
  });
  
  it('should write the output to the file specified by --output', async () => {
    project = await setupTestProject({ 'a.ts': 'export const A = 1;' });
    const outputPath = join(project.projectDir, 'output.scn');

    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', 'a.ts', '--output', outputPath], {
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

    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', 'Comp.tsx', '-p', 'tsconfig.test.json'], {
      cwd: project.projectDir,
    });
    
    const stdout = await new Response(proc.stdout).text();
    expect(await proc.exitCode).toBe(0);
    expect(stdout).toContain('⛶ (1.2) div');
  });

  it('should display the correct version with --version', async () => {
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', '--version']);
    const stdout = await new Response(proc.stdout).text();
    expect(stdout.trim()).toBe(version);
  });
  
  it('should display the help screen with --help', async () => {
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', '--help']);
    const stdout = await new Response(proc.stdout).text();
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('--output <path>');
  });
  
  it('should exit with a non-zero code on error', async () => {
    project = await setupTestProject({}); // Empty project
    
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', 'nonexistent.ts'], {
      cwd: project.projectDir,
    });

    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exitCode;
    
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('Error');
  });
});
````

## File: test/ts/e2e/config-file.test.ts
````typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { setupTestProject, type TestProject } from '../../test.util';
import { readFile } from 'fs/promises';
import { join } from 'path';

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
    
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts'], { cwd: project.projectDir });
    const stdout = await new Response(proc.stdout).text();
    
    expect(await proc.exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
    expect(stdout).not.toContain('b.ts');
  });
  
  it('should correctly apply `exclude` patterns from the config', async () => {
    project = await setupTestProject({
      'a.ts': 'const a = 1;',
      'b.ignore.ts': 'const b = 2;',
      'scn.config.js': `export default { include: ['**/*.ts'], exclude: ['**/*.ignore.ts'] };`,
    });
    
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts'], { cwd: project.projectDir });
    const stdout = await new Response(proc.stdout).text();
    
    expect(await proc.exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
    expect(stdout).not.toContain('b.ignore.ts');
  });

  it('should write to the `output` path specified in the config', async () => {
    const outputPath = 'dist/output.scn';
    project = await setupTestProject({
      'a.ts': 'const a = 1;',
      'scn.config.js': `import {mkdirSync} from 'fs'; mkdirSync('dist'); export default { include: ['a.ts'], output: '${outputPath}' };`,
    });
    
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts'], { cwd: project.projectDir });
    await proc.exited;

    expect(await proc.exitCode).toBe(0);
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
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', 'b.ts', '-o', cliOutputPath], {
      cwd: project.projectDir,
    });
    await proc.exited;

    expect(await proc.exitCode).toBe(0);

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
    
    const proc = Bun.spawn(['bun', 'run', 'src/cli.ts', '-c', 'config/my.config.js'], { cwd: project.projectDir });
    const stdout = await new Response(proc.stdout).text();
    
    expect(await proc.exitCode).toBe(0);
    expect(stdout).toContain('§ (1) a.ts');
  });
});
````

## File: test/ts/e2e/filesystem.test.ts
````typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { setupTestProject, type TestProject } from '../../test.util';
import { readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';

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

    watcherProc = Bun.spawn(['bun', 'run', 'src/cli.ts', '--watch', '-o', outputPath, '**/*.ts'], {
      cwd: project.projectDir,
    });

    // 1. Wait for initial generation
    await waitForFileContent(outputPath, 'A = 1');
    const initialContent = await readFile(outputPath, 'utf-8');
    expect(initialContent).toContain('§ (1) a.ts');
    expect(initialContent).toContain('@ (1.1) A = 1');
    
    // 2. Modify the file
    await writeFile(join(project.projectDir, 'a.ts'), 'export const A = 42;');

    // 3. Wait for re-generation
    await waitForFileContent(outputPath, 'A = 42');
    const updatedContent = await readFile(outputPath, 'utf-8');
    expect(updatedContent).toContain('@ (1.1) A = 42');
  });

  it('--watch: should re-generate when a new file matching the glob is added', async () => {
    project = await setupTestProject({
      'a.ts': 'export const A = 1;',
    });
    const outputPath = join(project.projectDir, 'output.scn');

    watcherProc = Bun.spawn(['bun', 'run', 'src/cli.ts', '--watch', '-o', outputPath, '**/*.ts'], {
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

    watcherProc = Bun.spawn(['bun', 'run', 'src/cli.ts', '--watch', '-o', outputPath, '**/*.ts'], {
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
      '"my component".ts': 'export const MyComponent = 1;',
    });
    const outputPath = join(project.projectDir, '"output with spaces".scn');
    
    const proc = Bun.spawn(
      ['bun', 'run', 'src/cli.ts', '"my component".ts', '-o', '"output with spaces".scn'],
      { cwd: project.projectDir }
    );
    await proc.exited;

    expect(await proc.exitCode).toBe(0);
    const outputContent = await readFile(outputPath, 'utf-8');
    expect(outputContent).toContain('§ (1) "\\"my component\\".ts"');
  });
});
````

## File: test/ts/integration/css-parsing.test.ts
````typescript
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
    expect(tsxScn!).toContain('§ (2) Button.tsx\n  -> (2.0)');

    // Check entity-level links
    // ⛶ button (2.2) should link to both .btn (1.1) and .btn-primary (1.2)
    expect(tsxScn!).toContain('    ⛶ (2.2) button  [ class:.btn .btn-primary ]\n      -> (1.1), (1.2)');
    
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
    expect(tsxScn!).toContain('    ⛶ (2.2) div  [ id:#main-container ]\n      -> (1.1)');
    // ¶ #main-container (1.1) should link back to ⛶ div (2.2)
    expect(cssScn!).toContain('  ¶ (1.1) #main-container { 💧 }\n    <- (2.2)');
  });
});
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
````

## File: test/ts/integration/programmatic-api.test.ts
````typescript
import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { serializeGraph } from '../../../src/serializer';
import { setupTestProject, type TestProject } from '../../test.util';
import type { RankedCodeGraph, CodeNode, CodeEdge as RepographEdge } from 'repograph';
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
      expect(scn).toContain('+ ◇ (1.1) Button()');
      expect(scn).toContain('⛶ (1.2) button');
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

        const graph: RankedCodeGraph = { nodes, edges: edges as any };

        const scnOutput = serializeGraph(graph);
        
        const expectedScn = [
            '§ (1) a.ts\n  -> (2.0)\n  + ~ (1.1) funcA()\n    -> (2.1)',
            '§ (2) b.ts\n  <- (1.0)\n  + ~ (2.1) funcB()\n    <- (1.1)'
        ].join('\n\n');
        
        expect(scnOutput).toBe(expectedScn);
    });
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

    expect(scn).toContain('§ (1) a.ts\n  -> (2.0)');
    expect(scn).toContain('§ (2) b.ts\n  <- (1.0)');
  });
});
````

## File: test/ts/unit/jsx.test.ts new
````
import { describe, it, expect, afterEach } from 'bun:test';
import { generateScn } from '../../../src/index';
import { setupTestProject, type TestProject } from '../../test.util';

describe('SCN Generation: 1.6 JS/TS Specifics (JSX)', () => {
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
    // Note: attribute order might vary, so we check for parts
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
    expect(h1Index).toBe(mainIndex + 1); // h1 is the next line
    
    const mainIndentation = lines[mainIndex].match(/^\s*/)?.[0].length ?? 0;
    const h1Indentation = lines[h1Index].match(/^\s*/)?.[0].length ?? 0;
    
    expect(h1Indentation).toBeGreaterThan(mainIndentation);
  });

  // These tests are from 1.6 in the test plan, covering import/export
  it('should correctly parse various export syntaxes', async () => {
    project = await setupTestProject({
      'mod.ts': `
        const a = 1;
        function b() {}
        export { a, b };
        export * from './another';
      `,
      'another.ts': 'export const c = 3;',
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    const modScn = scn.split('\n\n').find(s => s.includes('mod.ts'));
    expect(modScn).toContain('§ (2) mod.ts -> (1.0)'); // depends on another.ts
    expect(modScn).toContain('@ (2.1) a = 1');
    expect(modScn).toContain('~ (2.2) b()');
  });

  it('should correctly parse various import syntaxes', async () => {
    project = await setupTestProject({
      'util.ts': `
        export const val = 1;
        export function func() {}
        export default class MyClass {}
      `,
      'main.ts': `
        import MyClass from './util';
        import { val } from './util';
        import * as utils from './util';
        
        new MyClass();
        console.log(val);
        utils.func();
      `
    });
    const scn = await generateScn({ root: project.projectDir, include: ['**/*.ts'] });
    const mainScn = scn.split('\n\n').find(s => s.includes('main.ts'));
    expect(mainScn).toContain('§ (1) main.ts -> (2.0)');
    // Check for entity-level dependencies within the file's content
    expect(mainScn).toContain('-> (2.3)'); // uses MyClass
    expect(mainScn).toContain('-> (2.1)'); // uses val
    expect(mainScn).toContain('-> (2.2)'); // uses func via utils.*
  });
});
````

## File: test/ts/unit/qualifiers.test.ts new
````
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
````

## File: test/ts/unit/type-system.test.ts new
````
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
  
  it('should represent a function return type with #()', async () => {
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
  "version": "1.0.0",
  "name": "scn-ts",
  "module": "src/index.ts",
  "bin": {
    "scn-ts": "src/cli.ts"
  },
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
