# Directory Structure
```
docs/
  scn.readme.md
repograph/
  src/
    pipeline/
      analyze.ts
    tree-sitter/
      queries.ts
    index.ts
    types.ts
  test/
    e2e/
      cli.test.ts
    integration/
      multi-language.test.ts
    unit/
      analyze.test.ts
      codenode-qualifiers.test.ts
  package.json
  tsconfig.build.json
  tsconfig.json
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

## File: repograph/src/pipeline/analyze.ts
````typescript
import path from 'node:path';
import { createParserForLanguage } from '../tree-sitter/languages.js';
import { getLanguageConfigForFile, type LanguageConfig } from '../tree-sitter/language-config.js';
import type { Analyzer, CodeNode, CodeNodeType, CodeNodeVisibility, FileContent, CodeEdge } from '../types.js';
import type { Node as TSNode, QueryCapture as TSMatch } from 'web-tree-sitter';
import { logger } from '../utils/logger.util.js';
import { ParserError } from '../utils/error.util.js';

// --- UTILITY FUNCTIONS ---

const getNodeText = (node: TSNode, content: string): string => content.slice(node.startIndex, node.endIndex);
const getLineFromIndex = (content: string, index: number): number => content.substring(0, index).split('\n').length;
const normalizePath = (p: string): string => p.replace(/\\/g, '/');

// --- LANGUAGE-SPECIFIC LOGIC ---

type LanguageHandler = {
  preProcessFile?: (file: FileContent, captures: TSMatch[]) => Record<string, any>;
  shouldSkipSymbol: (node: TSNode, symbolType: CodeNodeType, langName: string) => boolean;
  getSymbolNameNode: (declarationNode: TSNode, originalNode: TSNode) => TSNode | null;
  processComplexSymbol?: (context: ProcessSymbolContext) => boolean;
  parseParameters?: (paramsNode: TSNode, content: string) => { name: string; type?: string }[];
  resolveImport: (fromFile: string, importIdentifier: string, allFiles: string[]) => string | null;
};

type ProcessSymbolContext = {
  nodes: Map<string, CodeNode>;
  file: FileContent;
  node: TSNode;
  symbolType: CodeNodeType;
  processedSymbols: Set<string>;
  fileState: Record<string, any>;
};

const pythonHandler: Partial<LanguageHandler> = {
  getSymbolNameNode: (declarationNode: TSNode) => {
    if (declarationNode.type === 'expression_statement') {
      const assignmentNode = declarationNode.namedChild(0);
      if (assignmentNode?.type === 'assignment') {
        return assignmentNode.childForFieldName('left');
      }
    }
    return declarationNode.childForFieldName('name');
  },
};

const goLangHandler: Partial<LanguageHandler> = {
  getSymbolNameNode: (declarationNode: TSNode) => {
    const nodeType = declarationNode.type;
    if (['type_declaration', 'const_declaration', 'var_declaration'].includes(nodeType)) {
      const spec = declarationNode.namedChild(0);
      if (spec && ['type_spec', 'const_spec', 'var_spec'].includes(spec.type)) {
        return spec.childForFieldName('name');
      }
    }
    return declarationNode.childForFieldName('name');
  },
};

const cLangHandler: Partial<LanguageHandler> = {
  getSymbolNameNode: (declarationNode: TSNode) => {
    if (declarationNode.type === 'type_definition') {
      const lastChild = declarationNode.namedChild(declarationNode.namedChildCount - 1);
      if (lastChild?.type === 'type_identifier') return lastChild;
    }
    if (declarationNode.type === 'function_definition') {
      const declarator = declarationNode.childForFieldName('declarator');
      if (declarator?.type === 'function_declarator') {
        const nameNode = declarator.childForFieldName('declarator');
        if (nameNode?.type === 'identifier') return nameNode;
      }
    }
    if (declarationNode.type === 'field_declaration') {
      const declarator = declarationNode.childForFieldName('declarator');
      if (declarator?.type === 'function_declarator') {
        return declarator.childForFieldName('declarator');
      }
      return declarator;
    }
    return declarationNode.childForFieldName('name');
  },
};

const tsLangHandler: Partial<LanguageHandler> = {
  preProcessFile: (_file, captures) => {
    const classNames = new Map<string, number>();
    const duplicateClassNames = new Set<string>();
    const seenClassNodes = new Set<number>();

    for (const { name, node } of captures) {
      if (name === 'class.definition') {
        let classNode = node.type === 'export_statement' ? (node.namedChildren[0] ?? node) : node;
        if (classNode.type === 'class_declaration' && !seenClassNodes.has(classNode.startIndex)) {
          seenClassNodes.add(classNode.startIndex);
          const nameNode = classNode.childForFieldName('name');
          if (nameNode) {
            const className = nameNode.text;
            const count = classNames.get(className) || 0;
            classNames.set(className, count + 1);
            if (count + 1 > 1) duplicateClassNames.add(className);
          }
        }
      }
    }
    return { duplicateClassNames };
  },
  shouldSkipSymbol: (node, symbolType, langName) => {
    if (langName !== 'typescript') return false;
    const valueNode = node.childForFieldName('value');
    if (valueNode?.type !== 'arrow_function') return false;
    return (symbolType === 'field' && node.type === 'public_field_definition') ||
      (symbolType === 'variable' && node.type === 'variable_declarator');
  },
  getSymbolNameNode: (declarationNode, originalNode) => {
    if (originalNode.type === 'variable_declarator' || originalNode.type === 'public_field_definition') { // Arrow function
      return originalNode.childForFieldName('name');
    }
    if (declarationNode.type === 'export_statement') {
      const lexicalDecl = declarationNode.namedChildren[0];
      if (lexicalDecl?.type === 'lexical_declaration') {
        const varDeclarator = lexicalDecl.namedChildren[0];
        if (varDeclarator?.type === 'variable_declarator') {
          return varDeclarator.childForFieldName('name');
        }
      }
    }
    return declarationNode.childForFieldName('name');
  },
  processComplexSymbol: ({ nodes, file, node, symbolType, processedSymbols, fileState }) => {
    if (symbolType !== 'method' && symbolType !== 'field') return false;
    const classParent = node.parent?.parent; // class_body -> class_declaration
    if (classParent?.type === 'class_declaration') {
      const classNameNode = classParent.childForFieldName('name');
      if (classNameNode) {
        const className = classNameNode.text;
        const nameNode = node.childForFieldName('name');
        // The check for duplicateClassNames is important to avoid ambiguity.
        // We remove the dependency on checking if the class has been processed first,
        // because the order of captures from tree-sitter is not guaranteed to be in source order.
        // This makes the analysis more robust.
        if (nameNode && !fileState['duplicateClassNames']?.has(className)) {
          const methodName = nameNode.text;
          
          // Create the unqualified symbol
          const unqualifiedSymbolId = `${file.path}#${methodName}`;
          if (!processedSymbols.has(unqualifiedSymbolId) && !nodes.has(unqualifiedSymbolId)) {
            processedSymbols.add(unqualifiedSymbolId);
            
            // Extract code snippet properly for class members
            let codeSnippet = '';
            if (symbolType === 'field') {
              // For fields, get the type annotation and initializer
              const fullText = node.text;
              const colonIndex = fullText.indexOf(':');
              if (colonIndex !== -1) {
                codeSnippet = fullText.substring(colonIndex);
              }
            } else if (symbolType === 'method') {
              // For methods, get the signature without the body
              codeSnippet = node.text?.split('{')[0]?.trim() || '';
            }
            
            nodes.set(unqualifiedSymbolId, {
              id: unqualifiedSymbolId, type: symbolType, name: methodName, filePath: file.path,
              startLine: getLineFromIndex(file.content, node.startIndex),
              endLine: getLineFromIndex(file.content, node.endIndex),
              codeSnippet,
            });
          }
          
          // Mark the unqualified symbol as processed to prevent duplicate creation
          processedSymbols.add(`${file.path}#${methodName}`);
        }
      }
    }
    return true; // Return true to indicate we handled this symbol completely
  },
  parseParameters: (paramsNode: TSNode, content: string): { name: string; type?: string }[] => {
    const params: { name: string; type?: string }[] = [];
    // For TS, formal_parameters has required_parameter, optional_parameter children.
    for (const child of paramsNode.namedChildren) {
      if (child && (child.type === 'required_parameter' || child.type === 'optional_parameter')) {
        const nameNode = child.childForFieldName('pattern');
        const typeNode = child.childForFieldName('type');
        if (nameNode) {
          params.push({
            name: getNodeText(nameNode, content),
            type: typeNode ? getNodeText(typeNode, content).replace(/^:\s*/, '') : undefined,
          });
        }
      }
    }
    return params;
  },
};

const createModuleResolver = (extensions: string[]) => (fromFile: string, sourcePath: string, allFiles: string[]): string | null => {
  const basedir = normalizePath(path.dirname(fromFile));
  const importPath = normalizePath(path.join(basedir, sourcePath));

  // Case 1: Path needs an extension or has the wrong one (e.g., .js for .ts)
  const parsedPath = path.parse(importPath);
  const basePath = normalizePath(path.join(parsedPath.dir, parsedPath.name));
  for (const ext of extensions) {
      const potentialFile = basePath + ext;
      if (allFiles.includes(potentialFile)) {
          return potentialFile;
      }
  }
  
  // Case 2: Path is a directory with an index file
  for (const ext of extensions) {
      const potentialIndexFile = normalizePath(path.join(importPath, 'index' + ext));
      if (allFiles.includes(potentialIndexFile)) {
          return potentialIndexFile;
      }
  }

  if (allFiles.includes(importPath)) return importPath;

  return null;      
};

const resolveImportFactory = (endings: string[], packageStyle: boolean = false) => (fromFile: string, sourcePath: string, allFiles: string[]): string | null => {
  const basedir = normalizePath(path.dirname(fromFile));
  const resolvedPathAsIs = normalizePath(path.join(basedir, sourcePath));
  if (allFiles.includes(resolvedPathAsIs)) return resolvedPathAsIs;

  const parsedSourcePath = path.parse(sourcePath);
  const basePath = normalizePath(path.join(basedir, parsedSourcePath.dir, parsedSourcePath.name));
  for (const end of endings) {
    const potentialPath = basePath + end;
    if (allFiles.includes(potentialPath)) return potentialPath;
  }
  
  if (packageStyle && sourcePath.includes('.')) {
    const packagePath = normalizePath(sourcePath.replace(/\./g, '/'));
    for (const end of endings) {
      const fileFromRoot = packagePath + end;
      if (allFiles.includes(fileFromRoot)) return fileFromRoot;
    }
  }
  return null;
};

const phpHandler: Partial<LanguageHandler> = {
  getSymbolNameNode: (declarationNode: TSNode) => {
    if (declarationNode.type === 'namespace_definition') {
      // For namespace definitions, get the namespace name node
      const nameNode = declarationNode.childForFieldName('name');
      return nameNode;
    }
    return declarationNode.childForFieldName('name');
  },
};

const languageHandlers: Record<string, Partial<LanguageHandler>> = {
  default: {
    shouldSkipSymbol: () => false,
    getSymbolNameNode: (declarationNode) => declarationNode.childForFieldName('name'),
    resolveImport: (fromFile, sourcePath, allFiles) => {
      const resolvedPathAsIs = path.normalize(path.join(path.dirname(fromFile), sourcePath));
      return allFiles.includes(resolvedPathAsIs) ? resolvedPathAsIs : null;
    }
  },
  typescript: {
    ...tsLangHandler,
    resolveImport: createModuleResolver(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']),
  },
  javascript: {
    resolveImport: createModuleResolver(['.js', '.jsx', '.mjs', '.cjs']),
  },
  tsx: {
    ...tsLangHandler,
    resolveImport: createModuleResolver(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']),
  },
  python: { 
    ...pythonHandler, 
    resolveImport: (fromFile: string, sourcePath: string, allFiles: string[]): string | null => {
      const basedir = normalizePath(path.dirname(fromFile));

      // Handle relative imports (starting with .)
      if (sourcePath.startsWith('.')) {
        const dots = sourcePath.match(/^\.+/)?.[0] ?? '';
        const level = dots.length;
        const modulePath = sourcePath.substring(level).replace(/\./g, '/');

        let currentDir = basedir;
        for (let i = 1; i < level; i++) {
          currentDir = path.dirname(currentDir);
        }

        const targetPyFile = normalizePath(path.join(currentDir, modulePath) + '.py');
        if (allFiles.includes(targetPyFile)) return targetPyFile;
        
        const resolvedPath = normalizePath(path.join(currentDir, modulePath, '__init__.py'));
        if (allFiles.includes(resolvedPath)) return resolvedPath;
      }
      
      // Handle absolute imports
      return resolveImportFactory(['.py', '/__init__.py'])(fromFile, sourcePath, allFiles);
    }
  },
  java: { resolveImport: resolveImportFactory(['.java'], true) },
  csharp: { resolveImport: resolveImportFactory(['.cs'], true) },
  php: { ...phpHandler, resolveImport: resolveImportFactory(['.php']) },
  go: goLangHandler,
  rust: {
    ...goLangHandler,
    resolveImport: (fromFile: string, sourcePath: string, allFiles: string[]): string | null => {
      const basedir = normalizePath(path.dirname(fromFile));
      
      // Handle module paths like "utils" -> "utils.rs"
      const resolvedPath = normalizePath(path.join(basedir, sourcePath + '.rs'));
      if (allFiles.includes(resolvedPath)) return resolvedPath;
      
      // Handle mod.rs style imports
      return resolveImportFactory(['.rs', '/mod.rs'])(fromFile, sourcePath, allFiles);
    }
  },
  c: cLangHandler,
  cpp: cLangHandler,
};

const getLangHandler = (langName: string): LanguageHandler => ({
  ...languageHandlers['default'],
  ...languageHandlers[langName],
} as LanguageHandler);


/**
 * Creates the default Tree-sitter based analyzer. It parses files to find
 * symbols (nodes) and their relationships (edges), constructing a CodeGraph.
 * Supports multiple programming languages.
 * @returns An Analyzer function.
 */
export const createTreeSitterAnalyzer = (): Analyzer => {
  return async (files: readonly FileContent[]) => {
    const nodes = new Map<string, CodeNode>();
    const edges: CodeEdge[] = [];
    const allFilePaths = files.map(f => normalizePath(f.path));

    // Phase 1: Add all files as nodes
    for (const file of files) {
      const langConfig = getLanguageConfigForFile(normalizePath(file.path));
      nodes.set(file.path, {
        id: file.path, type: 'file', name: path.basename(file.path),
        filePath: file.path, startLine: 1, endLine: file.content.split('\n').length,
        language: langConfig?.name,
      });
    }

    // Phase 2: Group files by language
    const filesByLanguage = files.reduce((acc, file) => {
      const langConfig = getLanguageConfigForFile(normalizePath(file.path));
      if (langConfig) {
        if (!acc.has(langConfig.name)) acc.set(langConfig.name, []);
        acc.get(langConfig.name)!.push(file);
      }
      return acc;
    }, new Map<string, FileContent[]>());

    // Phase 3: Parse all files once
    const fileParseData = new Map<string, { file: FileContent; captures: TSMatch[]; langConfig: LanguageConfig }>();
    for (const [langName, langFiles] of filesByLanguage.entries()) {
      const langConfig = getLanguageConfigForFile(normalizePath(langFiles[0]!.path));
      if (!langConfig) continue;
      try {
        const parser = await createParserForLanguage(langConfig);
        if (!parser.language) continue;
        const query = new (await import('web-tree-sitter')).Query(parser.language, langConfig.query);
        for (const file of langFiles) {
          const tree = parser.parse(file.content);
          if (tree) fileParseData.set(file.path, { file, captures: query.captures(tree.rootNode), langConfig });
        }
      } catch (error) {
        logger.warn(new ParserError(`Failed to process ${langName} files`, langName, error));
        // Continue processing other languages, don't let one language failure stop the entire analysis
        continue;
      }
    }

    // Phase 4: Process definitions for all files
    for (const { file, captures, langConfig } of fileParseData.values()) {
      processFileDefinitions({ nodes }, { ...file, path: normalizePath(file.path) }, captures, langConfig);
    }
    
    // Phase 5: Process relationships for all files
    const resolver = new SymbolResolver(nodes, edges);
    for (const { file, captures, langConfig } of fileParseData.values()) {
      processFileRelationships({ nodes, edges }, { ...file, path: normalizePath(file.path) }, captures, langConfig, resolver, allFilePaths);
    }
    
    // Phase 6: Remove redundant file-level edges when entity-level edges exist
    const entityEdges = new Set<string>();
    for (const edge of edges) {
      if (edge.fromId.includes('#') && edge.toId.includes('#')) {
        // This is an entity-level edge, track the file-level equivalent
        const fromFile = edge.fromId.split('#')[0];
        const toFile = edge.toId.split('#')[0];
        entityEdges.add(`${fromFile}->${toFile}`);
      }
    }
    
    // Remove file-level edges that have corresponding entity-level edges
    const filteredEdges = edges.filter(edge => {
      if (!edge.fromId.includes('#') && edge.toId.includes('#')) {
        // This is a file-to-entity edge, check if there's a corresponding entity-level edge
        const fromFile = edge.fromId;
        const toFile = edge.toId.split('#')[0];
        return !entityEdges.has(`${fromFile}->${toFile}`);
      }
      return true;
    });

    return { nodes: Object.freeze(nodes), edges: Object.freeze(filteredEdges) };
  };
};

/**
 * Process symbol definitions for a single file.
 */
function processFileDefinitions(
  graph: { nodes: Map<string, CodeNode> },
  file: FileContent,
  captures: TSMatch[],
  langConfig: LanguageConfig
): void {
  
  const handler = getLangHandler(langConfig.name);
  const fileState = handler.preProcessFile?.(file, captures) || {};
  const processedSymbols = new Set<string>();

  
  const definitionCaptures = captures.filter(({ name }) => name.endsWith('.definition'));
  const otherCaptures = captures.filter(({ name }) => !name.endsWith('.definition'));

  for (const { name, node } of definitionCaptures) {
    const parts = name.split('.');
    const type = parts.slice(0, -1).join('.');
    const symbolType = getSymbolTypeFromCapture(name, type);
    if (!symbolType) continue;

    const childCaptures = otherCaptures.filter(
      (c) => c.node.startIndex >= node.startIndex && c.node.endIndex <= node.endIndex
    );

    processSymbol(
      { ...graph, file, node, symbolType, processedSymbols, fileState },
      langConfig
,
      childCaptures
    );
  }
}

/**
 * Process a single symbol definition.
 */
function processSymbol(
  context: ProcessSymbolContext,
  langConfig: LanguageConfig,
  childCaptures: TSMatch[]
): void {
  const { nodes, file, node, symbolType, processedSymbols } = context;
  const handler = getLangHandler(langConfig.name);

  if (handler.shouldSkipSymbol(node, symbolType, langConfig.name)) return;
  if (handler.processComplexSymbol?.(context)) return;

  let declarationNode = node;
  if (node.type === 'export_statement' && node.namedChildCount > 0) {
    declarationNode = node.namedChildren[0] ?? node;
  }
  
  // --- NEW LOGIC TO EXTRACT QUALIFIERS & UI identifiers ---
  const qualifiers: { [key: string]: TSNode } = {};
  for (const capture of childCaptures) {
    qualifiers[capture.name] = capture.node;
  }

  const nameNode = handler.getSymbolNameNode(declarationNode, node) 
    || qualifiers['html.tag'] 
    || qualifiers['css.selector'];

  if (!nameNode) return;

  let symbolName = nameNode.text;
  let symbolId = `${file.path}#${symbolName}`;

  // HTML elements of the same type aren't unique, so we add a line number to the ID.
  if (symbolType === 'html_element') {
    symbolId = `${file.path}#${symbolName}:${nameNode.startPosition.row + 1}`;
  }

  if (symbolName && !processedSymbols.has(symbolId) && !nodes.has(symbolId)) {
    processedSymbols.add(symbolId);

    const visibilityNode = qualifiers['qualifier.visibility'];
    const visibility = visibilityNode
      ? (getNodeText(visibilityNode, file.content) as CodeNodeVisibility)
      : undefined;
    
    const canThrow = childCaptures.some(c => c.name === 'qualifier.throws');
    const isHtmlElement = symbolType === 'html_element';
    const isCssRule = symbolType === 'css_rule';

    const parametersNode = qualifiers['symbol.parameters'];
    const parameters =
      parametersNode && handler.parseParameters
        ? handler.parseParameters(parametersNode, file.content)
        : undefined;

    const returnTypeNode = qualifiers['symbol.returnType'];
    const returnType = returnTypeNode ? getNodeText(returnTypeNode, file.content).replace(/^:\s*/, '') : undefined;

    // Extract code snippet
    let codeSnippet = '';
    if (symbolType === 'variable' || symbolType === 'constant') {
      const fullText = file.content.slice(node.startIndex, node.endIndex);
      const assignmentMatch = fullText.match(/=\s*(.+)$/s);
      if (assignmentMatch) {
        codeSnippet = assignmentMatch[1].trim();
      }
    } else {
      const snippetWithEquals = file.content.slice(nameNode.endIndex, node.endIndex).replace(/^{/, '').trim();
      codeSnippet = snippetWithEquals.startsWith('=') ? snippetWithEquals.substring(1).trim() : snippetWithEquals;
    }

    nodes.set(symbolId, {
      id: symbolId, type: symbolType, name: symbolName, filePath: file.path,
      startLine: getLineFromIndex(file.content, node.startIndex),
      endLine: getLineFromIndex(file.content, node.endIndex),
      codeSnippet,
      ...(qualifiers['qualifier.async'] && { isAsync: true }),
      ...(qualifiers['qualifier.static'] && { isStatic: true }),
      ...(visibility && { visibility }),
      ...(returnType && { returnType }),
      ...(parameters && { parameters }),
      ...(canThrow && { canThrow: true }),
      ...(isHtmlElement && { htmlTag: symbolName }),
      ...(isCssRule && { cssSelector: symbolName }),
    });
  }
}

/**
 * Process relationships (imports, calls, inheritance) for a single file.
 */
function processFileRelationships(
  graph: { nodes: Map<string, CodeNode>, edges: CodeEdge[] },
  file: FileContent,
  captures: TSMatch[],
  langConfig: LanguageConfig,
  resolver: SymbolResolver,
  allFilePaths: string[]
): void {
  const handler = getLangHandler(langConfig.name);
  for (const { name, node } of captures) {
    const parts = name.split('.');
    const type = parts.slice(0, -1).join('.');
    const subtype = parts[parts.length - 1];

    if (type === 'import' && subtype === 'source') {
      const importIdentifier = getNodeText(node, file.content).replace(/['"`]/g, '');
      const importedFilePath = handler.resolveImport(file.path, importIdentifier, allFilePaths);
      if (importedFilePath && graph.nodes.has(importedFilePath)) {
        const edge: CodeEdge = { fromId: file.path, toId: importedFilePath, type: 'imports' };
        if (!graph.edges.some(e => e.fromId === edge.fromId && e.toId === edge.toId)) {
          graph.edges.push(edge);
        }
      }
      continue;
    }

    if (subtype && ['inheritance', 'implementation', 'call', 'reference'].includes(subtype)) {
      const fromId = findEnclosingSymbolId(node, file, graph.nodes);
      if (!fromId) continue;
      const toName = getNodeText(node, file.content).replace(/<.*>$/, '');
      const toNode = resolver.resolve(toName, file.path);
      if (!toNode) continue;
      
      // Skip self-references
      if (fromId === toNode.id) continue;
      
      // Skip references within the same file unless it's a cross-entity reference
      if (fromId.split('#')[0] === toNode.id.split('#')[0] && fromId !== file.path && toNode.id !== file.path) {
        // Only allow cross-entity references within the same file if they're meaningful
        // (e.g., one function calling another, not variable self-references)
        const fromNode = graph.nodes.get(fromId);
        if (fromNode && (fromNode.type === 'variable' || fromNode.type === 'constant') && 
            (toNode.type === 'variable' || toNode.type === 'constant')) {
          continue;
        }
      }
      
      const edgeType = subtype === 'inheritance' ? 'inherits' : 
                      subtype === 'implementation' ? 'implements' : 
                      subtype === 'call' ? 'calls' : 'uses';
      const edge: CodeEdge = { fromId, toId: toNode.id, type: edgeType };
      if (!graph.edges.some(e => e.fromId === edge.fromId && e.toId === edge.toId)) {
        graph.edges.push(edge);
      }
    }
  }
}

/**
 * Get symbol type from capture name and language.
 */
function getSymbolTypeFromCapture(captureName: string, type: string): CodeNodeType | null {
  const baseMap = new Map<string, CodeNodeType>([
    ['class', 'class'],
    ['function', 'function'],
    ['function.arrow', 'arrow_function'],
    ['interface', 'interface'],
    ['type', 'type'],
    ['method', 'method'],
    ['field', 'field'],
    ['struct', 'struct'],
    ['enum', 'enum'],
    ['namespace', 'namespace'],
    ['trait', 'trait'],
    ['impl', 'impl'],
    ['constructor', 'constructor'],
    ['property', 'property'],
    ['html.element', 'html_element'],
    ['css.rule', 'css_rule'],
    ['variable', 'variable'],
    ['constant', 'constant'],
    ['static', 'static'],
    ['union', 'union'],
    ['template', 'template'],
  ]);
  return baseMap.get(captureName) ?? baseMap.get(type) ?? null;
}

/**
 * A best-effort symbol resolver to find the ID of a referenced symbol.
 */
class SymbolResolver {
  constructor(
    private nodes: ReadonlyMap<string, CodeNode>,
    private edges: readonly CodeEdge[],
  ) {}

  resolve(symbolName: string, contextFile: string): CodeNode | null {
    const sameFileId = `${contextFile}#${symbolName}`;
    if (this.nodes.has(sameFileId)) return this.nodes.get(sameFileId)!;

    const importedFiles = this.edges.filter(e => e.fromId === contextFile && e.type === 'imports').map(e => e.toId);
    for (const file of importedFiles) {
      const importedId = `${file}#${symbolName}`;
      if (this.nodes.has(importedId)) return this.nodes.get(importedId)!;
    }

    for (const node of this.nodes.values()) {
      if (node.name === symbolName && ['class', 'function', 'interface', 'struct', 'type', 'enum'].includes(node.type)) {
        return node;
      }
    }
    return null;
  }
}

/**
 * Traverses up the AST from a start node to find the enclosing symbol definition
 * and returns its unique ID.
 */
function findEnclosingSymbolId(startNode: TSNode, file: FileContent, nodes: ReadonlyMap<string, CodeNode>): string | null {
  let current: TSNode | null = startNode.parent;
  while (current) {
    const nameNode = current.childForFieldName('name');
    if (nameNode) {
      let symbolName = nameNode.text;
      if (current.type === 'method_definition' || (current.type === 'public_field_definition' && !current.text.includes('=>'))) {
        const classNode = current.parent?.parent; // class_body -> class_declaration
        if (classNode?.type === 'class_declaration') {
          symbolName = `${classNode.childForFieldName('name')?.text}.${symbolName}`;
        }
      }
      const symbolId = `${file.path}#${symbolName}`;
      if (nodes.has(symbolId)) return symbolId;
    }
    current = current.parent;
  }
  return file.path; // Fallback to file node
}
````

## File: repograph/src/tree-sitter/queries.ts
````typescript
import { LANGUAGE_CONFIGS, getLanguageConfigForFile, type LanguageConfig } from './language-config.js';

/**
 * Tree-sitter query for TypeScript and JavaScript to capture key symbols.
 * This query is designed to find definitions of classes, functions, interfaces,
 * and import statements to build the code graph.
 * 
 * @deprecated Use getQueryForLanguage() instead
 */
export const TS_QUERY = `
(import_statement
  source: (string) @import.source) @import.statement

(class_declaration) @class.definition
(export_statement declaration: (class_declaration)) @class.definition

(function_declaration) @function.definition
(export_statement declaration: (function_declaration)) @function.definition

(variable_declarator value: (arrow_function)) @function.arrow.definition
(public_field_definition value: (arrow_function)) @function.arrow.definition
(export_statement declaration: (lexical_declaration (variable_declarator value: (arrow_function)))) @function.arrow.definition

(interface_declaration) @interface.definition
(export_statement declaration: (interface_declaration)) @interface.definition

(type_alias_declaration) @type.definition
(export_statement declaration: (type_alias_declaration)) @type.definition

(method_definition) @method.definition
(public_field_definition) @field.definition

(call_expression
  function: (identifier) @function.call)
`;

/**
 * Get the Tree-sitter query for a specific language configuration.
 * @param config The language configuration
 * @returns The query string for the language
 */
export function getQueryForLanguage(config: LanguageConfig): string {
  return config.query.trim();
}

/**
 * Get the Tree-sitter query for a file based on its extension.
 * @param filePath The file path
 * @returns The query string for the file's language, or null if not supported
 */
export function getQueryForFile(filePath: string): string | null {
  const config = getLanguageConfigForFile(filePath);
  return config ? getQueryForLanguage(config) : null;
}

/**
 * Get all supported language configurations.
 * @returns Array of all language configurations
 */
export function getAllLanguageConfigs(): LanguageConfig[] {
  return [...LANGUAGE_CONFIGS];
}
````

## File: repograph/src/index.ts
````typescript
#!/usr/bin/env bun

import { logger } from './utils/logger.util.js';
import { RepoGraphError } from './utils/error.util.js';
// High-Level API for simple use cases
import { generateMap as executeGenerateMap } from './high-level.js';
import type { RepoGraphOptions as IRepoGraphOptions } from './types.js';

export { generateMap, analyzeProject } from './high-level.js';

// Low-Level API for composition and advanced use cases
export { createMapGenerator } from './composer.js';

// Default pipeline component factories
export { createDefaultDiscoverer } from './pipeline/discover.js';
export { createTreeSitterAnalyzer } from './pipeline/analyze.js';
export { createPageRanker, createGitRanker } from './pipeline/rank.js';
export { createMarkdownRenderer } from './pipeline/render.js';

// Logger utilities
export { logger } from './utils/logger.util.js';
export type { Logger, LogLevel } from './utils/logger.util.js';

// Core types for building custom components
export type {
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
} from './types.js';

// This section runs only when the script is executed directly from the CLI
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const isRunningDirectly = () => {
  if (typeof process.argv[1] === 'undefined') return false;
  const runningFile = path.resolve(process.argv[1]);
  const currentFile = fileURLToPath(import.meta.url);
  return runningFile === currentFile;
};

if (isRunningDirectly()) {
  (async () => {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
Usage: repograph [root] [options]

Arguments:
  root                     The root directory of the repository to analyze. Defaults to the current working directory.

Options:
  -h, --help               Display this help message.
  -v, --version            Display the version number.
  --output <path>          Path to the output Markdown file. (default: "repograph.md")
  --include <pattern>      Glob pattern for files to include. Can be specified multiple times.
  --ignore <pattern>       Glob pattern for files to ignore. Can be specified multiple times.
  --no-gitignore           Do not respect .gitignore files.
  --ranking-strategy <name> The ranking strategy to use. (default: "pagerank", options: "pagerank", "git-changes")
  --log-level <level>      Set the logging level. (default: "info", options: "silent", "error", "warn", "info", "debug")

Output Formatting:
  --no-header              Do not include the main "RepoGraph" header.
  --no-overview            Do not include the project overview section.
  --no-mermaid             Do not include the Mermaid dependency graph.
  --no-file-list           Do not include the list of top-ranked files.
  --no-symbol-details      Do not include the detailed file and symbol breakdown.
  --top-file-count <num>   Set the number of files in the top list. (default: 10)
  --file-section-separator <str> Custom separator for file sections. (default: "---")
  --no-symbol-relations    Hide symbol relationship details (e.g., calls, implements).
  --no-symbol-line-numbers Hide line numbers for symbols.
  --no-symbol-snippets     Hide code snippets for symbols.
  --max-relations-to-show <num> Max number of 'calls' relations to show per symbol. (default: 3)
    `);
      process.exit(0);
    }

    if (args.includes('--version') || args.includes('-v')) {
      // In a real app, you'd get this from package.json
      logger.info('0.1.0');
      process.exit(0);
    }

    // We need a mutable version of the options to build it from arguments.
    const options: {
      root?: string;
      output?: string;
      include?: readonly string[];
      ignore?: readonly string[];
      noGitignore?: boolean;
      rankingStrategy?: 'pagerank' | 'git-changes';
      logLevel?: IRepoGraphOptions['logLevel'];
      rendererOptions?: IRepoGraphOptions['rendererOptions'];
    } = {};
    const includePatterns: string[] = [];
    const ignorePatterns: string[] = [];
    // We need a mutable version of rendererOptions to build from CLI args
    const rendererOptions: {
      customHeader?: string;
      includeHeader?: boolean;
      includeOverview?: boolean;
      includeMermaidGraph?: boolean;
      includeFileList?: boolean;
      topFileCount?: number;
      includeSymbolDetails?: boolean;
      fileSectionSeparator?: string;
      symbolDetailOptions?: {
        includeRelations?: boolean;
        includeLineNumber?: boolean;
        includeCodeSnippet?: boolean;
        maxRelationsToShow?: number;
      };
    } = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg) {
        continue;
      }
      switch (arg) {
        case '--output':
          options.output = args[++i];
          break;
        case '--include':
          includePatterns.push(args[++i] as string);
          break;
        case '--ignore':
          ignorePatterns.push(args[++i] as string);
          break;
        case '--no-gitignore':
          options.noGitignore = true;
          break;
        case '--ranking-strategy':
          options.rankingStrategy = args[++i] as IRepoGraphOptions['rankingStrategy'];
          break;
        case '--log-level':
          options.logLevel = args[++i] as IRepoGraphOptions['logLevel'];
          break;
        // --- Renderer Options ---
        case '--no-header':
          rendererOptions.includeHeader = false;
          break;
        case '--no-overview':
          rendererOptions.includeOverview = false;
          break;
        case '--no-mermaid':
          rendererOptions.includeMermaidGraph = false;
          break;
        case '--no-file-list':
          rendererOptions.includeFileList = false;
          break;
        case '--no-symbol-details':
          rendererOptions.includeSymbolDetails = false;
          break;
        case '--top-file-count':
          rendererOptions.topFileCount = parseInt(args[++i] as string, 10);
          break;
        case '--file-section-separator':
          rendererOptions.fileSectionSeparator = args[++i];
          break;
        case '--no-symbol-relations':
          rendererOptions.symbolDetailOptions = { ...(rendererOptions.symbolDetailOptions || {}), includeRelations: false };
          break;
        case '--no-symbol-line-numbers':
          rendererOptions.symbolDetailOptions = { ...(rendererOptions.symbolDetailOptions || {}), includeLineNumber: false };
          break;
        case '--no-symbol-snippets':
          rendererOptions.symbolDetailOptions = { ...(rendererOptions.symbolDetailOptions || {}), includeCodeSnippet: false };
          break;
        case '--max-relations-to-show':
          rendererOptions.symbolDetailOptions = { ...(rendererOptions.symbolDetailOptions || {}), maxRelationsToShow: parseInt(args[++i] as string, 10) };
          break;
        default:
          if (!arg.startsWith('-')) {
            options.root = arg;
          }
          break;
      }
    }

    if (includePatterns.length > 0) {
      options.include = includePatterns;
    }
    if (ignorePatterns.length > 0) {
      options.ignore = ignorePatterns;
    }
    if (Object.keys(rendererOptions).length > 0) {
      options.rendererOptions = rendererOptions;
    }

    const finalOutput = path.resolve(options.root || process.cwd(), options.output || 'repograph.md');

    logger.info(`Starting RepoGraph analysis for "${path.resolve(options.root || process.cwd())}"...`);

    try {
      await executeGenerateMap(options);
      const relativePath = path.relative(process.cwd(), finalOutput);
      logger.info(`\n✅ Success! RepoGraph map saved to ${relativePath}`);
    } catch (error: unknown) {
      if (error instanceof RepoGraphError) {
        logger.error(`\n❌ Error generating RepoGraph map: ${error.message}`);
      } else {
        logger.error('\n❌ An unknown error occurred while generating the RepoGraph map.', error);
      }
      process.exit(1);
    }
  })().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
````

## File: repograph/src/types.ts
````typescript
// Core Data Structures

/** Represents a single file read from disk. Immutable. */
export type FileContent = {
  readonly path: string;
  readonly content: string;
};

/** The type of a symbol identified in the code. */
export type CodeNodeType =
  | 'file'
  | 'class'
  | 'function'
  | 'interface'
  | 'variable'
  | 'type'
  | 'arrow_function'
  | 'method'
  | 'field'
  | 'struct'
  | 'enum'
  | 'namespace'
  | 'trait'
  | 'impl'
  | 'constructor'
  | 'property'
  | 'constant'
  | 'static'
  | 'union'
  | 'template'
  | 'html_element'
  | 'css_rule';

/** For CSS nodes, a semantic grouping of its properties. */
export type CssIntent = 'layout' | 'typography' | 'appearance';

/** New type for access modifiers. */
export type CodeNodeVisibility = 'public' | 'private' | 'protected' | 'internal' | 'default';

/** Represents a single, identifiable symbol (or a file) in the code. Immutable. */
export type CodeNode = {
  readonly id: string; // Unique identifier (e.g., 'src/api.ts#MyClass')
  readonly type: CodeNodeType;
  readonly name: string; // e.g., 'MyClass'
  readonly filePath: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly language?: string; // For file nodes, the detected language
  readonly codeSnippet?: string; // e.g., function signature

  // --- NEW FIELDS from scn-ts report ---
  /** The access modifier of the symbol (e.g., public, private). Maps to SCN '+' or '-'. */
  readonly visibility?: CodeNodeVisibility;
  /** Whether the symbol (e.g., a function or method) is asynchronous. Maps to SCN '...'. */
  readonly isAsync?: boolean;
  /** Whether the symbol is a static member of a class/struct. */
  readonly isStatic?: boolean;
  /** The return type of a function/method, as a string. Maps to SCN '#(type)'. */
  readonly returnType?: string;
  /** An array of parameters for functions/methods. */
  readonly parameters?: { name: string; type?: string }[];
  /** Whether a function is known to throw exceptions. Maps to SCN '!' */
  readonly canThrow?: boolean; // Populated by analyzer
  /** Whether a function is believed to be pure. Maps to SCN 'o' */
  readonly isPure?: boolean; // Not implemented yet
  /** For UI nodes, the HTML tag name (e.g., 'div'). */
  readonly htmlTag?: string;
  /** For UI nodes, a map of attributes. */
  readonly attributes?: ReadonlyMap<string, string>; // Not used yet
  /** For CSS nodes, the full selector. */
  readonly cssSelector?: string;
  /** For CSS rules, a list of semantic intents. */
  readonly cssIntents?: readonly CssIntent[]; // Not implemented yet
};

/** Represents a directed relationship between two CodeNodes. Immutable. */
export type CodeEdge = {
  readonly fromId: string; // ID of the source CodeNode
  readonly toId: string;   // ID of the target CodeNode
  readonly type: 'imports' | 'calls' | 'inherits' | 'implements';
};

/** The complete, raw model of the repository's structure. Immutable. */
export type CodeGraph = {
  readonly nodes: ReadonlyMap<string, CodeNode>;
  readonly edges: readonly CodeEdge[];
};

/** A CodeGraph with an added 'rank' score for each node. Immutable. */
export type RankedCodeGraph = CodeGraph & {
  readonly ranks: ReadonlyMap<string, number>; // Key is CodeNode ID
};

/** The output of a map generation process, containing the graph and rendered output. */
export type RepoGraphMap = {
  readonly graph: RankedCodeGraph;
  readonly markdown: string;
};

// High-Level API Options

/** Configuration for the final Markdown output. */
export type RendererOptions = {
  /** Custom text to appear at the top of the Markdown file. Overrides `includeHeader`. */
  readonly customHeader?: string;
  /** Include the default `RepoGraph` header. @default true */
  readonly includeHeader?: boolean;
  /** Include the project overview section. @default true */
  readonly includeOverview?: boolean;
  /** Include a Mermaid.js dependency graph. @default true */
  readonly includeMermaidGraph?: boolean;
  /** Include the list of top-ranked files. @default true */
  readonly includeFileList?: boolean;
  /** Number of files to show in the top list. @default 10 */
  readonly topFileCount?: number;
  /** Include detailed breakdowns for each symbol. @default true */
  readonly includeSymbolDetails?: boolean;
  /** String to use as a separator between file sections. @default '---' */
  readonly fileSectionSeparator?: string;

  /** Options for how individual symbols are rendered */
  readonly symbolDetailOptions?: {
    /** Include relationships (calls, inherits, etc.) in the symbol line. @default true */
    readonly includeRelations?: boolean;
    /** Include the starting line number. @default true */
    readonly includeLineNumber?: boolean;
    /** Include the code snippet for the symbol. @default true */
    readonly includeCodeSnippet?: boolean;
    /** Max number of relations to show per type (e.g., 'calls'). @default 3 */
    readonly maxRelationsToShow?: number;
  };
};

/** Configuration options for the main `generateMap` function. */
export type RepoGraphOptions = {
  /** Root directory to analyze. @default process.cwd() */
  readonly root?: string;
  /** Output path for the Markdown file. @default './repograph.md' */
  readonly output?: string;
  /** Glob patterns for files to include. */
  readonly include?: readonly string[];
  /** Glob patterns for files to exclude. */
  readonly ignore?: readonly string[];
  /** Disables the use of .gitignore. @default false */
  readonly noGitignore?: boolean;
  /** The ranking strategy to use. @default 'pagerank' */
  readonly rankingStrategy?: 'pagerank' | 'git-changes';
  /** Configuration for the final Markdown output. */
  readonly rendererOptions?: RendererOptions;
  /** Logging level. @default 'info' */
  readonly logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';
};

// Low-Level Functional Pipeline Contracts

/** Discovers files and returns their content. */
export type FileDiscoverer = (config: {
  readonly root: string;
  readonly include?: readonly string[];
  readonly ignore?: readonly string[];
  readonly noGitignore?: boolean;
}) => Promise<readonly FileContent[]>;

/** Analyzes file content and builds the dependency graph. */
export type Analyzer = (files: readonly FileContent[]) => Promise<CodeGraph>;

/** Ranks the nodes in a graph. */
export type Ranker = (graph: CodeGraph) => Promise<RankedCodeGraph>;

/** Renders a ranked graph into a string format. */
export type Renderer = (rankedGraph: RankedCodeGraph, options?: RendererOptions) => string;
````

## File: repograph/test/e2e/cli.test.ts
````typescript
import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { spawn } from 'node:child_process';
import {
  createTempDir,
  cleanupTempDir,
  createTestFiles,
  createGitignore,
  assertFileExists,
  readFile,
  isValidMarkdown,
  containsValidMermaid,
  loadFixture,
  createProjectFromFixture
} from '../test.util.js';
import path from 'node:path';

describe('CLI End-to-End Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  const runCLI = async (args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
    return new Promise((resolve, reject) => {
      const child = spawn('bun', ['run', 'src/index.ts', ...args], {
        cwd: cwd || process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0
        });
      });

      child.on('error', reject);
    });
  };

  describe('Basic CLI Usage', () => {
    it('should generate map with default options', async () => {
      const files = {
        'src/index.ts': `export class Example {
  method(): string {
    return 'hello';
  }
}`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      await assertFileExists(path.join(tempDir, 'repograph.md'));
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('Example');
    });

    it('should accept custom output path', async () => {
      const files = {
        'src/test.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const outputPath = path.join(tempDir, 'custom-output.md');
      const result = await runCLI([tempDir, '--output', outputPath]);

      expect(result.exitCode).toBe(0);
      await assertFileExists(outputPath);
    });

    it('should accept include patterns', async () => {
      const files = {
        'src/index.ts': 'export const ts = true;',
        'src/index.js': 'export const js = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).not.toContain('src/index.js');
    });

    it('should accept ignore patterns', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'src/test.spec.ts': 'test code'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ignore', '**/*.spec.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).not.toContain('src/test.spec.ts');
    });

    it('should accept ranking strategy option', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ranking-strategy', 'git-changes'
      ]);

      expect(result.exitCode).toBe(0);
      await assertFileExists(path.join(tempDir, 'repograph.md'));
    });

    it('should accept no-gitignore flag', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'dist/index.js': 'compiled code'
      };
      await createTestFiles(tempDir, files);
      await createGitignore(tempDir, ['dist/']);

      const result = await runCLI([
        tempDir,
        '--no-gitignore'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('dist/index.js');
    });

    it('should show help when --help flag is used', async () => {
      const result = await runCLI(['--help']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Options:');
    });

    it('should show version when --version flag is used', async () => {
      const result = await runCLI(['--version']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent directory', async () => {
      const nonExistentDir = path.join(tempDir, 'non-existent');
      const result = await runCLI([nonExistentDir]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Error');
    });

    it('should handle invalid output directory', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const invalidOutput = '/root/cannot-write-here.md';
      const result = await runCLI([
        tempDir,
        '--output', invalidOutput
      ]);

      expect(result.exitCode).not.toBe(0);
    });

    it('should handle invalid ranking strategy', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ranking-strategy', 'invalid-strategy'
      ]);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Invalid ranking strategy');
    });

    it('should handle malformed include patterns gracefully', async () => {
      const files = {
        'src/index.ts': 'export const test = true;'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '[invalid-pattern'
      ]);

      // Should not crash, but might produce empty output
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Multiple Arguments', () => {
    it('should handle multiple include patterns', async () => {
      const files = {
        'src/index.ts': 'export const ts = true;',
        'lib/utils.js': 'export const js = true;',
        'docs/readme.md': '# Documentation'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts',
        '--include', '**/*.js'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).toContain('lib/utils.js');
      expect(content).not.toContain('docs/readme.md');
    });

    it('should handle multiple ignore patterns', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'src/test.spec.ts': 'test code',
        'src/utils.test.ts': 'test utils',
        'src/helper.ts': 'helper code'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--ignore', '**/*.spec.ts',
        '--ignore', '**/*.test.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).toContain('src/helper.ts');
      expect(content).not.toContain('src/test.spec.ts');
      expect(content).not.toContain('src/utils.test.ts');
    });
  });

  describe('Output Customization Flags', () => {
    beforeEach(async () => {
      const files = {
        'src/index.ts': `import { helper, another, onemore } from './utils.js';
export function main() { helper(); another(); onemore(); }`,
        'src/utils.ts': `export function helper() {}
export function another() {}
export function onemore() {}`
      };
      await createTestFiles(tempDir, files);
    });
    
    const flagTestCases = [
      { name: 'no-header', args: ['--no-header'], notToContain: '# RepoGraph' },
      { name: 'no-overview', args: ['--no-overview'], notToContain: '## 🚀 Project Overview' },
      { name: 'no-mermaid', args: ['--no-mermaid'], notToContain: '```mermaid' },
      { name: 'no-file-list', args: ['--no-file-list'], notToContain: '### Top 10 Most Important Files' },
      { name: 'no-symbol-details', args: ['--no-symbol-details'], notToContain: '## 📂 File & Symbol Breakdown' },
      { name: 'top-file-count', args: ['--top-file-count', '1'], toContain: '### Top 1 Most Important Files' },
      { name: 'file-section-separator', args: ['--file-section-separator', '***'], toContain: '\n***\n\n' },
      { name: 'no-symbol-relations', args: ['--no-symbol-relations'], notToContain: '(calls' },
      { name: 'no-symbol-line-numbers', args: ['--no-symbol-line-numbers'], notToContain: '_L2_' },
      { name: 'no-symbol-snippets', args: ['--no-symbol-snippets'], notToContain: '```typescript' },
      { name: 'max-relations-to-show', args: ['--max-relations-to-show', '1'], toContain: 'calls `helper`...', notToContain: '`another`' },
    ];

    it.each(flagTestCases)('should handle flag $name', async ({ args, toContain, notToContain }) => {
      await runCLI([tempDir, ...args]);
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      if (toContain) {
        expect(content).toContain(toContain);
      }
      if (notToContain) {
        expect(content).not.toContain(notToContain);
      }
    });
  });

  describe('Output Validation', () => {
    it('should generate valid markdown structure', async () => {
      const files = {
        'src/calculator.ts': `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}`,
        'src/logger.ts': `export class Logger {
  log(message: string): void {
    console.log(message);
  }
}`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      
      // Check markdown structure
      expect(content).toContain('# RepoGraph');
      expect(content).toContain('## 🚀 Project Overview');
      expect(content).toContain('### Module Dependency Graph');
      expect(content).toContain('### Top 10 Most Important Files');
      expect(content).toContain('## 📂 File & Symbol Breakdown');
      
      // Check Mermaid graph
      expect(containsValidMermaid(content)).toBe(true);
      
      // Check symbol details
      expect(content).toContain('Calculator');
      expect(content).toContain('Logger');
    });

    it('should handle projects with complex dependencies', async () => {
      const files = {
        'src/index.ts': `import { Database } from './database.js';
import { ApiServer } from './api.js';

export class App {
  constructor(
    private db: Database,
    private api: ApiServer
  ) {}
}`,
        'src/database.ts': `export class Database {
  connect(): Promise<void> {
    return Promise.resolve();
  }
}`,
        'src/api.ts': `import { Database } from './database.js';

export class ApiServer {
  constructor(private db: Database) {}
}`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('App');
      expect(content).toContain('Database');
      expect(content).toContain('ApiServer');
      expect(containsValidMermaid(content)).toBe(true);
    });
  });

  describe('Integration with Fixtures', () => {
    it('should process sample-project fixture via CLI', async () => {
      const fixture = await loadFixture('sample-project');
      await createProjectFromFixture(tempDir, fixture);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('Calculator');
      expect(content).toContain('Logger');
      expect(content).toContain('AdvancedCalculator');
    });

    it('should process complex-project fixture via CLI', async () => {
      const fixture = await loadFixture('complex-project');
      await createProjectFromFixture(tempDir, fixture);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts',
        '--ranking-strategy', 'pagerank'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('Database');
      expect(content).toContain('ApiServer');
      expect(content).toContain('UserService');
    });

    it('should handle minimal-project fixture via CLI', async () => {
      const fixture = await loadFixture('minimal-project');
      await createProjectFromFixture(tempDir, fixture);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(isValidMarkdown(content)).toBe(true);
      expect(content).toContain('src/main.ts');
      expect(content).toContain('hello');
      expect(content).toContain('greet');
    });
  });

  describe('Performance', () => {
    it('should handle moderately large projects in reasonable time', async () => {
      // Create a project with many files
      const files: Record<string, string> = {};
      
      for (let i = 0; i < 30; i++) {
        files[`src/module${i}.ts`] = `export class Module${i} {
  process(): string {
    return 'module${i}';
  }
}`;
      }

      // Add some imports
      files['src/index.ts'] = Array.from({ length: 30 }, (_, i) => 
        `import { Module${i} } from './module${i}.js';`
      ).join('\n') + '\n\nexport const modules = [' + 
      Array.from({ length: 30 }, (_, i) => `Module${i}`).join(', ') + '];';

      await createTestFiles(tempDir, files);

      const startTime = Date.now();
      const result = await runCLI([tempDir]);
      const endTime = Date.now();

      expect(result.exitCode).toBe(0);
      expect(endTime - startTime).toBeLessThan(15000); // Should complete within 15 seconds
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('Module0');
      expect(content).toContain('Module29');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should work with TypeScript project structure', async () => {
      const files = {
        'package.json': JSON.stringify({
          name: 'my-project',
          version: '1.0.0',
          type: 'module',
          scripts: {
            build: 'tsc',
            test: 'bun test'
          }
        }, null, 2),
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            outDir: './dist'
          }
        }, null, 2),
        'src/index.ts': `export { Calculator } from './lib/calculator.js';
export type { CalculatorOptions } from './types.js';`,
        'src/lib/calculator.ts': `import type { CalculatorOptions } from '../types.js';

export class Calculator {
  constructor(private options: CalculatorOptions) {}
  
  calculate(expression: string): number {
    return eval(expression);
  }
}`,
        'src/types.ts': `export interface CalculatorOptions {
  precision: number;
  mode: 'strict' | 'loose';
}`,
        'README.md': '# My Calculator Project'
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', 'src/**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('Calculator');
      expect(content).toContain('CalculatorOptions');
      expect(content).not.toContain('package.json');
      expect(content).not.toContain('README.md');
    });

    it('should work with monorepo structure', async () => {
      const files = {
        'packages/core/src/index.ts': `export { Engine } from './engine.js';`,
        'packages/core/src/engine.ts': `export class Engine {
  start(): void {
    console.log('Engine started');
  }
}`,
        'packages/ui/src/index.ts': `export { Component } from './component.js';`,
        'packages/ui/src/component.ts': `import { Engine } from '../../core/src/engine.js';

export class Component {
  private engine = new Engine();
  
  render(): void {
    this.engine.start();
  }
}`,
        'apps/web/src/main.ts': `import { Component } from '../../../packages/ui/src/component.js';

const component = new Component();
component.render();`
      };
      await createTestFiles(tempDir, files);

      const result = await runCLI([
        tempDir,
        '--include', '**/*.ts'
      ]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('Engine');
      expect(content).toContain('Component');
      expect(content).toContain('packages/core/src/engine.ts');
      expect(content).toContain('packages/ui/src/component.ts');
      expect(content).toContain('apps/web/src/main.ts');
    });

    it('should respect gitignore in real project', async () => {
      const files = {
        'src/index.ts': 'export const main = true;',
        'src/utils.ts': 'export const util = true;',
        'dist/index.js': 'compiled code',
        'node_modules/package/index.js': 'dependency',
        'coverage/lcov.info': 'coverage data',
        '.env': 'SECRET=value',
        'logs/app.log': 'log content'
      };
      await createTestFiles(tempDir, files);
      await createGitignore(tempDir, [
        'dist/',
        'node_modules/',
        'coverage/',
        '.env',
        'logs/'
      ]);

      const result = await runCLI([tempDir]);

      expect(result.exitCode).toBe(0);
      
      const content = await readFile(path.join(tempDir, 'repograph.md'));
      expect(content).toContain('src/index.ts');
      expect(content).toContain('src/utils.ts');
      expect(content).not.toContain('dist/index.js');
      expect(content).not.toContain('node_modules/package/index.js');
      expect(content).not.toContain('coverage/lcov.info');
      expect(content).not.toContain('.env');
      expect(content).not.toContain('logs/app.log');
    });
  });
});
````

## File: repograph/test/integration/multi-language.test.ts
````typescript
import { describe, it, expect } from 'bun:test';
import { runAnalyzerForTests } from '../test.util.js';
import type { FileContent } from '../../src/types.js';

interface TestCase {
  language: string;
  files: FileContent[];
  expectedNodeIds: string[];
  expectedEdges?: Array<{ from: string; to: string; type: 'imports' | 'inherits' | 'implements' }>;
}

describe('Multi-Language Support', () => {
  const testCases: TestCase[] = [
    {
      language: 'TypeScript Relationships',
      files: [
        { path: 'src/base.ts', content: 'export class Base {}; export interface ILog { log(): void; }' },
        { path: 'src/main.ts', content: "import { Base } from './base'; export class Main extends Base implements ILog { log() {} }" },
      ],
      expectedNodeIds: ['src/base.ts', 'src/base.ts#Base', 'src/base.ts#ILog', 'src/main.ts', 'src/main.ts#Main'],
      expectedEdges: [
        { from: 'src/main.ts', to: 'src/base.ts', type: 'imports' },
        { from: 'src/main.ts#Main', to: 'src/base.ts#Base', type: 'inherits' },
        { from: 'src/main.ts#Main', to: 'src/base.ts#ILog', type: 'implements' },
      ],
    },
    {
      language: 'Python Relationships',
      files: [
        { path: 'src/models/base.py', content: 'class Base:\n  pass' },
        { path: 'src/models/user.py', content: 'from .base import Base\n\nclass User(Base):\n  pass' },
      ],
      expectedNodeIds: ['src/models/base.py', 'src/models/base.py#Base', 'src/models/user.py', 'src/models/user.py#User'],
      expectedEdges: [
        { from: 'src/models/user.py', to: 'src/models/base.py', type: 'imports' },
        { from: 'src/models/user.py#User', to: 'src/models/base.py#Base', type: 'inherits' },
      ],
    },
    {
      language: 'Java Relationships',
      files: [
        { path: 'com/example/Base.java', content: 'package com.example; public class Base {}' },
        { path: 'com/example/Iface.java', content: 'package com.example; public interface Iface {}' },
        { path: 'com/example/Main.java', content: 'package com.example; import com.example.Base; public class Main extends Base implements Iface {}' },
      ],
      expectedNodeIds: [
        'com/example/Base.java', 'com/example/Base.java#Base',
        'com/example/Iface.java', 'com/example/Iface.java#Iface',
        'com/example/Main.java', 'com/example/Main.java#Main',
      ],
      expectedEdges: [
        { from: 'com/example/Main.java', to: 'com/example/Base.java', type: 'imports' },
        { from: 'com/example/Main.java#Main', to: 'com/example/Base.java#Base', type: 'inherits' },
        { from: 'com/example/Main.java#Main', to: 'com/example/Iface.java#Iface', type: 'implements' },
      ]
    },
    {
        language: 'Rust Relationships',
        files: [
            { path: 'src/utils.rs', content: 'pub fn helper() {}' },
            { path: 'src/main.rs', content: 'mod utils; use utils::helper; fn main() { helper(); }' }
        ],
        expectedNodeIds: [
            'src/utils.rs', 'src/utils.rs#helper',
            'src/main.rs', 'src/main.rs#main'
        ],
        expectedEdges: [
            { from: 'src/main.rs', to: 'src/utils.rs', type: 'imports' }
        ]
    },
  ];

  it.each(testCases)('should correctly analyze $language', async ({ files, expectedNodeIds, expectedEdges }) => {
    const graph = await runAnalyzerForTests(files);

    // Verify all expected nodes exist
    for (const nodeId of expectedNodeIds) {
      expect(graph.nodes.has(nodeId)).toBe(true);
    }

    // Verify all expected edges exist
    if (expectedEdges) {
      for (const edge of expectedEdges) {
        const hasEdge = graph.edges.some(
          (e) => e.fromId === edge.from && e.toId === edge.to && e.type === edge.type
        );
        expect(hasEdge).toBe(true);
      }
    }
  });

  it('should handle unsupported file types gracefully alongside supported ones', async () => {
    const files: FileContent[] = [
      { path: 'src/code.ts', content: `export const hello = 'world';` },
      { path: 'README.md', content: '# This is markdown' },
      { path: 'config.json', content: '{"key": "value"}' }
    ];

    const graph = await runAnalyzerForTests(files);
    
    expect(graph.nodes.has('src/code.ts')).toBe(true);
    expect(graph.nodes.has('src/code.ts#hello')).toBe(true);
    expect(graph.nodes.has('README.md')).toBe(true);
    expect(graph.nodes.has('config.json')).toBe(true);

    // Should not create symbol nodes for non-code files
    expect(graph.nodes.size).toBe(4);
  });
});
````

## File: repograph/test/unit/analyze.test.ts
````typescript
import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { createTreeSitterAnalyzer } from '../../src/pipeline/analyze.js';
import type { FileContent } from '../../src/types.js';
import {
  createTempDir,
  cleanupTempDir,
  loadFixture,
  createProjectFromFixture
} from '../test.util.js';

describe('Tree-sitter Analysis', () => {
  let tempDir: string;
  let analyzer: ReturnType<typeof createTreeSitterAnalyzer>;

  beforeEach(async () => {
    tempDir = await createTempDir();
    analyzer = createTreeSitterAnalyzer();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('createTreeSitterAnalyzer()', () => {
    it('should return an Analyzer function', () => {
      expect(typeof analyzer).toBe('function');
    });

    it('should create a CodeGraph from file content', async () => {
      const files: FileContent[] = [
        {
          path: 'src/index.ts',
          content: `export function hello(): string {
  return 'Hello, World!';
}`
        }
      ];

      const graph = await analyzer(files);

      expect(graph).toBeDefined();
      expect(graph.nodes.size).toBeGreaterThan(0); // Should have nodes
    });

    it('should add file nodes to the graph', async () => {
      const files: FileContent[] = [
        {
          path: 'src/index.ts',
          content: 'export const hello = "world";'
        },
        {
          path: 'src/utils.ts',
          content: 'export const util = () => {};'
        }
      ];

      const graph = await analyzer(files);

      expect(graph.nodes.has('src/index.ts')).toBe(true);
      expect(graph.nodes.has('src/utils.ts')).toBe(true);

      const indexNode = graph.nodes.get('src/index.ts');
      expect(indexNode!.type).toBe('file');
      expect(indexNode!.name).toBe('index.ts');
      expect(indexNode!.filePath).toBe('src/index.ts');
    });

    it('should identify function declarations', async () => {
      const files: FileContent[] = [
        {
          path: 'src/functions.ts',
          content: `export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(x: number, y: number): number {
  return x * y;
}`
        }
      ];

      const graph = await analyzer(files);

      expect(graph.nodes.has('src/functions.ts#add')).toBe(true);
      expect(graph.nodes.has('src/functions.ts#multiply')).toBe(true);

      const addNode = graph.nodes.get('src/functions.ts#add');
      expect(addNode!.type).toBe('function');
      expect(addNode!.name).toBe('add');
      expect(addNode!.filePath).toBe('src/functions.ts');
      expect(addNode!.startLine).toBeGreaterThan(0);
    });

    it('should identify arrow function declarations', async () => {
      const files: FileContent[] = [
        {
          path: 'src/arrows.ts',
          content: `export const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};

const calculate = (x: number, y: number): number => x + y;`
        }
      ];

      const graph = await analyzer(files);

      expect(graph.nodes.has('src/arrows.ts#greet')).toBe(true);
      expect(graph.nodes.has('src/arrows.ts#calculate')).toBe(true);

      const greetNode = graph.nodes.get('src/arrows.ts#greet');
      expect(greetNode!.type).toBe('arrow_function');
      expect(greetNode!.name).toBe('greet');
    });

    it('should identify class declarations', async () => {
      const files: FileContent[] = [
        {
          path: 'src/classes.ts',
          content: `export class Calculator {
  private value: number = 0;
  
  add(n: number): this {
    this.value += n;
    return this;
  }
}

class Logger {
  log(message: string): void {
    console.log(message);
  }
}`
        }
      ];

      const graph = await analyzer(files);

      expect(graph.nodes.has('src/classes.ts#Calculator')).toBe(true);
      expect(graph.nodes.has('src/classes.ts#Logger')).toBe(true);

      const calculatorNode = graph.nodes.get('src/classes.ts#Calculator');
      expect(calculatorNode!.type).toBe('class');
      expect(calculatorNode!.name).toBe('Calculator');
      expect(calculatorNode!.codeSnippet).toContain('export class Calculator');
    });

    it('should identify interface declarations', async () => {
      const files: FileContent[] = [
        {
          path: 'src/interfaces.ts',
          content: `export interface User {
  id: number;
  name: string;
  email: string;
}

interface Config {
  debug: boolean;
  version: string;
}`
        }
      ];

      const graph = await analyzer(files);

      expect(graph.nodes.has('src/interfaces.ts#User')).toBe(true);
      expect(graph.nodes.has('src/interfaces.ts#Config')).toBe(true);

      const userNode = graph.nodes.get('src/interfaces.ts#User');
      expect(userNode!.type).toBe('interface');
      expect(userNode!.name).toBe('User');
    });

    it('should identify type alias declarations', async () => {
      const files: FileContent[] = [
        {
          path: 'src/types.ts',
          content: `export type Status = 'active' | 'inactive' | 'pending';

type Handler = (event: Event) => void;

export type UserRole = 'admin' | 'user' | 'guest';`
        }
      ];

      const graph = await analyzer(files);

      expect(graph.nodes.has('src/types.ts#Status')).toBe(true);
      expect(graph.nodes.has('src/types.ts#Handler')).toBe(true);
      expect(graph.nodes.has('src/types.ts#UserRole')).toBe(true);

      const statusNode = graph.nodes.get('src/types.ts#Status');
      expect(statusNode!.type).toBe('type');
      expect(statusNode!.name).toBe('Status');
    });

    it('should identify import statements and create edges', async () => {
      const files: FileContent[] = [
        {
          path: 'src/index.ts',
          content: `import { Calculator } from './calculator.js';
import { Logger } from './utils/logger.js';

export { Calculator, Logger };`
        },
        {
          path: 'src/calculator.ts',
          content: `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}`
        },
        {
          path: 'src/utils/logger.ts',
          content: `export class Logger {
  log(message: string): void {
    console.log(message);
  }
}`
        }
      ];

      const graph = await analyzer(files);

      // Check if import edges exist
      const hasCalculatorImport = graph.edges.some(e => e.fromId === 'src/index.ts' && e.toId === 'src/calculator.ts');
      const hasLoggerImport = graph.edges.some(e => e.fromId === 'src/index.ts' && e.toId === 'src/utils/logger.ts');
      
      expect(hasCalculatorImport).toBe(true);
      expect(hasLoggerImport).toBe(true);
    });

    it('should handle files with no symbols gracefully', async () => {
      const files: FileContent[] = [
        {
          path: 'README.md',
          content: '# Project\n\nThis is a readme file.'
        },
        {
          path: 'src/empty.ts',
          content: '// This file is empty\n'
        }
      ];

      const graph = await analyzer(files);

      // Should still create file nodes
      expect(graph.nodes.has('README.md')).toBe(true);
      expect(graph.nodes.has('src/empty.ts')).toBe(true);

      const readmeNode = graph.nodes.get('README.md');
      expect(readmeNode!.type).toBe('file');
    });

    it('should handle malformed or unparseable files gracefully', async () => {
      const files: FileContent[] = [
        {
          path: 'src/valid.ts',
          content: 'export const valid = true;'
        },
        {
          path: 'src/invalid.ts',
          content: 'this is not valid typescript syntax {'
        }
      ];

      const graph = await analyzer(files);

      // Should still create file nodes for both
      expect(graph.nodes.has('src/valid.ts')).toBe(true);
      expect(graph.nodes.has('src/invalid.ts')).toBe(true);
    });

    it('should set correct line numbers for symbols', async () => {
      const files: FileContent[] = [
        {
          path: 'src/multiline.ts',
          content: `// Line 1
// Line 2
export class FirstClass {
  // Line 4
  method(): void {}
}

// Line 8
export function secondFunction(): string {
  return 'hello';
}

// Line 13
export interface ThirdInterface {
  prop: string;
}`
        }
      ];

      const graph = await analyzer(files);

      const firstClass = graph.nodes.get('src/multiline.ts#FirstClass');
      const secondFunction = graph.nodes.get('src/multiline.ts#secondFunction');
      const thirdInterface = graph.nodes.get('src/multiline.ts#ThirdInterface');

      expect(firstClass!.startLine).toBe(3);
      expect(secondFunction!.startLine).toBe(9);
      expect(thirdInterface!.startLine).toBe(14);

      expect(firstClass!.endLine).toBeGreaterThan(firstClass!.startLine);
      expect(secondFunction!.endLine).toBeGreaterThan(secondFunction!.startLine);
      expect(thirdInterface!.endLine).toBeGreaterThan(thirdInterface!.startLine);
    });

    it('should include code snippets for symbols', async () => {
      const files: FileContent[] = [
        {
          path: 'src/snippets.ts',
          content: `export class Calculator {
  private value: number = 0;
  
  add(n: number): this {
    this.value += n;
    return this;
  }
}

export function multiply(a: number, b: number): number {
  return a * b;
}`
        }
      ];

      const graph = await analyzer(files);

      const calculatorNode = graph.nodes.get('src/snippets.ts#Calculator');
      const multiplyNode = graph.nodes.get('src/snippets.ts#multiply');

      expect(calculatorNode!.codeSnippet).toContain('export class Calculator');
      expect(multiplyNode!.codeSnippet).toContain('export function multiply(a: number, b: number): number');
    });

    it('should handle complex import patterns', async () => {
      const files: FileContent[] = [
        {
          path: 'src/imports.ts',
          content: `import { Calculator } from './math/calculator.js';
import * as utils from './utils.js';
import type { Config } from './config.js';
import Logger, { LogLevel } from './logger.js';`
        },
        {
          path: 'src/math/calculator.ts',
          content: 'export class Calculator {}'
        },
        {
          path: 'src/utils.ts',
          content: 'export const helper = () => {};'
        },
        {
          path: 'src/config.ts',
          content: 'export interface Config {}'
        },
        {
          path: 'src/logger.ts',
          content: 'export default class Logger {}'
        }
      ];

      const graph = await analyzer(files);

      // Check import edges
      const hasCalcImport = graph.edges.some(e => e.fromId === 'src/imports.ts' && e.toId === 'src/math/calculator.ts');
      const hasUtilsImport = graph.edges.some(e => e.fromId === 'src/imports.ts' && e.toId === 'src/utils.ts');
      const hasConfigImport = graph.edges.some(e => e.fromId === 'src/imports.ts' && e.toId === 'src/config.ts');
      const hasLoggerImport = graph.edges.some(e => e.fromId === 'src/imports.ts' && e.toId === 'src/logger.ts');
      expect(hasCalcImport).toBe(true);
      expect(hasUtilsImport).toBe(true);
      expect(hasConfigImport).toBe(true);
      expect(hasLoggerImport).toBe(true);
    });

    it('should handle nested class and function definitions', async () => {
      const files: FileContent[] = [
        {
          path: 'src/nested.ts',
          content: `export class OuterClass {
  private inner = class InnerClass {
    method(): void {}
  };
  
  outerMethod(): void {
    function nestedFunction(): string {
      return 'nested';
    }
    nestedFunction();
  }
}`
        }
      ];

      const graph = await analyzer(files);

      // Should identify the outer class
      expect(graph.nodes.has('src/nested.ts#OuterClass')).toBe(true);
      
      const outerClass = graph.nodes.get('src/nested.ts#OuterClass');
      expect(outerClass!.type).toBe('class');
      expect(outerClass!.name).toBe('OuterClass');
    });

    it('should handle circular imports gracefully', async () => {
      const files: FileContent[] = [
        {
          path: 'src/a.ts',
          content: `import { B } from './b.js';
export class A {
  b: B;
}`
        },
        {
          path: 'src/b.ts',
          content: `import { A } from './a.js';
export class B {
  a: A;
}`
        }
      ];

      const graph = await analyzer(files);

      const aToB = graph.edges.some(e => e.fromId === 'src/a.ts' && e.toId === 'src/b.ts');
      const bToA = graph.edges.some(e => e.fromId === 'src/b.ts' && e.toId === 'src/a.ts');
      
      expect(aToB).toBe(true);
      expect(bToA).toBe(true);
      expect(graph.nodes.has('src/a.ts#A')).toBe(true);
      expect(graph.nodes.has('src/b.ts#B')).toBe(true);
    });
    it('should not create duplicate nodes for the same symbol', async () => {
      const files: FileContent[] = [
        {
          path: 'src/duplicate.ts',
          content: `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// This should not create a duplicate
export class Calculator {
  multiply(a: number, b: number): number {
    return a * b;
  }
}`
        }
      ];

      const graph = await analyzer(files);

      // Should only have one Calculator node (first one wins)
      const calculatorNodes = [...graph.nodes.keys()].filter((nodeId) =>
        nodeId.includes('#Calculator')
      );
      expect(calculatorNodes.length).toBe(1);
    });
  });

  describe('Integration with Fixtures', () => {
    it('should analyze sample-project fixture correctly', async () => {
      const fixture = await loadFixture('sample-project');
      await createProjectFromFixture(tempDir, fixture);

      const files: FileContent[] = [];
      for (const file of fixture.files) {
        if (file.path.endsWith('.ts')) {
          files.push({
            path: file.path,
            content: file.content
          });
        }
      }

      const graph = await analyzer(files);

      expect(graph.nodes.size).toBe(fixture.expected_nodes!);
      
      // Check for specific symbols from the fixture
      expect(graph.nodes.has('src/calculator.ts#Calculator')).toBe(true);
      expect(graph.nodes.has('src/utils/logger.ts#Logger')).toBe(true);
      expect(graph.nodes.has('src/types.ts#Config')).toBe(true);
    });

    it('should analyze complex-project fixture correctly', async () => {
      const fixture = await loadFixture('complex-project');
      await createProjectFromFixture(tempDir, fixture);

      const files: FileContent[] = [];
      for (const file of fixture.files) {
        if (file.path.endsWith('.ts') && !file.path.includes('test')) {
          files.push({
            path: file.path,
            content: file.content
          });
        }
      }

      const graph = await analyzer(files);

      // Check for key classes and interfaces
      expect(graph.nodes.has('src/database/index.ts#Database')).toBe(true);
      expect(graph.nodes.has('src/api/server.ts#ApiServer')).toBe(true);
      expect(graph.nodes.has('src/services/user.ts#UserService')).toBe(true);
      
      // Check for import relationships
      const serverToDb = graph.edges.some(e => e.fromId === 'src/api/server.ts' && e.toId === 'src/database/index.ts');
      const serverToUser = graph.edges.some(e => e.fromId === 'src/api/server.ts' && e.toId === 'src/services/user.ts');
      expect(serverToDb).toBe(true);
      expect(serverToUser).toBe(true);
    });

    it('should handle minimal-project fixture', async () => {
      const fixture = await loadFixture('minimal-project');
      await createProjectFromFixture(tempDir, fixture);

      const files: FileContent[] = [
        {
          path: 'src/main.ts',
          content: fixture.files[0]!.content
        }
      ];

      const graph = await analyzer(files);

      expect(graph.nodes.has('src/main.ts')).toBe(true);
      expect(graph.nodes.has('src/main.ts#hello')).toBe(true);
      expect(graph.nodes.has('src/main.ts#greet')).toBe(true);

      const helloNode = graph.nodes.get('src/main.ts#hello');
      const greetNode = graph.nodes.get('src/main.ts#greet');

      expect(helloNode!.type).toBe('function');
      expect(greetNode!.type).toBe('arrow_function');
    });
  });

  describe('Code Relationships', () => {
    it("should create a 'calls' edge when one function calls another", async () => {
      const files: FileContent[] = [
        {
          path: 'src/calls.ts',
          content: `function a() { console.log('a'); }
function b() { a(); }`
        }
      ];
      const graph = await analyzer(files);
      
      const hasCallEdge = graph.edges.some(
        e => e.fromId === 'src/calls.ts#b' && e.toId === 'src/calls.ts#a' && e.type === 'calls'
      );
      
      expect(hasCallEdge).toBe(true);
    });

    it("should create 'inherits' and 'implements' edges for class expressions", async () => {
      const files: FileContent[] = [
        {
          path: 'src/expressions.ts',
          content: `
interface IRunnable { run(): void; }
class Base {}
const MyClass = class extends Base implements IRunnable {
  run() {}
};`
        }
      ];
      const graph = await analyzer(files);

      const fromId = 'src/expressions.ts#MyClass';
      const inheritsEdge = graph.edges.some(
        e => e.fromId === fromId && e.toId === 'src/expressions.ts#Base' && e.type === 'inherits'
      );
      const implementsEdge = graph.edges.some(
        e => e.fromId === fromId && e.toId === 'src/expressions.ts#IRunnable' && e.type === 'implements'
      );
      
      expect(graph.nodes.has(fromId)).toBe(true);
      expect(inheritsEdge).toBe(true);
      expect(implementsEdge).toBe(true);
    });

    it("should correctly resolve module imports that omit the file extension", async () => {
      const files: FileContent[] = [
        {
          path: 'src/main.ts',
          content: "import { helper } from './utils'"
        },
        {
          path: 'src/utils.ts',
          content: 'export const helper = () => {};'
        }
      ];

      const graph = await analyzer(files);
      
      const hasImportEdge = graph.edges.some(
        e => e.fromId === 'src/main.ts' && e.toId === 'src/utils.ts' && e.type === 'imports'
      );

      expect(hasImportEdge).toBe(true);
    });
  });
});
````

## File: repograph/test/unit/codenode-qualifiers.test.ts
````typescript
import { describe, it, beforeEach, afterEach, expect } from 'bun:test';
import { createTreeSitterAnalyzer } from '../../src/pipeline/analyze.js';
import type { FileContent } from '../../src/types.js';
import {
  createTempDir,
  cleanupTempDir,
} from '../test.util.js';

describe('CodeNode Qualifiers Enhancement (scn-ts integration)', () => {
  let tempDir: string;
  let analyzer: ReturnType<typeof createTreeSitterAnalyzer>;

  beforeEach(async () => {
    tempDir = await createTempDir();
    analyzer = createTreeSitterAnalyzer();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('Function Qualifiers', () => {
    it('should detect async functions with parameters and return types', async () => {
      const files: FileContent[] = [
        {
          path: 'src/async-functions.ts',
          content: `export async function fetchUser(id: number, options?: RequestOptions): Promise<User> {
  return await api.get(\`/users/\${id}\`, options);
}

async function processData(data: string[]): Promise<void> {
  for (const item of data) {
    await process(item);
  }
}`
        }
      ];

      const graph = await analyzer(files);

      const fetchUserNode = graph.nodes.get('src/async-functions.ts#fetchUser');
      const processDataNode = graph.nodes.get('src/async-functions.ts#processData');

      expect(fetchUserNode).toBeDefined();
      expect(fetchUserNode!.isAsync).toBe(true);
      expect(fetchUserNode!.returnType).toBe('Promise<User>');
      expect(fetchUserNode!.parameters).toEqual([
        { name: 'id', type: 'number' },
        { name: 'options', type: 'RequestOptions' }
      ]);

      expect(processDataNode).toBeDefined();
      expect(processDataNode!.isAsync).toBe(true);
      expect(processDataNode!.returnType).toBe('Promise<void>');
      expect(processDataNode!.parameters).toEqual([
        { name: 'data', type: 'string[]' }
      ]);
    });

    it('should detect regular functions with parameters and return types', async () => {
      const files: FileContent[] = [
        {
          path: 'src/regular-functions.ts',
          content: `export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

function formatMessage(template: string, ...args: any[]): string {
  return template.replace(/{(\d+)}/g, (match, index) => args[index]);
}`
        }
      ];

      const graph = await analyzer(files);

      const calculateSumNode = graph.nodes.get('src/regular-functions.ts#calculateSum');
      const formatMessageNode = graph.nodes.get('src/regular-functions.ts#formatMessage');

      expect(calculateSumNode).toBeDefined();
      expect(calculateSumNode!.isAsync).toBeUndefined();
      expect(calculateSumNode!.returnType).toBe('number');
      expect(calculateSumNode!.parameters).toEqual([
        { name: 'numbers', type: 'number[]' }
      ]);

      expect(formatMessageNode).toBeDefined();
      expect(formatMessageNode!.isAsync).toBeUndefined();
      expect(formatMessageNode!.returnType).toBe('string');
      expect(formatMessageNode!.parameters).toEqual([
        { name: 'template', type: 'string' },
        { name: '...args', type: 'any[]' }
      ]);
    });

    it('should detect arrow functions with async and type annotations', async () => {
      const files: FileContent[] = [
        {
          path: 'src/arrow-functions.ts',
          content: `export const asyncArrow = async (data: string): Promise<boolean> => {
  const result = await validate(data);
  return result.isValid;
};

const syncArrow = (x: number, y: number): number => x + y;

export const noParamsArrow = (): void => {
  console.log('No parameters');
};`
        }
      ];

      const graph = await analyzer(files);

      const asyncArrowNode = graph.nodes.get('src/arrow-functions.ts#asyncArrow');
      const syncArrowNode = graph.nodes.get('src/arrow-functions.ts#syncArrow');
      const noParamsArrowNode = graph.nodes.get('src/arrow-functions.ts#noParamsArrow');

      expect(asyncArrowNode).toBeDefined();
      expect(asyncArrowNode!.isAsync).toBe(true);
      expect(asyncArrowNode!.returnType).toBe('Promise<boolean>');
      expect(asyncArrowNode!.parameters).toEqual([
        { name: 'data', type: 'string' }
      ]);

      expect(syncArrowNode).toBeDefined();
      expect(syncArrowNode!.isAsync).toBeUndefined();
      expect(syncArrowNode!.returnType).toBe('number');
      expect(syncArrowNode!.parameters).toEqual([
        { name: 'x', type: 'number' },
        { name: 'y', type: 'number' }
      ]);

      expect(noParamsArrowNode).toBeDefined();
      expect(noParamsArrowNode!.isAsync).toBeUndefined();
      expect(noParamsArrowNode!.returnType).toBe('void');
      expect(noParamsArrowNode!.parameters).toEqual([]);
    });
  });

  describe('Class Method Qualifiers', () => {
    it('should detect method visibility modifiers', async () => {
      const files: FileContent[] = [
        {
          path: 'src/class-methods.ts',
          content: `export class UserService {
  public async getUser(id: string): Promise<User> {
    return await this.repository.findById(id);
  }

  private validateUser(user: User): boolean {
    return user.email && user.name;
  }

  protected formatUserData(user: User): UserData {
    return {
      id: user.id,
      displayName: user.name
    };
  }

  static createDefault(): UserService {
    return new UserService(new DefaultRepository());
  }

  public static async initialize(config: Config): Promise<UserService> {
    const repo = await createRepository(config);
    return new UserService(repo);
  }
}`
        }
      ];

      const graph = await analyzer(files);

      const getUserNode = graph.nodes.get('src/class-methods.ts#getUser');
      const validateUserNode = graph.nodes.get('src/class-methods.ts#validateUser');
      const formatUserDataNode = graph.nodes.get('src/class-methods.ts#formatUserData');
      const createDefaultNode = graph.nodes.get('src/class-methods.ts#createDefault');
      const initializeNode = graph.nodes.get('src/class-methods.ts#initialize');

      expect(getUserNode).toBeDefined();
      expect(getUserNode!.visibility).toBe('public');
      expect(getUserNode!.isAsync).toBe(true);
      expect(getUserNode!.isStatic).toBeUndefined();
      expect(getUserNode!.returnType).toBe('Promise<User>');
      expect(getUserNode!.parameters).toEqual([
        { name: 'id', type: 'string' }
      ]);

      expect(validateUserNode).toBeDefined();
      expect(validateUserNode!.visibility).toBe('private');
      expect(validateUserNode!.isAsync).toBeUndefined();
      expect(validateUserNode!.isStatic).toBeUndefined();
      expect(validateUserNode!.returnType).toBe('boolean');

      expect(formatUserDataNode).toBeDefined();
      expect(formatUserDataNode!.visibility).toBe('protected');
      expect(formatUserDataNode!.isAsync).toBeUndefined();
      expect(formatUserDataNode!.isStatic).toBeUndefined();
      expect(formatUserDataNode!.returnType).toBe('UserData');

      expect(createDefaultNode).toBeDefined();
      expect(createDefaultNode!.isStatic).toBe(true);
      expect(createDefaultNode!.isAsync).toBeUndefined();
      expect(createDefaultNode!.returnType).toBe('UserService');

      expect(initializeNode).toBeDefined();
      expect(initializeNode!.visibility).toBe('public');
      expect(initializeNode!.isStatic).toBe(true);
      expect(initializeNode!.isAsync).toBe(true);
      expect(initializeNode!.returnType).toBe('Promise<UserService>');
    });

    it('should handle methods without explicit visibility (default public)', async () => {
      const files: FileContent[] = [
        {
          path: 'src/default-visibility.ts',
          content: `export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  async compute(operation: string): Promise<number> {
    return await this.performOperation(operation);
  }

  static getInstance(): Calculator {
    return new Calculator();
  }
}`
        }
      ];

      const graph = await analyzer(files);

      const addNode = graph.nodes.get('src/default-visibility.ts#add');
      const computeNode = graph.nodes.get('src/default-visibility.ts#compute');
      const getInstanceNode = graph.nodes.get('src/default-visibility.ts#getInstance');

      expect(addNode).toBeDefined();
      expect(addNode!.visibility).toBeUndefined(); // No explicit modifier
      expect(addNode!.isAsync).toBeUndefined();
      expect(addNode!.isStatic).toBeUndefined();

      expect(computeNode).toBeDefined();
      expect(computeNode!.visibility).toBeUndefined();
      expect(computeNode!.isAsync).toBe(true);
      expect(computeNode!.isStatic).toBeUndefined();

      expect(getInstanceNode).toBeDefined();
      expect(getInstanceNode!.visibility).toBeUndefined();
      expect(getInstanceNode!.isAsync).toBeUndefined();
      expect(getInstanceNode!.isStatic).toBe(true);
    });
  });

  describe('Class Field Qualifiers', () => {
    it('should detect field visibility and static modifiers', async () => {
      const files: FileContent[] = [
        {
          path: 'src/class-fields.ts',
          content: `export class DataStore {
  public readonly name: string;
  private data: Map<string, any>;
  protected config: Configuration;
  static defaultInstance: DataStore;
  public static readonly version: string = '1.0.0';

  private static cache: WeakMap<object, DataStore> = new WeakMap();
}`
        }
      ];

      const graph = await analyzer(files);

      const nameNode = graph.nodes.get('src/class-fields.ts#name');
      const dataNode = graph.nodes.get('src/class-fields.ts#data');
      const configNode = graph.nodes.get('src/class-fields.ts#config');
      const defaultInstanceNode = graph.nodes.get('src/class-fields.ts#defaultInstance');
      const versionNode = graph.nodes.get('src/class-fields.ts#version');
      const cacheNode = graph.nodes.get('src/class-fields.ts#cache');

      expect(nameNode).toBeDefined();
      expect(nameNode!.visibility).toBe('public');
      expect(nameNode!.isStatic).toBeUndefined();
      expect(nameNode!.returnType).toBe('string');

      expect(dataNode).toBeDefined();
      expect(dataNode!.visibility).toBe('private');
      expect(dataNode!.isStatic).toBeUndefined();
      expect(dataNode!.returnType).toBe('Map<string, any>');

      expect(configNode).toBeDefined();
      expect(configNode!.visibility).toBe('protected');
      expect(configNode!.isStatic).toBeUndefined();
      expect(configNode!.returnType).toBe('Configuration');

      expect(defaultInstanceNode).toBeDefined();
      expect(defaultInstanceNode!.isStatic).toBe(true);
      expect(defaultInstanceNode!.returnType).toBe('DataStore');

      expect(versionNode).toBeDefined();
      expect(versionNode!.visibility).toBe('public');
      expect(versionNode!.isStatic).toBe(true);
      expect(versionNode!.returnType).toBe('string');

      expect(cacheNode).toBeDefined();
      expect(cacheNode!.visibility).toBe('private');
      expect(cacheNode!.isStatic).toBe(true);
      expect(cacheNode!.returnType).toBe('WeakMap<object, DataStore>');
    });
  });

  describe('Complex Parameter Types', () => {
    it('should handle complex parameter types and optional parameters', async () => {
      const files: FileContent[] = [
        {
          path: 'src/complex-params.ts',
          content: `export function processRequest(
  request: HttpRequest,
  options?: {
    timeout?: number;
    retries?: number;
  },
  callback: (error: Error | null, result?: any) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    // Implementation
  });
}

export async function batchProcess<T>(
  items: T[],
  processor: (item: T) => Promise<ProcessResult>,
  concurrency: number = 5
): Promise<BatchResult<T>> {
  // Implementation
  return {} as BatchResult<T>;
}`
        }
      ];

      const graph = await analyzer(files);

      const processRequestNode = graph.nodes.get('src/complex-params.ts#processRequest');
      const batchProcessNode = graph.nodes.get('src/complex-params.ts#batchProcess');

      expect(processRequestNode).toBeDefined();
      expect(processRequestNode!.isAsync).toBeUndefined();
      expect(processRequestNode!.returnType).toBe('Promise<Response>');
      expect(processRequestNode!.parameters).toEqual([
        { name: 'request', type: 'HttpRequest' },
        { name: 'options', type: '{\n    timeout?: number;\n    retries?: number;\n  }' },
        { name: 'callback', type: '(error: Error | null, result?: any) => void' }
      ]);

      expect(batchProcessNode).toBeDefined();
      expect(batchProcessNode!.isAsync).toBe(true);
      expect(batchProcessNode!.returnType).toBe('Promise<BatchResult<T>>');
      expect(batchProcessNode!.parameters).toEqual([
        { name: 'items', type: 'T[]' },
        { name: 'processor', type: '(item: T) => Promise<ProcessResult>' },
        { name: 'concurrency', type: 'number' }
      ]);
    });

    it('should handle destructured parameters', async () => {
      const files: FileContent[] = [
        {
          path: 'src/destructured-params.ts',
          content: `export function createUser(
  { name, email, age }: { name: string; email: string; age?: number },
  options: UserOptions = {}
): User {
  return new User(name, email, age, options);
}

export const updateProfile = async (
  userId: string,
  { profile, settings }: { profile: ProfileData; settings?: UserSettings }
): Promise<void> => {
  await userService.update(userId, profile, settings);
};`
        }
      ];

      const graph = await analyzer(files);

      const createUserNode = graph.nodes.get('src/destructured-params.ts#createUser');
      const updateProfileNode = graph.nodes.get('src/destructured-params.ts#updateProfile');

      expect(createUserNode).toBeDefined();
      expect(createUserNode!.isAsync).toBeUndefined();
      expect(createUserNode!.returnType).toBe('User');
      expect(createUserNode!.parameters).toEqual([
        { name: '{ name, email, age }', type: '{ name: string; email: string; age?: number }' },
        { name: 'options', type: 'UserOptions' }
      ]);

      expect(updateProfileNode).toBeDefined();
      expect(updateProfileNode!.isAsync).toBe(true);
      expect(updateProfileNode!.returnType).toBe('Promise<void>');
      expect(updateProfileNode!.parameters).toEqual([
        { name: 'userId', type: 'string' },
        { name: '{ profile, settings }', type: '{ profile: ProfileData; settings?: UserSettings }' }
      ]);
    });
  });

  describe('Edge Cases and Compatibility', () => {
    it('should handle functions without type annotations gracefully', async () => {
      const files: FileContent[] = [
        {
          path: 'src/no-types.ts',
          content: `export function legacyFunction(data) {
  return data.toString();
}

export const arrowWithoutTypes = (x, y) => x + y;

export async function asyncWithoutTypes(input) {
  return await process(input);
}`
        }
      ];

      const graph = await analyzer(files);

      const legacyNode = graph.nodes.get('src/no-types.ts#legacyFunction');
      const arrowNode = graph.nodes.get('src/no-types.ts#arrowWithoutTypes');
      const asyncNode = graph.nodes.get('src/no-types.ts#asyncWithoutTypes');

      expect(legacyNode).toBeDefined();
      expect(legacyNode!.isAsync).toBeUndefined();
      expect(legacyNode!.returnType).toBeUndefined();
      expect(legacyNode!.parameters).toEqual([
        { name: 'data', type: undefined }
      ]);

      expect(arrowNode).toBeDefined();
      expect(arrowNode!.isAsync).toBeUndefined();
      expect(arrowNode!.returnType).toBeUndefined();
      expect(arrowNode!.parameters).toEqual([
        { name: 'x', type: undefined },
        { name: 'y', type: undefined }
      ]);

      expect(asyncNode).toBeDefined();
      expect(asyncNode!.isAsync).toBe(true);
      expect(asyncNode!.returnType).toBeUndefined();
      expect(asyncNode!.parameters).toEqual([
        { name: 'input', type: undefined }
      ]);
    });

    it('should maintain backward compatibility for existing CodeNode fields', async () => {
      const files: FileContent[] = [
        {
          path: 'src/compatibility.ts',
          content: `export class TestClass {
  public method(): void {}
}

export function testFunction(): string {
  return 'test';
}

export interface TestInterface {
  prop: number;
}`
        }
      ];

      const graph = await analyzer(files);

      const classNode = graph.nodes.get('src/compatibility.ts#TestClass');
      const methodNode = graph.nodes.get('src/compatibility.ts#method');
      const functionNode = graph.nodes.get('src/compatibility.ts#testFunction');
      const interfaceNode = graph.nodes.get('src/compatibility.ts#TestInterface');

      // Verify all original fields are still present
      expect(classNode).toBeDefined();
      expect(classNode!.id).toBe('src/compatibility.ts#TestClass');
      expect(classNode!.type).toBe('class');
      expect(classNode!.name).toBe('TestClass');
      expect(classNode!.filePath).toBe('src/compatibility.ts');
      expect(classNode!.startLine).toBeGreaterThan(0);
      expect(classNode!.endLine).toBeGreaterThan(0);
      expect(classNode!.codeSnippet).toBeDefined();

      // Verify new fields are present but don't break existing functionality
      expect(methodNode).toBeDefined();
      expect(methodNode!.visibility).toBe('public');
      expect(methodNode!.isAsync).toBeUndefined();
      expect(methodNode!.isStatic).toBeUndefined();

      expect(functionNode).toBeDefined();
      expect(functionNode!.returnType).toBe('string');
      expect(functionNode!.parameters).toEqual([]);

      expect(interfaceNode).toBeDefined();
      expect(interfaceNode!.type).toBe('interface');
      // New fields should be undefined for interfaces (as expected)
      expect(interfaceNode!.visibility).toBeUndefined();
      expect(interfaceNode!.isAsync).toBeUndefined();
      expect(interfaceNode!.isStatic).toBeUndefined();
    });
  });

  describe('SCN-TS Integration Mapping', () => {
    it('should provide data that maps to SCN notation correctly', async () => {
      const files: FileContent[] = [
        {
          path: 'src/scn-mapping.ts',
          content: `export class ApiController {
  // Maps to SCN: +method(param: string): Promise<Response> ...
  public async handleRequest(param: string): Promise<Response> {
    return await this.process(param);
  }

  // Maps to SCN: -validate(data: any): boolean
  private validate(data: any): boolean {
    return !!data;
  }

  // Maps to SCN: +static create(): ApiController
  public static create(): ApiController {
    return new ApiController();
  }
}`
        }
      ];

      const graph = await analyzer(files);

      const handleRequestNode = graph.nodes.get('src/scn-mapping.ts#handleRequest');
      const validateNode = graph.nodes.get('src/scn-mapping.ts#validate');
      const createNode = graph.nodes.get('src/scn-mapping.ts#create');

      // Verify mapping to SCN '+' (public), '...' (async), '#(type)' (return type)
      expect(handleRequestNode).toBeDefined();
      expect(handleRequestNode!.visibility).toBe('public'); // Maps to SCN '+'
      expect(handleRequestNode!.isAsync).toBe(true); // Maps to SCN '...'
      expect(handleRequestNode!.returnType).toBe('Promise<Response>'); // Maps to SCN '#(type)'
      expect(handleRequestNode!.parameters).toEqual([
        { name: 'param', type: 'string' }
      ]);

      // Verify mapping to SCN '-' (private)
      expect(validateNode).toBeDefined();
      expect(validateNode!.visibility).toBe('private'); // Maps to SCN '-'
      expect(validateNode!.isAsync).toBeUndefined();
      expect(validateNode!.returnType).toBe('boolean');

      // Verify static mapping
      expect(createNode).toBeDefined();
      expect(createNode!.visibility).toBe('public');
      expect(createNode!.isStatic).toBe(true); // Static indicator
      expect(createNode!.isAsync).toBeUndefined();
      expect(createNode!.returnType).toBe('ApiController');
    });
  });
});
````

## File: repograph/package.json
````json
{
  "name": "repograph",
  "version": "0.1.3",
  "description": "Your Codebase, Visualized. Generate rich, semantic, and interactive codemaps with a functional, composable API.",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "repograph": "./dist/index.js"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "clean": "rimraf dist",
    "build": "npm run clean && tsc -p tsconfig.build.json",
    "prepublishOnly": "npm run build",
    "dev": "tsc -w",
    "test": "bun run test/run-tests.ts",
    "test:unit": "bun run test/run-tests.ts unit",
    "test:integration": "bun run test/run-tests.ts integration",
    "test:e2e": "bun run test/run-tests.ts e2e",
    "test:watch": "bun test --watch test/**/*.test.ts",
    "test:coverage": "bun test --coverage test/**/*.test.ts",
    "test:basic": "bun test test-basic.js",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "dependencies": {
    "@types/js-yaml": "^4.0.9",
    "globby": "^14.1.0",
    "graphology": "^0.26.0",
    "graphology-pagerank": "^1.1.0",
    "ignore": "^7.0.5",
    "js-yaml": "^4.1.0",
    "tree-sitter-c": "^0.24.1",
    "tree-sitter-c-sharp": "^0.23.1",
    "tree-sitter-cpp": "^0.23.4",
    "tree-sitter-css": "^0.23.2",
    "tree-sitter-go": "^0.23.4",
    "tree-sitter-java": "^0.23.5",
    "tree-sitter-php": "^0.23.12",
    "tree-sitter-python": "^0.23.6",
    "tree-sitter-ruby": "^0.23.1",
    "tree-sitter-rust": "^0.24.0",
    "tree-sitter-solidity": "^1.2.11",
    "tree-sitter-swift": "^0.7.1",
    "tree-sitter-typescript": "^0.23.2",
    "tree-sitter-vue": "^0.2.1",
    "web-tree-sitter": "^0.25.6"
  },
  "devDependencies": {
    "@types/node": "^20.12.12",
    "bun-types": "^1.1.12",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "rimraf": "^5.0.7",
    "typescript": "^5.4.5"
  },
  "keywords": [
    "codemap",
    "graph",
    "visualization",
    "code-analysis",
    "tree-sitter",
    "repo-analysis",
    "ai-context",
    "bun",
    "functional-programming"
  ],
  "author": "RelayCoder <you@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/relaycoder/repograph.git"
  },
  "homepage": "https://github.com/relaycoder/repograph#readme",
  "bugs": {
    "url": "https://github.com/relaycoder/repograph/issues"
  },
  "engines": {
    "node": ">=18.0.0",
    "bun": ">=1.0.0"
  }
}
````

## File: repograph/tsconfig.build.json
````json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ES2022",
    "module": "ESNext",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "noEmit": false,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "noPropertyAccessFromIndexSignature": true,
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["src/**/*.test.ts", "src/**/*.spec.ts"]
}
````

## File: repograph/tsconfig.json
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
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "noPropertyAccessFromIndexSignature": true,

    // Type roots
    "typeRoots": ["./node_modules/@types", "./src/types", "./test/**/*"]
  }
}
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
