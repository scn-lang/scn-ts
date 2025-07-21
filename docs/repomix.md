# Directory Structure
```
docs/
  scn.readme.md
repograph/
  src/
    pipeline/
      analyze.ts
      discover.ts
      rank.ts
      render.ts
    tree-sitter/
      language-config.ts
      languages.ts
      queries.ts
    types/
      graphology-pagerank.d.ts
    utils/
      error.util.ts
      fs.util.ts
      logger.util.ts
    composer.ts
    high-level.ts
    index.ts
    types.ts
  package.json
  tsconfig.build.json
  tsconfig.json
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
          const symbolName = `${className}.${methodName}`;
          const symbolId = `${file.path}#${symbolName}`;
          if (!processedSymbols.has(symbolId) && !nodes.has(symbolId)) {
            processedSymbols.add(symbolId);
            nodes.set(symbolId, {
              id: symbolId, type: symbolType, name: symbolName, filePath: file.path,
              startLine: getLineFromIndex(file.content, node.startIndex),
              endLine: getLineFromIndex(file.content, node.endIndex),
              codeSnippet: node.text?.split('{')[0]?.trim() || '',
            });
          }
        }
      }
    }
    return false;
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

    return { nodes: Object.freeze(nodes), edges: Object.freeze(edges) };
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

    const snippetWithEquals = file.content.slice(nameNode.endIndex, node.endIndex).replace(/^{/, '').trim();
    const codeSnippet = snippetWithEquals.startsWith('=') ? snippetWithEquals.substring(1).trim() : snippetWithEquals;

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

    if (subtype && ['inheritance', 'implementation', 'call'].includes(subtype)) {
      const fromId = findEnclosingSymbolId(node, file, graph.nodes);
      if (!fromId) continue;
      const toName = getNodeText(node, file.content).replace(/<.*>$/, '');
      const toNode = resolver.resolve(toName, file.path);
      if (!toNode) continue;
      
      const edgeType = subtype === 'inheritance' ? 'inherits' : subtype === 'implementation' ? 'implements' : 'calls';
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

## File: repograph/src/pipeline/discover.ts
````typescript
import { globby } from 'globby';
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import Ignore from 'ignore';
import type { FileContent, FileDiscoverer } from '../types.js';
import { isDirectory, readFile } from '../utils/fs.util.js';
import { FileSystemError } from '../utils/error.util.js';
import { logger } from '../utils/logger.util.js';

/**
 * Creates the default file discoverer. It uses globby to find all files,
 * respecting .gitignore patterns and custom include/exclude rules.
 * @returns A FileDiscoverer function.
 */
export const createDefaultDiscoverer = (): FileDiscoverer => {
  return async ({ root, include, ignore, noGitignore = false }) => {
    try {
      if (!(await isDirectory(root))) {
        throw new FileSystemError('Root path is not a directory or does not exist', root);
      }
    } catch (e) {
      throw e;
    }
    const patterns = include && include.length > 0 ? [...include] : ['**/*'];
    
    // Use the ignore package for proper gitignore handling
    const ignoreFilter = Ignore();
    
    // Always ignore node_modules and .git
    ignoreFilter.add('**/node_modules/**');
    ignoreFilter.add('**/.git/**');
    ignoreFilter.add('.gitignore');
    
    // Add .gitignore patterns if not disabled
    if (!noGitignore) {
      let gitignoreContent = '';
      try {
        gitignoreContent = await readFile(path.join(root, '.gitignore'));
      } catch {
        // .gitignore is optional, so we can ignore errors here.
      }
      if (gitignoreContent) {
        ignoreFilter.add(gitignoreContent);
      }
    }
    
    // Add user-specified ignore patterns
    if (ignore && ignore.length > 0) {
      ignoreFilter.add(ignore.join('\n'));
    }

    // Use globby to find all files matching the include patterns.
    // Globby might return absolute paths if the patterns are absolute. We ensure
    // all paths are absolute first, then make them relative to the root for
    // consistent processing, which is required by the `ignore` package.
    const foundPaths = await globby(patterns, {
      cwd: root,
      gitignore: false, // We handle gitignore patterns manually
      dot: true,
      absolute: true,
      followSymbolicLinks: true,
      onlyFiles: true,
    });

    const relativePaths = foundPaths.map(p => path.relative(root, p).replace(/\\/g, '/'));

    // Filter out files that would cause symlink cycles
    const visitedRealPaths = new Set<string>();
    const safeRelativePaths: string[] = [];
    
    for (const relativePath of relativePaths) {
      const fullPath = path.resolve(root, relativePath);
      try {
        const realPath = await realpath(fullPath);
        if (!visitedRealPaths.has(realPath)) {
          visitedRealPaths.add(realPath);
          safeRelativePaths.push(relativePath);
        }
      } catch (error) {
        // If we can't resolve the real path, skip this file
        logger.debug(`Skipping file due to symlink resolution error: ${relativePath}`);
      }
    }
    
    // Filter the paths using the ignore package. Paths are now guaranteed to be relative.
    const filteredPaths = safeRelativePaths.filter(p => !ignoreFilter.ignores(p));

    const fileContents = await Promise.all(
      filteredPaths.map(async (relativePath): Promise<FileContent | null> => {
        try {
          const absolutePath = path.join(root, relativePath);
          const content = await readFile(absolutePath);
          return { path: relativePath, content };
        } catch (e) {
          logger.debug(`Skipping file that could not be read: ${relativePath}`, e instanceof Error ? e.message : e);
          return null;
        }
      })
    );

    return fileContents.filter((c): c is FileContent => c !== null);
  };
};
````

## File: repograph/src/pipeline/rank.ts
````typescript
import pagerank from 'graphology-pagerank';
import type { CodeGraph, Ranker, RankedCodeGraph } from '../types.js';
import Graph from 'graphology';
import { execSync } from 'node:child_process';
import { logger } from '../utils/logger.util.js';

/**
 * Creates a ranker that uses the PageRank algorithm. Nodes that are heavily referenced by
 * other important nodes will receive a higher rank.
 * @returns A Ranker function.
 */
export const createPageRanker = (): Ranker => {
  return async (graph: CodeGraph): Promise<RankedCodeGraph> => {
    // PageRank can only be computed on graphs with nodes.
    if (graph.nodes.size === 0) {
      return { ...graph, ranks: new Map() };
    }

    // Pagerank lib requires a graphology instance.
    const simpleGraph = new Graph({ type: 'directed' });
    for (const [nodeId, node] of graph.nodes) {
      simpleGraph.addNode(nodeId, node);
    }
    for (const edge of graph.edges) {
      if (!simpleGraph.hasEdge(edge.fromId, edge.toId)) {
        simpleGraph.addDirectedEdge(edge.fromId, edge.toId);
      }
    }

    const graphForRank = simpleGraph;
    const ranksData = pagerank(graphForRank);
    const ranks = new Map<string, number>();
    for (const node in ranksData) {
      ranks.set(node, ranksData[node] ?? 0);
    }
    return { ...graph, ranks };
  };
};

/**
 * Creates a ranker based on Git commit history. Files changed more frequently are considered
 * more important. Requires Git to be installed.
 * @returns A Ranker function.
 */
export const createGitRanker = (options: { maxCommits?: number } = {}): Ranker => {
  return async (graph: CodeGraph): Promise<RankedCodeGraph> => {
    const { maxCommits = 500 } = options;
    const ranks = new Map<string, number>();

    if (graph.nodes.size === 0) {
      return { ...graph, ranks };
    }

    try {
      const command = `git log --max-count=${maxCommits} --name-only --pretty=format:`;
      const output = execSync(command, { encoding: 'utf-8' });
      const files = output.split('\n').filter(Boolean);

      const changeCounts: Record<string, number> = {};
      for (const file of files) {
        changeCounts[file] = (changeCounts[file] || 0) + 1;
      }

      const maxChanges = Math.max(...Object.values(changeCounts), 1);

      for (const [nodeId, attributes] of graph.nodes) {
        // We only rank file nodes with this strategy
        if (attributes.type === 'file') {
          const count = changeCounts[attributes.filePath] ?? 0;
          ranks.set(nodeId, count / maxChanges); // Normalize score
        } else {
          ranks.set(nodeId, 0);
        }
      }
    } catch (e) {
      // This is not a fatal error for the whole process, but this ranker cannot proceed.
      logger.warn('Failed to use \'git\' for ranking. Is git installed and is this a git repository? Returning 0 for all ranks.');
      for (const [nodeId] of graph.nodes) {
        ranks.set(nodeId, 0);
      }
    }

    return { ...graph, ranks };
  };
};
````

## File: repograph/src/pipeline/render.ts
````typescript
import type { Renderer, RankedCodeGraph, RendererOptions, CodeEdge, CodeNode } from '../types.js';

const generateMermaidGraph = (rankedGraph: RankedCodeGraph): string => {
  const fileNodes = [...rankedGraph.nodes.values()].filter(node => node.type === 'file');
  if (fileNodes.length === 0) return '';

  let mermaidString = '```mermaid\n';
  mermaidString += 'graph TD\n';
  
  const edges = new Set<string>();
  for (const edge of rankedGraph.edges) {
      const sourceNode = rankedGraph.nodes.get(edge.fromId);
      const targetNode = rankedGraph.nodes.get(edge.toId);

      if(sourceNode?.type === 'file' && targetNode?.type === 'file' && edge.type === 'imports'){
        const edgeStr = `    ${edge.fromId}["${sourceNode.name}"] --> ${edge.toId}["${targetNode.name}"]`;
        if(!edges.has(edgeStr)) {
            edges.add(edgeStr);
        }
      }
  }

  mermaidString += Array.from(edges).join('\n');
  mermaidString += '\n```\n';
  return mermaidString;
};

const getRank = (id: string, ranks: ReadonlyMap<string, number>): number => ranks.get(id) || 0;

const buildRelationString = (
  label: string,
  edges: readonly CodeEdge[],
  allNodes: ReadonlyMap<string, CodeNode>,
  limit?: number
): string | null => {
  const names = edges.map(e => `\`${allNodes.get(e.toId)?.name ?? 'unknown'}\``);
  if (names.length === 0) return null;
  
  let displayNames = names;
  let suffix = '';
  if (limit && names.length > limit) {
      displayNames = names.slice(0, limit);
      suffix = '...';
  }
  
  return `${label} ${displayNames.join(', ')}${suffix}`;
};

/**
 * Creates the default Markdown renderer. It generates a summary, an optional
 * Mermaid diagram, and a detailed breakdown of files and symbols.
 * @returns A Renderer function.
 */
export const createMarkdownRenderer = (): Renderer => {
  return (rankedGraph: RankedCodeGraph, options: RendererOptions = {}) => { // NOSONAR
    const { nodes, ranks } = rankedGraph;
    const {
      customHeader,
      includeHeader = true,
      includeOverview = true,
      includeMermaidGraph = true,
      includeFileList = true,
      topFileCount = 10,
      includeSymbolDetails = true,
      fileSectionSeparator = '---',
      symbolDetailOptions,
    } = options;
    
    const {
      includeRelations = true,
      includeLineNumber = true,
      includeCodeSnippet = true,
      maxRelationsToShow = 3,
    } = symbolDetailOptions || {};

    const fileNodes = [...nodes.values()].filter(attrs => attrs.type === 'file');
    const sortedFiles = fileNodes
      .sort((a, b) => getRank(b.id, ranks) - getRank(a.id, ranks));

    let md = '';
    if (customHeader) {
      md += `${customHeader}\n\n`;
    } else if (includeHeader) {
      md += `# RepoGraph\n\n`;
      md += `_Generated by RepoGraph on ${new Date().toISOString()}_\n\n`;
    }

    if (includeOverview) {
      md += `## 🚀 Project Overview\n\n`;
      md += `This repository contains ${nodes.size} nodes (${sortedFiles.length} files).\n\n`;
    }

    if (includeMermaidGraph) {
      md += `### Module Dependency Graph\n\n`;
      md += generateMermaidGraph(rankedGraph);
    }
    
    if (includeFileList && sortedFiles.length > 0) {
      md += `### Top ${topFileCount} Most Important Files\n\n`;
      md += `| Rank | File | Description |\n`;
      md += `| :--- | :--- | :--- |\n`;
      sortedFiles.slice(0, topFileCount).forEach((file, i) => {
        md += `| ${i + 1} | \`${file.filePath}\` | Key module in the architecture. |\n`;
      });
      md += `\n${fileSectionSeparator}\n\n`;
    }

    if (includeSymbolDetails) {
      md += `## 📂 File & Symbol Breakdown\n\n`;
      for (const fileNode of sortedFiles) {
        md += `### [\`${fileNode.filePath}\`](./${fileNode.filePath})\n\n`;
        
        const symbolNodes = [...nodes.values()]
          .filter(node => node.filePath === fileNode.filePath && node.type !== 'file')
          .sort((a, b) => a.startLine - b.startLine);

        if (symbolNodes.length > 0) {
          for (const symbol of symbolNodes) {
            const detailParts: string[] = [];
            if (includeRelations) {
              const outgoingEdges = rankedGraph.edges.filter(e => e.fromId === symbol.id);
              if (outgoingEdges.length > 0) {
                const edgeGroups = outgoingEdges.reduce((acc, edge) => {
                  (acc[edge.type] = acc[edge.type] || []).push(edge);
                  return acc;
                }, {} as Record<CodeEdge['type'], CodeEdge[]>);
                
                const relationParts = [
                  buildRelationString('inherits', edgeGroups.inherits || [], nodes),
                  buildRelationString('implements', edgeGroups.implements || [], nodes),
                  buildRelationString('calls', edgeGroups.calls || [], nodes, maxRelationsToShow),
                ].filter((s): s is string => s !== null);
                if (relationParts.length > 0) detailParts.push(`(${relationParts.join('; ')})`);
              }
            }
            if (includeLineNumber) {
              detailParts.push(`- _L${symbol.startLine}_`);
            }

            md += `- **\`${symbol.type} ${symbol.name}\`**${detailParts.length > 0 ? ` ${detailParts.join(' ')}` : ''}\n`;
            
            if (includeCodeSnippet && symbol.codeSnippet) {
              // Use language from file extension for syntax highlighting if possible
              const lang = fileNode.language || fileNode.filePath.split('.').pop() || '';
              md += `  \`\`\`${lang}\n  ${symbol.codeSnippet}\n  \`\`\`\n`;
            }
          }
        } else {
            md += `_No symbols identified in this file._\n`
        }
        md += `\n${fileSectionSeparator}\n\n`;
      }
    }

    return md;
  };
};
````

## File: repograph/src/tree-sitter/language-config.ts
````typescript
import type { Language } from 'web-tree-sitter';

export interface LanguageConfig {
  name: string;
  extensions: string[];
  wasmPath: string;
  query: string;
}

export interface LoadedLanguage {
  config: LanguageConfig;
  language: Language;
}

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    name: 'typescript',
    extensions: ['.ts', '.js', '.mjs', '.cjs'],
    wasmPath: 'tree-sitter-typescript/tree-sitter-typescript.wasm',
    query: `
(import_statement
  source: (string) @import.source) @import.statement

(class_declaration) @class.definition
(export_statement declaration: (class_declaration)) @class.definition

(function_declaration
  ("async")? @qualifier.async
  parameters: (formal_parameters) @symbol.parameters
  return_type: (type_annotation)? @symbol.returnType
) @function.definition
(export_statement
  declaration: (function_declaration
    ("async")? @qualifier.async
    parameters: (formal_parameters) @symbol.parameters
    return_type: (type_annotation)? @symbol.returnType
  )
) @function.definition

(variable_declarator
  value: (arrow_function
    ("async")? @qualifier.async
    parameters: (formal_parameters)? @symbol.parameters
    return_type: (type_annotation)? @symbol.returnType
  )
) @function.arrow.definition
(public_field_definition
  value: (arrow_function
    ("async")? @qualifier.async
    parameters: (formal_parameters)? @symbol.parameters
    return_type: (type_annotation)? @symbol.returnType
  )
) @function.arrow.definition
(export_statement
  declaration: (lexical_declaration
    (variable_declarator
      value: (arrow_function
        ("async")? @qualifier.async
        parameters: (formal_parameters)? @symbol.parameters
        return_type: (type_annotation)? @symbol.returnType
      )
    )
  )
) @function.arrow.definition

(interface_declaration) @interface.definition
(export_statement declaration: (interface_declaration)) @interface.definition

(type_alias_declaration) @type.definition
(export_statement declaration: (type_alias_declaration)) @type.definition

(enum_declaration) @enum.definition
(export_statement declaration: (enum_declaration)) @enum.definition

(method_definition
  (accessibility_modifier)? @qualifier.visibility
  ("static")? @qualifier.static
  ("async")? @qualifier.async
  parameters: (formal_parameters) @symbol.parameters
  return_type: (type_annotation)? @symbol.returnType
) @method.definition

(public_field_definition
  (accessibility_modifier)? @qualifier.visibility
  ("static")? @qualifier.static
  type: (type_annotation)? @symbol.returnType
) @field.definition

(variable_declarator) @variable.definition
(export_statement declaration: (lexical_declaration (variable_declarator))) @variable.definition

(call_expression
  function: (identifier) @function.call)

(throw_statement) @qualifier.throws

; Class inheritance and implementation patterns
(extends_clause (identifier) @class.inheritance)
(implements_clause (type_identifier) @class.implementation)
`
  },
  {
    name: 'tsx',
    extensions: ['.tsx', '.jsx'],
    wasmPath: 'tree-sitter-typescript/tree-sitter-tsx.wasm',
    query: `
(import_statement
  source: (string) @import.source) @import.statement

(class_declaration) @class.definition
(export_statement declaration: (class_declaration)) @class.definition

(function_declaration
  ("async")? @qualifier.async
  parameters: (formal_parameters) @symbol.parameters
  return_type: (type_annotation)? @symbol.returnType
) @function.definition
(export_statement
  declaration: (function_declaration
    ("async")? @qualifier.async
    parameters: (formal_parameters) @symbol.parameters
    return_type: (type_annotation)? @symbol.returnType
  )
) @function.definition

(variable_declarator
  value: (arrow_function
    ("async")? @qualifier.async
    parameters: (formal_parameters)? @symbol.parameters
    return_type: (type_annotation)? @symbol.returnType
  )
) @function.arrow.definition
(public_field_definition
  value: (arrow_function
    ("async")? @qualifier.async
    parameters: (formal_parameters)? @symbol.parameters
    return_type: (type_annotation)? @symbol.returnType
  )
) @function.arrow.definition
(export_statement
  declaration: (lexical_declaration
    (variable_declarator
      value: (arrow_function
        ("async")? @qualifier.async
        parameters: (formal_parameters)? @symbol.parameters
        return_type: (type_annotation)? @symbol.returnType
      )
    )
  )
) @function.arrow.definition

(interface_declaration) @interface.definition
(export_statement declaration: (interface_declaration)) @interface.definition

(type_alias_declaration) @type.definition
(export_statement declaration: (type_alias_declaration)) @type.definition

(enum_declaration) @enum.definition
(export_statement declaration: (enum_declaration)) @enum.definition

(method_definition
  (accessibility_modifier)? @qualifier.visibility
  ("static")? @qualifier.static
  ("async")? @qualifier.async
  parameters: (formal_parameters) @symbol.parameters
  return_type: (type_annotation)? @symbol.returnType
) @method.definition

(public_field_definition
  (accessibility_modifier)? @qualifier.visibility
  ("static")? @qualifier.static
  type: (type_annotation)? @symbol.returnType
) @field.definition

(variable_declarator) @variable.definition
(export_statement declaration: (lexical_declaration (variable_declarator))) @variable.definition

(call_expression
  function: (identifier) @function.call)

(throw_statement) @qualifier.throws

; Class inheritance and implementation patterns
(extends_clause (identifier) @class.inheritance)
(implements_clause (type_identifier) @class.implementation)

; JSX/TSX specific
(jsx_opening_element
  name: (_) @html.tag
) @html.element.definition
`
  },
  {
    name: 'python',
    extensions: ['.py', '.pyw'],
    wasmPath: 'tree-sitter-python/tree-sitter-python.wasm',
    query: `
(import_statement) @import.statement
(import_from_statement
  module_name: (relative_import) @import.source) @import.statement
(import_from_statement
  module_name: (dotted_name) @import.source) @import.statement

(class_definition) @class.definition

(function_definition) @function.definition

(decorated_definition
  (function_definition)) @function.definition

(decorated_definition
  (class_definition)) @class.definition

(class_definition
  body: (block (function_definition) @method.definition))

(expression_statement
  (assignment)) @variable.definition

(raise_statement) @qualifier.throws

; Python inheritance patterns
(class_definition
  superclasses: (argument_list (identifier) @class.inheritance))
`
  },
  {
    name: 'java',
    extensions: ['.java'],
    wasmPath: 'tree-sitter-java/tree-sitter-java.wasm',
    query: `
(import_declaration
  (scoped_identifier) @import.source) @import.statement

(class_declaration) @class.definition
(interface_declaration) @interface.definition
(enum_declaration) @enum.definition

(method_declaration
  (modifiers)? @qualifier.modifiers
) @method.definition

(constructor_declaration) @constructor.definition

(field_declaration) @field.definition

(throw_statement) @qualifier.throws

; Java inheritance and implementation patterns
(superclass (type_identifier) @class.inheritance)
(super_interfaces (type_list (type_identifier) @class.implementation))

`
  },
  {
    name: 'cpp',
    extensions: ['.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.hxx'],
    wasmPath: 'tree-sitter-cpp/tree-sitter-cpp.wasm',
    query: `
(preproc_include) @import.statement

(function_definition) @function.definition
(declaration
  declarator: (function_declarator)) @function.declaration

(class_specifier) @class.definition
(struct_specifier) @struct.definition
(union_specifier) @union.definition
(enum_specifier) @enum.definition

(namespace_definition) @namespace.definition

(template_declaration) @template.definition

(function_definition declarator: (qualified_identifier)) @method.definition
(field_declaration declarator: (function_declarator)) @method.definition
(field_declaration) @field.definition

(throw_expression) @qualifier.throws
`
  },
  {
    name: 'c',
    extensions: ['.c'],
    wasmPath: 'tree-sitter-c/tree-sitter-c.wasm',
    query: `
(preproc_include) @import.statement

(function_definition) @function.definition
(declaration declarator: (function_declarator)) @function.declaration
(struct_specifier) @struct.definition
(union_specifier) @union.definition
(enum_specifier) @enum.definition
(type_definition) @type.definition
`
  },
  {
    name: 'go',
    extensions: ['.go'],
    wasmPath: 'tree-sitter-go/tree-sitter-go.wasm',
    query: `
(import_declaration) @import.statement

(function_declaration) @function.definition
(method_declaration) @method.definition

(type_declaration) @type.definition

(var_declaration) @variable.definition
(const_declaration) @constant.definition
`
  },
  {
    name: 'rust',
    extensions: ['.rs'],
    wasmPath: 'tree-sitter-rust/tree-sitter-rust.wasm',
    query: `
(mod_item
  name: (identifier) @import.source) @import.statement

(function_item) @function.definition
(impl_item) @impl.definition

(struct_item) @struct.definition
(enum_item) @enum.definition
(trait_item) @trait.definition
(function_signature_item) @method.definition

(type_item) @type.definition
(const_item) @constant.definition
(static_item) @static.definition

(function_signature_item) @function.declaration
`
  },
  {
    name: 'csharp',
    extensions: ['.cs'],
    wasmPath: 'tree-sitter-c-sharp/tree-sitter-c_sharp.wasm',
    query: `
(using_directive) @import.statement

(class_declaration) @class.definition
(interface_declaration) @interface.definition
(struct_declaration) @struct.definition
(enum_declaration) @enum.definition

(method_declaration) @method.definition
(constructor_declaration) @constructor.definition

(field_declaration) @field.definition
(property_declaration) @property.definition

(namespace_declaration) @namespace.definition

(throw_statement) @qualifier.throws
`
  },
  {
    name: 'php',
    extensions: ['.php'],
    wasmPath: 'tree-sitter-php/tree-sitter-php.wasm',
    query: `
      (namespace_definition) @namespace.definition
      (class_declaration) @class.definition
      (function_definition) @function.definition
      (method_declaration) @method.definition
    `
  },
  {
    name: 'ruby',
    extensions: ['.rb'],
    wasmPath: 'tree-sitter-ruby/tree-sitter-ruby.wasm',
    query: `
      (module) @module.definition
      (class) @class.definition
      (method) @method.definition
      (singleton_method) @method.definition
    `
  },
  {
    name: 'solidity',
    extensions: ['.sol'],
    wasmPath: 'tree-sitter-solidity/tree-sitter-solidity.wasm',
    query: `
      (contract_declaration) @class.definition
      (function_definition) @function.definition
      (event_definition) @enum.definition
    `
  },
  {
    name: 'swift',
    extensions: ['.swift'],
    wasmPath: 'tree-sitter-swift/tree-sitter-swift.wasm',
    query: `
      (class_declaration) @class.definition
      (protocol_declaration) @trait.definition
      (function_declaration) @function.definition
      (protocol_function_declaration) @function.definition
      (property_declaration) @field.definition
    `
  },
  {
    name: 'vue',
    extensions: ['.vue'],
    wasmPath: 'tree-sitter-vue/tree-sitter-vue.wasm',
    query: `
      (script_element .
        [
          (lexical_declaration (variable_declarator)) @variable.definition
          (function_declaration) @function.definition
        ])

      (element
        (start_tag
          (tag_name) @html.tag
        )
      ) @html.element.definition
`
  },
  {
    name: 'css',
    extensions: ['.css'],
    wasmPath: 'tree-sitter-css/tree-sitter-css.wasm',
    query: `
      (rule_set
        (selectors) @css.selector
      ) @css.rule.definition
    `
  }
];

/**
 * Get the language configuration for a given file extension
 */
export function getLanguageConfigForFile(filePath: string): LanguageConfig | null {
  const extension = filePath.substring(filePath.lastIndexOf('.'));
  
  for (const config of LANGUAGE_CONFIGS) {
    if (config.extensions.includes(extension)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Get all supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return LANGUAGE_CONFIGS.flatMap(config => config.extensions);
}
````

## File: repograph/src/tree-sitter/languages.ts
````typescript
import * as Parser from 'web-tree-sitter';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_CONFIGS, type LanguageConfig, type LoadedLanguage } from './language-config.js';
import { logger } from '../utils/logger.util.js';
import { ParserError } from '../utils/error.util.js';

// Helper to get the correct path in different environments
const getDirname = () => path.dirname(fileURLToPath(import.meta.url));

let isInitialized = false;
const loadedLanguages = new Map<string, LoadedLanguage>();

/**
 * Initializes the Tree-sitter parser system.
 * This function is idempotent.
 */
export const initializeParser = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  await Parser.Parser.init();
  isInitialized = true;
};

/**
 * Loads a specific language grammar.
 * @param config The language configuration to load
 * @returns A LoadedLanguage object containing the config and language
 */
export const loadLanguage = async (config: LanguageConfig): Promise<LoadedLanguage> => {
  if (loadedLanguages.has(config.name)) {
    return loadedLanguages.get(config.name)!;
  }

  await initializeParser();

  try {
    const wasmPath = path.resolve(getDirname(), '..', '..', 'node_modules', config.wasmPath);
    const language = await Parser.Language.load(wasmPath);
    
    const loadedLanguage: LoadedLanguage = {
      config,
      language
    };
    
    loadedLanguages.set(config.name, loadedLanguage);
    return loadedLanguage;
  } catch (error) {
    const message = `Failed to load Tree-sitter WASM file for ${config.name}. Please ensure '${config.wasmPath.split('/')[0]}' is installed.`;
    logger.error(message, error);
    throw new ParserError(message, config.name, error);
  }
};

/**
 * Creates a parser instance for a specific language.
 * @param config The language configuration
 * @returns A parser instance configured for the specified language
 */
export const createParserForLanguage = async (config: LanguageConfig): Promise<Parser.Parser> => {
  const loadedLanguage = await loadLanguage(config);
  const parser = new Parser.Parser();
  parser.setLanguage(loadedLanguage.language);
  return parser;
};

/**
 * Gets all loaded languages.
 * @returns A map of language names to LoadedLanguage objects
 */
export const getLoadedLanguages = (): Map<string, LoadedLanguage> => {
  return new Map(loadedLanguages);
};

/**
 * Preloads all supported languages.
 * This can be called to eagerly load all language parsers.
 */
export const preloadAllLanguages = async (): Promise<void> => {
  await Promise.all(LANGUAGE_CONFIGS.map(config => loadLanguage(config)));
};

// Legacy function for backward compatibility
export const getParser = async (): Promise<Parser.Parser> => {
  const tsConfig = LANGUAGE_CONFIGS.find(config => config.name === 'typescript');
  if (!tsConfig) {
    throw new Error('TypeScript configuration not found');
  }
  return createParserForLanguage(tsConfig);
};
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

## File: repograph/src/types/graphology-pagerank.d.ts
````typescript
declare module 'graphology-pagerank' {
  import type Graph from 'graphology';

  export default function pagerank<T = any>(graph: Graph<T>, options?: {
    alpha?: number;
    tolerance?: number;
    maxIterations?: number;
    getEdgeWeight?: (edge: string) => number;
  }): Record<string, number>;
}
````

## File: repograph/src/utils/error.util.ts
````typescript
export class RepoGraphError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'RepoGraphError';
    if (this.originalError instanceof Error && this.originalError.stack) {
      this.stack = `${this.stack}\nCaused by: ${this.originalError.stack}`;
    }
  }
}

export class FileSystemError extends RepoGraphError {
  constructor(message: string, public readonly path: string, originalError?: unknown) {
    super(`${message}: ${path}`, originalError);
    this.name = 'FileSystemError';
  }
}

export class ParserError extends RepoGraphError {
  constructor(message: string, public readonly language?: string, originalError?: unknown) {
    super(language ? `[${language}] ${message}` : message, originalError);
    this.name = 'ParserError';
  }
}
````

## File: repograph/src/utils/fs.util.ts
````typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import { FileSystemError } from './error.util.js';

export const readFile = async (filePath: string): Promise<string> => {
  try {
    const buffer = await fs.readFile(filePath);
    // A simple heuristic to filter out binary files is checking for a null byte.
    if (buffer.includes(0)) {
      throw new FileSystemError('File appears to be binary', filePath);
    }
    return buffer.toString('utf-8');
  } catch (e) {
    if (e instanceof FileSystemError) {
      throw e;
    }
    throw new FileSystemError('Failed to read file', filePath, e);
  }
};

export const writeFile = async (filePath: string, content: string): Promise<void> => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  } catch (e) {
    throw new FileSystemError('Failed to write file', filePath, e);
  }
};

export const isDirectory = async (filePath: string): Promise<boolean> => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT') {
      return false;
    }
    throw new FileSystemError('Failed to check if path is a directory', filePath, e);
  }
};
````

## File: repograph/src/utils/logger.util.ts
````typescript
export const LogLevels = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
} as const;

export type LogLevel = keyof typeof LogLevels;

// This state is internal to the logger module.
let currentLevel: LogLevel = 'info';

const logFunctions: Record<Exclude<LogLevel, 'silent'>, (...args: any[]) => void> = {
  error: console.error,
  warn: console.warn,
  info: console.log, // Use console.log for info for cleaner output
  debug: console.debug,
};

const log = (level: LogLevel, ...args: any[]): void => {
  if (level === 'silent' || LogLevels[level] > LogLevels[currentLevel]) {
    return;
  }

  logFunctions[level](...args);
};

export type Logger = {
  readonly error: (...args: any[]) => void;
  readonly warn: (...args: any[]) => void;
  readonly info: (...args: any[]) => void;
  readonly debug: (...args: any[]) => void;
  readonly setLevel: (level: LogLevel) => void;
  readonly getLevel: () => LogLevel;
};

const createLogger = (): Logger => {
  return Object.freeze({
    error: (...args: any[]) => log('error', ...args),
    warn: (...args: any[]) => log('warn', ...args),
    info: (...args: any[]) => log('info', ...args),
    debug: (...args: any[]) => log('debug', ...args),
    setLevel: (level: LogLevel) => {
      if (level in LogLevels) {
        currentLevel = level;
      }
    },
    getLevel: () => currentLevel,
  });
};

export const logger = createLogger();
````

## File: repograph/src/composer.ts
````typescript
import path from 'node:path';
import type { Analyzer, FileDiscoverer, Ranker, Renderer, RepoGraphMap } from './types.js';
import { logger } from './utils/logger.util.js';
import { writeFile } from './utils/fs.util.js';

type MapGenerator = (config: {
  readonly root: string;
  readonly output?: string;
  readonly include?: readonly string[];
  readonly ignore?: readonly string[];
  readonly noGitignore?: boolean;
  readonly rendererOptions?: any;
}) => Promise<RepoGraphMap>;

/**
 * A Higher-Order Function that takes pipeline functions as arguments and
 * returns a fully configured `generate` function for creating a codemap.
 * This is the core of RepoGraph's composability.
 *
 * @param pipeline An object containing implementations for each pipeline stage.
 * @returns An asynchronous function to generate and write the codemap.
 */
export const createMapGenerator = (pipeline: {
  readonly discover: FileDiscoverer;
  readonly analyze: Analyzer;
  readonly rank: Ranker;
  readonly render: Renderer;
}): MapGenerator => {
  if (
    !pipeline ||
    typeof pipeline.discover !== 'function' ||
    typeof pipeline.analyze !== 'function' ||
    typeof pipeline.rank !== 'function' ||
    typeof pipeline.render !== 'function'
  ) {
    throw new Error('createMapGenerator: A valid pipeline object with discover, analyze, rank, and render functions must be provided.');
  }
  return async (config) => {
    const { root, output, include, ignore, noGitignore, rendererOptions } = config;

    let stage = 'discover';
    try {
      logger.info('1/4 Discovering files...');
      const files = await pipeline.discover({ root, include, ignore, noGitignore });
      logger.info(`  -> Found ${files.length} files to analyze.`);

      stage = 'analyze';
      logger.info('2/4 Analyzing code and building graph...');
      const graph = await pipeline.analyze(files);
      logger.info(`  -> Built graph with ${graph.nodes.size} nodes and ${graph.edges.length} edges.`);

      stage = 'rank';
      logger.info('3/4 Ranking graph nodes...');
      const rankedGraph = await pipeline.rank(graph);
      logger.info('  -> Ranking complete.');

      stage = 'render';
      logger.info('4/4 Rendering output...');
      const markdown = pipeline.render(rankedGraph, rendererOptions);
      logger.info('  -> Rendering complete.');

      if (output) {
        const outputPath = path.isAbsolute(output) ? output : path.resolve(root, output);
        stage = 'write';
        logger.info(`Writing report to ${path.relative(process.cwd(), outputPath)}...`);
        await writeFile(outputPath, markdown);
        logger.info('  -> Report saved.');
      }

      return { graph: rankedGraph, markdown };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stageErrorMessage = stage === 'write' ? `Failed to write output file` : `Error in ${stage} stage`;
      // We will create a new error to wrap the original one, preserving its stack.
      const newError = new Error(`${stageErrorMessage}: ${message}`);
      if (error instanceof Error && error.stack) {
        newError.stack = `${newError.stack}\nCaused by: ${error.stack}`;
      }
      throw newError;
    }
  };
};
````

## File: repograph/src/high-level.ts
````typescript
import { createDefaultDiscoverer } from './pipeline/discover.js';
import { createTreeSitterAnalyzer } from './pipeline/analyze.js';
import { createPageRanker, createGitRanker } from './pipeline/rank.js';
import { createMarkdownRenderer } from './pipeline/render.js';
import type { RepoGraphOptions, Ranker, RankedCodeGraph } from './types.js';
import path from 'node:path';
import { logger } from './utils/logger.util.js';
import { writeFile } from './utils/fs.util.js';
import { RepoGraphError } from './utils/error.util.js';

const selectRanker = (rankingStrategy: RepoGraphOptions['rankingStrategy'] = 'pagerank'): Ranker => {
  if (rankingStrategy === 'git-changes') {
    return createGitRanker();
  }
  if (rankingStrategy === 'pagerank') {
    return createPageRanker();
  }
  throw new Error(`Invalid ranking strategy: '${rankingStrategy}'. Available options are 'pagerank', 'git-changes'.`);
};

/**
 * A mid-level API for programmatically generating and receiving the code graph
 * without rendering it to a file. Ideal for integration with other tools.
 *
 * @param options The configuration object for generating the map.
 * @returns The generated `RankedCodeGraph`.
 */
export const analyzeProject = async (options: RepoGraphOptions = {}): Promise<RankedCodeGraph> => {
  const {
    root = process.cwd(),
    logLevel = 'info',
    include,
    ignore,
    noGitignore,
  } = options;

  if (logLevel) {
    logger.setLevel(logLevel);
  }

  // Validate options before entering the main try...catch block to provide clear errors.
  const ranker = selectRanker(options.rankingStrategy);

  try {
    logger.info('1/3 Discovering files...');
    const discoverer = createDefaultDiscoverer();
    const files = await discoverer({ root: path.resolve(root), include, ignore, noGitignore });
    logger.info(`  -> Found ${files.length} files to analyze.`);

    logger.info('2/3 Analyzing code and building graph...');
    const analyzer = createTreeSitterAnalyzer();
    const graph = await analyzer(files);
    logger.info(`  -> Built graph with ${graph.nodes.size} nodes and ${graph.edges.length} edges.`);

    logger.info('3/3 Ranking graph nodes...');
    const rankedGraph = await ranker(graph);
    logger.info('  -> Ranking complete.');

    return rankedGraph;
  } catch (error) {
    throw new RepoGraphError(`Failed to analyze project`, error);
  }
};

/**
 * The primary, easy-to-use entry point for RepoGraph. It orchestrates the
 * default pipeline based on a configuration object to generate a codemap.
 *
 * @param options The configuration object for generating the map.
 */
export const generateMap = async (options: RepoGraphOptions = {}): Promise<void> => {
  const {
    root = process.cwd(),
    output = './repograph.md',
  } = options;

  try {
    // We get the full ranked graph first
    const rankedGraph = await analyzeProject(options);

    logger.info('4/4 Rendering output...');
    const renderer = createMarkdownRenderer();
    const markdown = renderer(rankedGraph, options.rendererOptions);
    logger.info('  -> Rendering complete.');

    const outputPath = path.isAbsolute(output) ? output : path.resolve(root, output);

    logger.info(`Writing report to ${path.relative(process.cwd(), outputPath)}...`);
    await writeFile(outputPath, markdown);
    logger.info('  -> Report saved.');
  } catch (error) {
    // The underlying `analyzeProject` already wraps the error, so we just re-throw.
    throw error;
  }
};
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
  const scnOutput = serializeGraph(graph);
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

const getVisibilitySymbol = (visibility?: Visibility): '+' | '-' | undefined => {
  if (visibility === 'public') return '+';
  if (visibility === 'private') return '-';
  return undefined;
};

const getNodeSymbol = (node: CodeNode): ScnSymbol => {
  // Heuristic: Treat uppercase constants/variables as containers (module pattern)
  if ((node.type === 'variable' || node.type === 'constant') && node.name.match(/^[A-Z]/)) {
      return '◇';
  }
  return ENTITY_TYPE_TO_SYMBOL[node.type] ?? '?';
};

const getQualifiers = (node: CodeNode): QualifierSymbol[] => {
  const qualifiers: QualifierSymbol[] = [];
  const visibilitySymbol = getVisibilitySymbol(node.visibility);
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

const formatSignature = (node: CodeNode): string =>
  node.codeSnippet ??
  (node.type === 'css_rule' && node.cssIntents
    ? formatCssIntents(node.cssIntents) : '');

const formatNode = (node: CodeNode, graph: RankedCodeGraph, idManager: ScnIdManager): string => {
  const symbol = getNodeSymbol(node);
  const qualifiers = getQualifiers(node).join('');
  const signature = formatSignature(node);
  const scnId = idManager.getScnId(node.id);
  const id = scnId ? `(${scnId})` : '';

  const mainLine = ['  ', qualifiers, symbol, id, node.name, signature]
    .filter(p => p).join(' ').trim();

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
  idManager: ScnIdManager
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

  const nodeLines = symbols.map(node => formatNode(node, graph, idManager));

  return [header, ...nodeLines].join('\n');
};

/**
 * Serializes a RankedCodeGraph into the SCN text format.
 * This function is the core rendering layer of `scn-ts`.
 *
 * @param graph - The `RankedCodeGraph` produced by `repograph`.
 * @returns A string containing the full SCN map.
 */
export const serializeGraph = (graph: RankedCodeGraph): string => {
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
    return serializeFile(fileNode, symbols, graph, idManager);
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
