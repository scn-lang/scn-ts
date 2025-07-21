# Directory Structure
```
docs/
  scn.readme.md
  test.plan.md
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

## File: package.json
````json
{
  "name": "scn-ts",
  "module": "src/index.ts",
  "type": "module",
  "private": true,
  "dependencies": {
    "repograph": "^0.1.3"
  },
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
