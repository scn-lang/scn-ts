# Directory Structure
```
repograph/
  src/
    index.ts
  web-demo/
    src/
      App.css
      App.tsx
      main.tsx
    index.html
    package.json
    tsconfig.json
    tsconfig.node.json
    vite.config.ts
  package.json
  tsconfig.json
  tsup.config.ts
src/
  cli.ts
  index.ts
  serializer.ts
package.json
tsconfig.json
tsup.config.ts
```

# Files

## File: repograph/src/index.ts
```typescript
#!/usr/bin/env bun

import { logger } from './utils/logger.util';
import { RepoGraphError } from './utils/error.util';
// High-Level API for simple use cases
import { generateMap as executeGenerateMap } from './high-level';
import { type RepoGraphOptions as IRepoGraphOptions } from './types';

export { analyzeProject, generateMap } from './high-level';
export { initializeParser } from './tree-sitter/languages';

// Low-Level API for composition and advanced use cases
export { createMapGenerator } from './composer';

// Default pipeline component factories
export { createDefaultDiscoverer } from './pipeline/discover';
export { createTreeSitterAnalyzer } from './pipeline/analyze';
export { createPageRanker, createGitRanker } from './pipeline/rank';
export { createMarkdownRenderer } from './pipeline/render';

// Logger utilities
export { logger } from './utils/logger.util';
export type { LogLevel, Logger } from './utils/logger.util';
export type { ParserInitializationOptions } from './tree-sitter/languages';

// Core types for building custom components
export type {
  Analyzer,
  FileContent,
  CodeNode,
  CodeNodeType,
  CodeNodeVisibility,
  CodeEdge,
  CodeGraph,
  RankedCodeGraph,
  RepoGraphMap,
  RepoGraphOptions,
  CssIntent,
  Ranker,
  Renderer,
  RendererOptions,
  FileDiscoverer,
} from './types';

// This section runs only when the script is executed directly from the CLI
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const isRunningDirectly = () => {
  if (typeof process.argv[1] === 'undefined') return false;
  const runningFile = path.resolve(process.argv[1]);
  const currentFile = fileURLToPath(import.meta.url);
  return runningFile === currentFile;
};

const copyWasmFiles = async (destination: string) => {
  const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  if (isBrowser) {
    logger.error('File system operations are not available in the browser.');
    return;
  }

  try {
    const { promises: fs } = await import('node:fs');
    const path = await import('node:path');

    // Source is relative to the running script (dist/index.js)
    const sourceDir = path.resolve(fileURLToPath(import.meta.url), '..', 'wasm');

    await fs.mkdir(destination, { recursive: true });

    const wasmFiles = (await fs.readdir(sourceDir)).filter(file => file.endsWith('.wasm'));
    for (const file of wasmFiles) {
      const srcPath = path.join(sourceDir, file);
      const destPath = path.join(destination, file);
      await fs.copyFile(srcPath, destPath);
      logger.info(`Copied ${file} to ${path.relative(process.cwd(), destPath)}`);
    }
    logger.info(`\n✅ All ${wasmFiles.length} WASM files copied successfully.`);
  } catch (err) {
    logger.error('Error copying WASM files.', err);
  }
};

if (isRunningDirectly()) {
  (async () => {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
Usage: repograph [root] [options]
       repograph copy-wasm [destination]

Commands:
  [root]                   Analyze a repository at the given root path. This is the default command.
  copy-wasm [destination]  Copy the necessary Tree-sitter WASM files to a specified directory
                           for browser-based usage.
                           (default destination: "./public/wasm")

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
  --max-workers <num>      Set the maximum number of parallel workers for analysis. (default: 1)
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

    if (args[0] === 'copy-wasm') {
      const destDir = args[1] || './public/wasm';
      logger.info(`Copying WASM files to "${path.resolve(destDir)}"...`);
      await copyWasmFiles(destDir);
      process.exit(0);
    }

    if (args.includes('--version') || args.includes('-v')) {
      const { readFileSync } = await import('node:fs');
      const pkgPath = new URL('../package.json', import.meta.url);
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      console.log(pkg.version);
      process.exit(0);
    }

    const options: any = {};
    const includePatterns: string[] = [];
    const ignorePatterns: string[] = [];
    const rendererOptions: any = {};
    const symbolDetailOptions: any = {};

    const argConfig: Record<string, (val?: string) => void> = {
      '--output': val => options.output = val,
      '--include': val => val && includePatterns.push(val),
      '--ignore': val => val && ignorePatterns.push(val),
      '--no-gitignore': () => options.noGitignore = true,
      '--ranking-strategy': val => options.rankingStrategy = val as any,
      '--max-workers': val => options.maxWorkers = parseInt(val!, 10),
      '--log-level': val => options.logLevel = val as any,
      '--no-header': () => rendererOptions.includeHeader = false,
      '--no-overview': () => rendererOptions.includeOverview = false,
      '--no-mermaid': () => rendererOptions.includeMermaidGraph = false,
      '--no-file-list': () => rendererOptions.includeFileList = false,
      '--no-symbol-details': () => rendererOptions.includeSymbolDetails = false,
      '--top-file-count': val => rendererOptions.topFileCount = parseInt(val!, 10),
      '--file-section-separator': val => rendererOptions.fileSectionSeparator = val,
      '--no-symbol-relations': () => symbolDetailOptions.includeRelations = false,
      '--no-symbol-line-numbers': () => symbolDetailOptions.includeLineNumber = false,
      '--no-symbol-snippets': () => symbolDetailOptions.includeCodeSnippet = false,
      '--max-relations-to-show': val => symbolDetailOptions.maxRelationsToShow = parseInt(val!, 10),
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg) continue;

      const handler = argConfig[arg];
      if (handler) {
        // Check if handler takes a value
        if (handler.length === 1) {
          handler(args[++i]);
        } else {
          handler();
        }
      } else if (!arg.startsWith('-')) {
        options.root = arg;
      }
    }

    if (includePatterns.length > 0) {
      options.include = includePatterns;
    }
    
    if (ignorePatterns.length > 0) {
      options.ignore = ignorePatterns;
    }
    
    if (Object.keys(symbolDetailOptions).length > 0) {
      rendererOptions.symbolDetailOptions = symbolDetailOptions;
    }
    
    if (Object.keys(rendererOptions).length > 0) {
      options.rendererOptions = rendererOptions;
    }

    const finalOutput = path.resolve(options.root || process.cwd(), options.output || 'repograph.md');

    logger.info(`Starting RepoGraph analysis for "${path.resolve(options.root || process.cwd())}"...`);

    try {
      // Cast to the correct type for execution
      await executeGenerateMap(options as IRepoGraphOptions);
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
```

## File: repograph/web-demo/src/App.css
```css
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  width: 100%;
}

h1 {
  font-size: 2.2em;
  line-height: 1.1;
  margin-block-start: 0;
  margin-bottom: 1rem;
  text-align: center;
}

.main-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: calc(100vh - 6rem);
}

.config-panel {
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  flex-shrink: 0;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9em;
}

.config-item input[type="number"] {
  width: 60px;
  padding: 0.25rem;
  background-color: #2a2a2a;
  border: 1px solid #555;
  border-radius: 4px;
  color: #d4d4d4;
}

.config-item input[type="checkbox"] {
  accent-color: #646cff;
}

.config-info {
  grid-column: 1 / -1;
  padding: 0.75rem;
  background-color: #2a2a2a;
  border-radius: 4px;
  font-size: 0.9em;
  border-left: 3px solid #646cff;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.primary-button {
  background-color: #646cff;
  color: white;
  border: none;
}

.primary-button:hover:not(:disabled) {
  background-color: #5a5fcf;
}

.secondary-button {
  background-color: #2a2a2a;
  border: 1px solid #555;
}

.secondary-button:hover:not(:disabled) {
  border-color: #777;
}

.current-metrics {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #2a2a2a;
  border-radius: 6px;
}

.current-metrics h4 {
  margin: 0 0 0.5rem 0;
  color: #60a5fa;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  font-size: 0.85em;
  font-family: monospace;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.bottom-panels {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  height: 300px;
  flex-shrink: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

textarea {
  width: 100%;
  height: 100%;
  resize: none;
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  color: #d4d4d4;
  font-family: monospace;
  font-size: 14px;
  padding: 1rem;
  box-sizing: border-box;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.output-panel, .logs-panel {
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  overflow-y: auto;
  background-color: #1e1e1e;
}

.logs-panel {
    height: 100%;
    flex-shrink: 0;
}

.log-entry {
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 2px 4px;
  border-radius: 4px;
  display: flex;
  gap: 0.5rem;
  font-size: 0.8em;
}

.log-timestamp {
  color: #888;
  flex-shrink: 0;
}

.log-level {
  flex-shrink: 0;
  font-weight: bold;
}

.log-message {
  flex: 1;
}

.log-error { color: #f87171; background-color: #450a0a; }
.log-warn { color: #facc15; background-color: #422006; }
.log-info { color: #60a5fa; }
.log-debug { color: #888; }

.metrics-history {
  height: 100%;
  overflow-y: auto;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8em;
  font-family: monospace;
}

.metrics-table th,
.metrics-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #444;
}

.metrics-table th {
  background-color: #2a2a2a;
  font-weight: bold;
  position: sticky;
  top: 0;
}

.metrics-table tr.latest {
  background-color: #2a2a2a;
  font-weight: bold;
}

.metrics-table tr:hover {
  background-color: #333;
}

pre {
    background-color: #2d2d2d !important;
    border-radius: 4px;
    padding: 1em !important;
}
```

## File: repograph/web-demo/src/App.tsx
```typescript
import { useState, useEffect, useCallback, useRef, type FC } from 'react';

// Declare global TreeSitterModule for TypeScript
declare global {
  interface Window {
    TreeSitterModule?: {
      locateFile?: (path: string) => string;
    };
  }
}
import {
  initializeParser,
  analyzeProject,
  createMarkdownRenderer,
  logger,
  type FileContent,
  type LogLevel,
} from 'repograph';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const defaultInput = JSON.stringify(
  [
    {
      path: 'src/components/Button.tsx',
      content: `import React from 'react';\nimport { styled } from '../styles';\nimport { useApi } from '../hooks/useApi';\n\ninterface ButtonProps {\n  onClick?: () => void;\n  children: React.ReactNode;\n  variant?: 'primary' | 'secondary';\n}\n\nexport const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {\n  const { isLoading } = useApi();\n  \n  return (\n    <StyledButton \n      onClick={onClick} \n      disabled={isLoading}\n      className={\`btn btn-\${variant}\`}\n    >\n      {children}\n    </StyledButton>\n  );\n};\n\nconst StyledButton = styled.button\`\n  padding: 0.5rem 1rem;\n  border-radius: 4px;\n  border: none;\n  cursor: pointer;\n  \n  &.btn-primary {\n    background-color: #007bff;\n    color: white;\n  }\n  \n  &.btn-secondary {\n    background-color: #6c757d;\n    color: white;\n  }\n  \n  &:disabled {\n    opacity: 0.6;\n    cursor: not-allowed;\n  }\n\`;`,
    },
    {
      path: 'src/styles.ts',
      content: `import styled from 'styled-components';\n\nexport { styled };\n\nexport const theme = {\n  colors: {\n    primary: '#007bff',\n    secondary: '#6c757d',\n    success: '#28a745',\n    danger: '#dc3545',\n    warning: '#ffc107',\n    info: '#17a2b8',\n  },\n  spacing: {\n    xs: '0.25rem',\n    sm: '0.5rem',\n    md: '1rem',\n    lg: '1.5rem',\n    xl: '2rem',\n  },\n  breakpoints: {\n    sm: '576px',\n    md: '768px',\n    lg: '992px',\n    xl: '1200px',\n  },\n};\n\nexport type Theme = typeof theme;`,
    },
    {
      path: 'src/api/client.ts',
      content: `export interface ApiResponse<T> {\n  data: T;\n  status: number;\n  message?: string;\n}\n\nexport interface User {\n  id: number;\n  name: string;\n  email: string;\n  role: 'admin' | 'user';\n}\n\nexport class ApiClient {\n  private baseUrl: string;\n  private token?: string;\n\n  constructor(baseUrl: string = '/api') {\n    this.baseUrl = baseUrl;\n  }\n\n  setToken(token: string): void {\n    this.token = token;\n  }\n\n  private async request<T>(\n    endpoint: string,\n    options: RequestInit = {}\n  ): Promise<ApiResponse<T>> {\n    const url = \`\${this.baseUrl}\${endpoint}\`;\n    const headers = {\n      'Content-Type': 'application/json',\n      ...(this.token && { Authorization: \`Bearer \${this.token}\` }),\n      ...options.headers,\n    };\n\n    const response = await fetch(url, {\n      ...options,\n      headers,\n    });\n\n    const data = await response.json();\n    \n    return {\n      data,\n      status: response.status,\n      message: data.message,\n    };\n  }\n\n  async getUsers(): Promise<ApiResponse<User[]>> {\n    return this.request<User[]>('/users');\n  }\n\n  async getUser(id: number): Promise<ApiResponse<User>> {\n    return this.request<User>(\`/users/\${id}\`);\n  }\n\n  async createUser(user: Omit<User, 'id'>): Promise<ApiResponse<User>> {\n    return this.request<User>('/users', {\n      method: 'POST',\n      body: JSON.stringify(user),\n    });\n  }\n\n  async updateUser(id: number, user: Partial<User>): Promise<ApiResponse<User>> {\n    return this.request<User>(\`/users/\${id}\`, {\n      method: 'PUT',\n      body: JSON.stringify(user),\n    });\n  }\n\n  async deleteUser(id: number): Promise<ApiResponse<void>> {\n    return this.request<void>(\`/users/\${id}\`, {\n      method: 'DELETE',\n    });\n  }\n}`
    },
    {
      path: 'src/hooks/useApi.ts',
      content: `import { useState, useEffect, useCallback } from 'react';\nimport { ApiClient } from '../api/client';\n\nconst apiClient = new ApiClient();\n\nexport interface UseApiState<T> {\n  data: T | null;\n  isLoading: boolean;\n  error: string | null;\n}\n\nexport function useApi<T>() {\n  const [state, setState] = useState<UseApiState<T>>({\n    data: null,\n    isLoading: false,\n    error: null,\n  });\n\n  const execute = useCallback(async (apiCall: () => Promise<T>) => {\n    setState(prev => ({ ...prev, isLoading: true, error: null }));\n    \n    try {\n      const result = await apiCall();\n      setState({ data: result, isLoading: false, error: null });\n      return result;\n    } catch (error) {\n      const errorMessage = error instanceof Error ? error.message : 'An error occurred';\n      setState({ data: null, isLoading: false, error: errorMessage });\n      throw error;\n    }\n  }, []);\n\n  return {\n    ...state,\n    execute,\n    client: apiClient,\n  };\n}`
    },
    {
      path: 'src/components/UserList.tsx',
      content: `import React, { useEffect } from 'react';\nimport { Button } from './Button';\nimport { useApi } from '../hooks/useApi';\nimport type { User } from '../api/client';\n\ninterface UserListProps {\n  onUserSelect?: (user: User) => void;\n}\n\nexport const UserList: React.FC<UserListProps> = ({ onUserSelect }) => {\n  const { data: users, isLoading, error, execute, client } = useApi<User[]>();\n\n  useEffect(() => {\n    loadUsers();\n  }, []);\n\n  const loadUsers = async () => {\n    try {\n      const response = await execute(() => client.getUsers());\n      return response.data;\n    } catch (error) {\n      console.error('Failed to load users:', error);\n    }\n  };\n\n  const handleDeleteUser = async (userId: number) => {\n    if (!confirm('Are you sure you want to delete this user?')) return;\n    \n    try {\n      await execute(() => client.deleteUser(userId));\n      await loadUsers(); // Refresh the list\n    } catch (error) {\n      console.error('Failed to delete user:', error);\n    }\n  };\n\n  if (isLoading) {\n    return <div className=\"loading\">Loading users...</div>;\n  }\n\n  if (error) {\n    return (\n      <div className=\"error\">\n        <p>Error: {error}</p>\n        <Button onClick={loadUsers}>Retry</Button>\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"user-list\">\n      <div className=\"user-list-header\">\n        <h2>Users</h2>\n        <Button onClick={loadUsers}>Refresh</Button>\n      </div>\n      \n      {users && users.length > 0 ? (\n        <ul className=\"users\">\n          {users.map(user => (\n            <li key={user.id} className=\"user-item\">\n              <div className=\"user-info\">\n                <h3>{user.name}</h3>\n                <p>{user.email}</p>\n                <span className={\`role role-\${user.role}\`}>{user.role}</span>\n              </div>\n              <div className=\"user-actions\">\n                <Button \n                  variant=\"secondary\" \n                  onClick={() => onUserSelect?.(user)}\n                >\n                  Edit\n                </Button>\n                <Button \n                  variant=\"secondary\" \n                  onClick={() => handleDeleteUser(user.id)}\n                >\n                  Delete\n                </Button>\n              </div>\n            </li>\n          ))}\n        </ul>\n      ) : (\n        <p>No users found.</p>\n      )}\n    </div>\n  );\n};`
    },
    {
      path: 'src/App.tsx',
      content: `import React, { useState } from 'react';\nimport { Button } from './components/Button';\nimport { UserList } from './components/UserList';\nimport type { User } from './api/client';\nimport './App.css';\n\nexport const App: React.FC = () => {\n  const [selectedUser, setSelectedUser] = useState<User | null>(null);\n  const [showUserList, setShowUserList] = useState(true);\n\n  const handleUserSelect = (user: User) => {\n    setSelectedUser(user);\n    setShowUserList(false);\n  };\n\n  const handleBackToList = () => {\n    setSelectedUser(null);\n    setShowUserList(true);\n  };\n\n  return (\n    <div className=\"app\">\n      <header className=\"app-header\">\n        <h1>User Management System</h1>\n        <nav>\n          <Button \n            variant={showUserList ? 'primary' : 'secondary'}\n            onClick={() => setShowUserList(true)}\n          >\n            Users\n          </Button>\n          <Button \n            variant={!showUserList ? 'primary' : 'secondary'}\n            onClick={() => setShowUserList(false)}\n          >\n            Settings\n          </Button>\n        </nav>\n      </header>\n\n      <main className=\"app-main\">\n        {showUserList ? (\n          <UserList onUserSelect={handleUserSelect} />\n        ) : (\n          <div className=\"settings\">\n            <h2>Settings</h2>\n            <p>Settings panel coming soon...</p>\n            <Button onClick={handleBackToList}>Back to Users</Button>\n          </div>\n        )}\n      </main>\n\n      <footer className=\"app-footer\">\n        <p>&copy; 2024 User Management System</p>\n      </footer>\n    </div>\n  );\n};`
    }
  ],
  null,
  2
);

type LogEntry = {
  level: LogLevel | 'log';
  args: any[];
  timestamp: number;
}

type PerformanceMetrics = {
  startTime: number;
  endTime: number;
  duration: number;
  filesProcessed: number;
  nodesFound: number;
  edgesFound: number;
  maxWorkers: number;
  workerMode: 'sequential' | 'worker' | 'web-worker';
}

type WorkerConfig = {
  maxWorkers: number;
  stressTestEnabled: boolean;
  stressTestMultiplier: number;
}

const MarkdownRenderer: FC<{ children: string }> = ({ children }) => {
  return (
    <ReactMarkdown
      children={children}
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, '')}
              style={vscDarkPlus as any}
              language={match[1]}
              PreTag="div"
            />
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          );
        },
      }}
    />
  );
};


function App() {
  const [input, setInput] = useState(defaultInput);
  const [output, setOutput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [workerConfig, setWorkerConfig] = useState<WorkerConfig>({
    maxWorkers: 1,
    stressTestEnabled: false,
    stressTestMultiplier: 1,
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    logger.setLevel('debug');

    const originalConsole = { ...console };
    const intercept = (level: LogLevel | 'log', ...args: any[]) => {
      (originalConsole as any)[level](...args);
      setLogs(prev => [...prev, { level, args, timestamp: Date.now() }]);
    };

    console.log = (...args) => intercept('log', ...args);
    console.info = (...args) => intercept('info', ...args);
    console.warn = (...args) => intercept('warn', ...args);
    console.error = (...args) => intercept('error', ...args);
    console.debug = (...args) => intercept('debug', ...args);

    return () => {
      Object.assign(console, originalConsole);
    };
  }, []);

  const handleAnalyze = useCallback(async () => {
    // Cancel any ongoing analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsAnalyzing(true);
    setOutput('');
    setLogs([]);
    
    const startTime = performance.now();
    console.info('Starting analysis...', { workerConfig });

    try {
      let files: FileContent[] = JSON.parse(input);
      if (!Array.isArray(files) || !files.every(f => f.path && typeof f.content === 'string')) {
          throw new Error('Invalid input format. Must be an array of {path: string, content: string}');
      }

      // Apply stress test multiplier if enabled
      if (workerConfig.stressTestEnabled && workerConfig.stressTestMultiplier > 1) {
        const originalFiles = [...files];
        files = [];
        for (let i = 0; i < workerConfig.stressTestMultiplier; i++) {
          const multipliedFiles = originalFiles.map(f => ({
            ...f,
            path: `stress-${i}/${f.path}`,
          }));
          files.push(...multipliedFiles);
        }
        console.info(`Stress test enabled: multiplied ${originalFiles.length} files by ${workerConfig.stressTestMultiplier} = ${files.length} total files`);
      }
      
      if (signal.aborted) throw new Error('Analysis cancelled');
      
      console.info('Initializing parser...');
      await initializeParser({ wasmBaseUrl: '/wasm/' });
      console.info('Parser initialized.');

      if (signal.aborted) throw new Error('Analysis cancelled');

      const maxWorkers = workerConfig.maxWorkers;
      const workerMode = maxWorkers > 1 ? 'worker' : 'sequential';

      console.info(`Analyzing ${files.length} files with ${maxWorkers} workers (mode: ${workerMode})...`);
      
      const analysisStartTime = performance.now();
      const rankedGraph = await analyzeProject({
        files,
        rankingStrategy: 'pagerank',
        maxWorkers,
      });
      const analysisEndTime = performance.now();
      
      if (signal.aborted) throw new Error('Analysis cancelled');
      
      console.info(`Analysis complete. Found ${rankedGraph.nodes.size} nodes, ${rankedGraph.edges.length} edges.`);

      console.info('Rendering output...');
      const renderer = createMarkdownRenderer();
      const markdown = renderer(rankedGraph, {
        includeMermaidGraph: true,
      });
      setOutput(markdown);
      console.info('Render complete.');

      const endTime = performance.now();
      const metrics: PerformanceMetrics = {
        startTime,
        endTime,
        duration: endTime - startTime,
        filesProcessed: files.length,
        nodesFound: rankedGraph.nodes.size,
        edgesFound: rankedGraph.edges.length,
        maxWorkers,
        workerMode,
      };
      
      setCurrentMetrics(metrics);
      setPerformanceMetrics(prev => [...prev, metrics]);
      
      console.info('Performance metrics:', {
        totalDuration: `${metrics.duration.toFixed(2)}ms`,
        analysisDuration: `${(analysisEndTime - analysisStartTime).toFixed(2)}ms`,
        filesPerSecond: (files.length / (metrics.duration / 1000)).toFixed(2),
        nodesPerSecond: (rankedGraph.nodes.size / (metrics.duration / 1000)).toFixed(2),
      });

    } catch (e: any) {
      if (e.message === 'Analysis cancelled') {
        console.warn('Analysis was cancelled');
        setOutput(`# Analysis Cancelled\n\nThe analysis was cancelled by the user.`);
      } else {
        console.error('Analysis failed:', e.message, e);
        setOutput(`# Analysis Failed\n\n**Error:**\n\`\`\`\n${e.stack || e.message}\n\`\`\``);
      }
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  }, [input, workerConfig]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const handleClearMetrics = useCallback(() => {
    setPerformanceMetrics([]);
    setCurrentMetrics(null);
  }, []);

  const handleRunBenchmark = useCallback(async () => {
    const workerCounts = [1, 2, 4, 8];
    const originalConfig = { ...workerConfig };

    for (const maxWorkers of workerCounts) {
      if (abortControllerRef.current?.signal.aborted) break;
      
      setWorkerConfig(prev => ({ ...prev, maxWorkers }));
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      await handleAnalyze();
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause between runs
    }
    
    // Restore original config
    setWorkerConfig(originalConfig);
  }, [workerConfig, handleAnalyze]);

  return (
    <>
      <h1>RepoGraph Web Demo - Worker Battle Test</h1>
      <div className="main-container">
        <div className="config-panel">
          <h3>RepoGraph Worker Battle Test Configuration</h3>
          <div className="config-grid">
            <label className="config-item">
              Max Workers:
              <input
                type="number"
                min="1"
                max="8"
                value={workerConfig.maxWorkers}
                onChange={e => setWorkerConfig(prev => ({ ...prev, maxWorkers: parseInt(e.target.value) || 1 }))}
                title="Number of worker threads for parallel analysis (1 = sequential)"
              />
            </label>
            
            <label className="config-item">
              <input
                type="checkbox"
                checked={workerConfig.stressTestEnabled}
                onChange={e => setWorkerConfig(prev => ({ ...prev, stressTestEnabled: e.target.checked }))}
              />
              Stress Test Mode
            </label>
            
            <label className="config-item">
              File Multiplier:
              <input
                type="number"
                min="1"
                max="20"
                value={workerConfig.stressTestMultiplier}
                onChange={e => setWorkerConfig(prev => ({ ...prev, stressTestMultiplier: parseInt(e.target.value) || 1 }))}
                disabled={!workerConfig.stressTestEnabled}
                title="Multiply input files by this factor for stress testing"
              />
            </label>
            
            <div className="config-info">
              <strong>Current Mode:</strong> {workerConfig.maxWorkers > 1 ? `Parallel (${workerConfig.maxWorkers} workers)` : 'Sequential'}
              {workerConfig.stressTestEnabled && (
                <span> | Stress Test: {workerConfig.stressTestMultiplier}x files</span>
              )}
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="primary-button">
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            <button onClick={handleCancel} disabled={!isAnalyzing} className="secondary-button">
              Cancel
            </button>
            <button onClick={handleRunBenchmark} disabled={isAnalyzing} className="secondary-button">
              Run Worker Benchmark (1,2,4,8 workers)
            </button>
            <button onClick={handleClearMetrics} className="secondary-button">
              Clear Metrics
            </button>
          </div>
          
          {currentMetrics && (
            <div className="current-metrics">
              <h4>Last Run Metrics</h4>
              <div className="metrics-grid">
                <span>Duration: {currentMetrics.duration.toFixed(2)}ms</span>
                <span>Files: {currentMetrics.filesProcessed}</span>
                <span>Nodes: {currentMetrics.nodesFound}</span>
                <span>Edges: {currentMetrics.edgesFound}</span>
                <span>Workers: {currentMetrics.maxWorkers}</span>
                <span>Mode: {currentMetrics.workerMode}</span>
                <span>Files/sec: {(currentMetrics.filesProcessed / (currentMetrics.duration / 1000)).toFixed(2)}</span>
                <span>Nodes/sec: {(currentMetrics.nodesFound / (currentMetrics.duration / 1000)).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="container">
          <div className="panel">
              <h3>Input Files (JSON format)</h3>
              <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter FileContent[] as JSON string..."
                  spellCheck="false"
              />
          </div>
          <div className="panel">
              <h3>Output Markdown</h3>
              <div className="output-panel">
                  <MarkdownRenderer>{output}</MarkdownRenderer>
              </div>
          </div>
        </div>
        
        <div className="bottom-panels">
          <div className="panel">
            <h3>Performance History</h3>
            <div className="metrics-history">
              {performanceMetrics.length === 0 ? (
                <p>No metrics yet. Run an analysis to see performance data.</p>
              ) : (
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Mode</th>
                      <th>Workers</th>
                      <th>Files</th>
                      <th>Duration (ms)</th>
                      <th>Nodes</th>
                      <th>Files/sec</th>
                      <th>Nodes/sec</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetrics.map((metric, i) => (
                      <tr key={i} className={i === performanceMetrics.length - 1 ? 'latest' : ''}>
                        <td>{i + 1}</td>
                        <td>{metric.workerMode}</td>
                        <td>{metric.maxWorkers}</td>
                        <td>{metric.filesProcessed}</td>
                        <td>{metric.duration.toFixed(2)}</td>
                        <td>{metric.nodesFound}</td>
                        <td>{(metric.filesProcessed / (metric.duration / 1000)).toFixed(2)}</td>
                        <td>{(metric.nodesFound / (metric.duration / 1000)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="panel">
              <h3>Logs</h3>
              <div className="logs-panel">
                  {logs.map((log, i) => (
                      <div key={i} className={`log-entry log-${log.level}`}>
                          <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="log-level">[{log.level.toUpperCase()}]</span>
                          <span className="log-message">{log.args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}</span>
                      </div>
                  ))}
              </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
```

## File: repograph/web-demo/src/main.tsx
```typescript
// Configure web-tree-sitter before any other imports
(window as any).TreeSitterModule = {
  locateFile: (path: string) => {
    console.log(`[DEBUG] Global locateFile called with: ${path}`);
    if (path === 'tree-sitter.wasm') {
      return '/tree-sitter.wasm';
    }
    return path;
  }
};

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## File: repograph/web-demo/index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RepoGraph Web Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## File: repograph/web-demo/package.json
```json
{
  "name": "repograph-web-demo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "get-wasm": "repograph copy-wasm ./public/wasm"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0",
    "remark-gfm": "^4.0.0",
    "repograph": "file:.."
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@types/react-syntax-highlighter": "^15.5.13",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
```

## File: repograph/web-demo/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    // Path mapping for local development
    "baseUrl": ".",
    "paths": {
      "repograph": ["../src/index.ts"]
    },

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## File: repograph/web-demo/tsconfig.node.json
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

## File: repograph/web-demo/vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// import wasm from 'vite-plugin-wasm'
// import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // wasm(),
    // topLevelAwait()
  ],
  optimizeDeps: {
    exclude: ['repograph', 'web-tree-sitter']
  },
  resolve: {
    alias: {
      'repograph': path.resolve(__dirname, '../dist/browser.js')
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '"v18.0.0"'
  },
  server: {
    fs: {
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  worker: {
    plugins: () => [
      // wasm(),
      // topLevelAwait()
    ]
  },
  assetsInclude: ['**/*.wasm'],
  publicDir: 'public'
})
```

## File: repograph/package.json
```json
{
  "name": "repograph",
  "version": "0.1.19",
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
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "npm run build",
    "dev": "tsup --watch",
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
    "tinypool": "^0.8.2",
    "@types/js-yaml": "^4.0.9",
    "globby": "^14.1.0",
    "graphology": "^0.26.0",
    "graphology-pagerank": "^1.1.0",
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
    "tsup": "^8.0.2",
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
```

## File: repograph/tsconfig.json
```json
{
  "compilerOptions": {
    // Environment setup & latest features
    "lib": ["ESNext", "DOM"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "allowJs": true,

    // Bundler mode
    "moduleResolution": "bundler",
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

    // Include bun types
    "types": ["bun-types"]
  },
  "include": [
    "src/**/*",
    "test/**/*",
    "web-demo/src/**/*",
    "bun.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "docs",
    ".relay",
    ".relaycode"
  ]
}
```

## File: repograph/tsup.config.ts
```typescript
import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/index.ts', 'src/browser.ts', 'src/pipeline/analyzer.worker.ts'],
  format: ['esm', 'cjs'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false, // Disable splitting for CJS compatibility
  treeshake: true,
  minify: false,
  outDir: 'dist',
  onSuccess: async () => {
    // Copy WASM files to dist folder
    const wasmDir = join('dist', 'wasm');
    if (!existsSync(wasmDir)) {
      mkdirSync(wasmDir, { recursive: true });
    }

    const wasmFiles = [
      'tree-sitter-typescript/tree-sitter-typescript.wasm',
      'tree-sitter-typescript/tree-sitter-tsx.wasm',
      'tree-sitter-javascript/tree-sitter-javascript.wasm',
      'tree-sitter-python/tree-sitter-python.wasm',
      'tree-sitter-java/tree-sitter-java.wasm',
      'tree-sitter-c/tree-sitter-c.wasm',
      'tree-sitter-cpp/tree-sitter-cpp.wasm',
      'tree-sitter-c-sharp/tree-sitter-c_sharp.wasm',
      'tree-sitter-css/tree-sitter-css.wasm',
      'tree-sitter-go/tree-sitter-go.wasm',
      'tree-sitter-php/tree-sitter-php.wasm',
      'tree-sitter-ruby/tree-sitter-ruby.wasm',
      'tree-sitter-rust/tree-sitter-rust.wasm',
      'tree-sitter-solidity/tree-sitter-solidity.wasm',
      'tree-sitter-swift/tree-sitter-swift.wasm',
      'tree-sitter-vue/tree-sitter-vue.wasm',
    ];

    for (const wasmFile of wasmFiles) {
      const srcPath = join('node_modules', wasmFile);
      const wasmFileName = wasmFile.split('/')[1];
      if (!wasmFileName) {
        console.warn(`Skipping invalid wasmFile path: ${wasmFile}`);
        continue;
      }
      const destPath = join('dist', 'wasm', wasmFileName);
      
      if (existsSync(srcPath)) {
        copyFileSync(srcPath, destPath);
        console.log(`Copied ${wasmFileName} to dist/wasm/`);
      }
    }
  },
});
```

## File: src/cli.ts
```typescript
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
```

## File: src/index.ts
```typescript
import { analyzeProject } from 'repograph';
import type { RankedCodeGraph, RepoGraphOptions } from 'repograph';
import { serializeGraph } from './serializer';

export interface ScnTsConfig {
  /**
   * The root directory of the project to analyze. Defaults to the current working directory.
   * Not used if `files` is provided.
   */
  root?: string;
  /**
   * Glob patterns for files to include. Required if `files` is not provided.
   */
  include?: string[];
  /** Glob patterns for files to exclude. */
  exclude?: string[];
  /**
   * For browser or in-memory usage, provide file contents directly. This will
   * bypass all file-system operations (`root`, `include`, `exclude`).
   */
  files?: readonly { path: string; content: string }[];
  /** Path to the project's tsconfig.json. (Not currently used by repograph) */
  project?: string;
  /**
   * The maximum number of parallel workers to use for analysis.
   * When set to 1, analysis runs in the main thread without workers.
   * For faster test execution, use higher values (e.g., 4-8).
   * @default 1
   */
  maxWorkers?: number;
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
    maxWorkers: config.maxWorkers,
    files: config.files,
    // We can set other repograph options here if needed, e.g. rankingStrategy
  };
  const graph: RankedCodeGraph = await analyzeProject(repoGraphOptions);

  // 2. scn-ts serializes that graph into the SCN text format.
  const scnOutput = serializeGraph(graph, config.root);
  return scnOutput;
};

// Low-level API for composition
export { serializeGraph };

// Re-export from repograph for advanced users
export {
  // High-Level API
  analyzeProject,
  generateMap,
  // Low-Level API
  createMapGenerator,
  // Pipeline component factories
  createDefaultDiscoverer,
  createTreeSitterAnalyzer,
  createPageRanker,
  createGitRanker,
  createMarkdownRenderer,
  // Logger utilities
  logger,
  initializeParser,
} from 'repograph';

// Re-export types from repograph
export type {
  // Core types
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
  // Logger types
  Logger,
  LogLevel,
  // Parser types
  ParserInitializationOptions,
} from 'repograph';
```

## File: src/serializer.ts
```typescript
import type {
  RankedCodeGraph,
  CodeNode,
  CodeEdge as RepographEdge,
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

const getVisibilitySymbol = (node: CodeNode, rootDir?: string): '+' | '-' | undefined => {
  if (node.visibility === 'public') return '+';
  if (node.visibility === 'private' || node.visibility === 'protected') return '-';
  if (node.type === 'file') return undefined;

  // Fallback to source-based inference if repograph doesn't provide visibility.
  const source = getSourceContent(node.filePath, rootDir);
  if (!source) return undefined;
  
  const line = (source.split('\n')[node.startLine - 1] || '').trim();

  // For class members, default is public unless explicitly private/protected.
  if (['method', 'property', 'field'].includes(node.type)) {
    return (line.startsWith('private') || line.startsWith('protected')) ? '-' : '+';
  }

  // For other top-level entities, check for an `export` keyword in the source.
  const name = node.name.split('.').pop() || node.name;
  const isExported = [
    // `export const MyVar`, `export class MyClass`, `export default function ...`
    `export\\s+(default\\s+)?(async\\s+)?(class|function|interface|enum|type|const|let|var|namespace)\\s+${name}\\b`,
    // `export { MyVar }`
    `export\\s*\\{[^}]*\\b${name}\\b`,
    // `export default` for anonymous functions/arrow functions
    name === 'default' ? `export\\s+default\\s+` : null,
  ].filter(Boolean).some(p => new RegExp(p!).test(source));

  if (isExported) {
    return '+';
  }

  return undefined;
};

const isComponentNode = (node: CodeNode): boolean =>
  (node.type === 'function' || node.type === 'arrow_function') && /^[A-Z]/.test(node.name);

const getNodeSymbol = (node: CodeNode): ScnSymbol => {
  // Heuristic: Treat PascalCase functions as components (e.g., React)
  if (isComponentNode(node)) {
    return '◇';
  }
  // Heuristic: Treat uppercase constants/variables as containers (module pattern)
  if ((node.type === 'variable' || node.type === 'constant') && /^[A-Z]/.test(node.name)) {
    return '◇';
  }
  return ENTITY_TYPE_TO_SYMBOL[node.type] ?? '?';
};

const getQualifiers = (node: CodeNode, rootDir?: string): { access?: '+' | '-'; others: QualifierSymbol[] } => {
  const access = getVisibilitySymbol(node, rootDir);
  
  const others: QualifierSymbol[] = [];
  
  // Check for async
  const isAsync = node.isAsync || (node.codeSnippet && /\basync\s+/.test(node.codeSnippet));
  if (isAsync) others.push('...');
  
  // Check for throw
  const canThrow = node.canThrow || (node.codeSnippet && /\bthrow\b/.test(node.codeSnippet));
  if (canThrow) others.push('!');
  
  // Check for pure function heuristic
  const isPure = node.isPure || isPureFunction(node, rootDir);
  if (isPure) others.push('o');
  
  return { access, others };
};

const isPureFunction = (node: CodeNode, rootDir?: string): boolean => {
  if (!['function', 'method', 'arrow_function'].includes(node.type)) return false;
  if (!node.codeSnippet) return false;
  
  // Get the full source to analyze the function body
  const source = getSourceContent(node.filePath, rootDir);
  if (!source) return false;
  
  const lines = source.split('\n');
  const startLine = node.startLine - 1;
  const endLine = node.endLine - 1;
  
  if (startLine < 0 || endLine >= lines.length) return false;
  
  const functionBody = lines.slice(startLine, endLine + 1).join('\n');
  
  // Simple heuristics for pure functions
  const impurePatterns = [
    /console\./,
    /document\./,
    /window\./,
    /localStorage/,
    /sessionStorage/,
    /fetch\(/,
    /XMLHttpRequest/,
    /setTimeout/,
    /setInterval/,
    /Math\.random/,
    /Date\(/,
    /new Date/,
    /\.push\(/,
    /\.pop\(/,
    /\.shift\(/,
    /\.unshift\(/,
    /\.splice\(/,
    /\.sort\(/,
    /\.reverse\(/,
    /\+\+/,
    /--/,
    /\w+\s*=\s*(?!.*return)/,
  ];
  
  // If it contains any impure patterns, it's not pure
  if (impurePatterns.some(pattern => pattern.test(functionBody))) {
    return false;
  }
  
  // If it only contains return statements and basic operations, likely pure
  const hasOnlyReturn = /^\s*export\s+(?:async\s+)?function\s+\w+\([^)]*\)(?:\s*:\s*[^{]+)?\s*{\s*return\s+[^;]+;\s*}\s*$/.test(functionBody.replace(/\n/g, ' '));
  
  return hasOnlyReturn;
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
    
    return attrs.length > 0 ? `[ ${attrs.join(' ')} ]` : '';
}

const formatSignature = (node: CodeNode, rootDir?: string): string => {
  if (isComponentNode(node)) {
    // For components, we need to extract props from the full function signature
    // Get the source content to find the complete function definition
    const source = getSourceContent(node.filePath, rootDir);
    if (source) {
      const lines = source.split('\n');
      const startLine = node.startLine - 1;
      const endLine = Math.min(startLine + 10, lines.length); // Look at more lines to get the full signature
      
      // Look for the complete function signature in the source
      const functionText = lines.slice(startLine, endLine).join('\n');
      
      // Try multiple patterns to match React component props
      const patterns = [
        /function\s+\w+\s*\(\s*\{\s*([^}]+)\s*\}\s*:\s*\{[^}]*\}/,  // function Name({ prop1, prop2 }: { ... })
        /\(\s*\{\s*([^}]+)\s*\}\s*:\s*\{[^}]*\}/,                   // ({ prop1, prop2 }: { ... })
        /\(\s*\{\s*([^}]+)\s*\}[^)]*\)/,                            // ({ prop1, prop2 })
      ];
      
      for (const pattern of patterns) {
        const propMatch = functionText.match(pattern);
        if (propMatch?.[1]) {
          const props = propMatch[1].split(',').map(p => p.trim().split(/[:=]/)[0]?.trim()).filter(Boolean);
          const propsString = props.map(p => `${p}:#`).join(', ');
          return `{ props: { ${propsString} } }`;
        }
      }
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
  
  // For container types like class/interface/namespace, we don't show a signature.
  // Their contents are represented by nested symbols.
  if (node.type === 'class' || node.type === 'interface' || node.type === 'namespace') {
    return '';
  }
  
  return '';
};

const formatNode = (node: CodeNode, graph: RankedCodeGraph, idManager: ScnIdManager, rootDir?: string, level = 0): string => {
  const symbol = getNodeSymbol(node);
  const { access, others } = getQualifiers(node, rootDir);
  const signature = formatSignature(node, rootDir);
  const scnId = idManager.getScnId(node.id);
  const id = scnId ? `(${scnId})` : '';
  const indent = '  '.repeat(level + 1);

  // Build the main line: qualifiers symbol id name signature
  const parts = [];
  if (access) parts.push(access);
  parts.push(symbol);
  if (id) parts.push(id);

  // For functions, combine name and signature without space, unless it's a component
  if (['function', 'method', 'constructor', 'arrow_function'].includes(node.type) && !isComponentNode(node)) {
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
    // Sort qualifiers in specific order: ... ! o
    const sortedOthers = others.sort((a, b) => {
      const order = ['...', '!', 'o'];
      return order.indexOf(a) - order.indexOf(b);
    });
    mainLine += ` ${sortedOthers.join(' ')}`;
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
  const callerEdges = (graph.edges as CodeEdge[]).filter(edge => {
    if (edge.toId !== node.id || edge.type === 'contains') return false;
    
    // For entity nodes, exclude file-level imports entirely
    if (node.type !== 'file' && edge.type === 'imports') return false;
    
    // For entity nodes, also exclude edges from file nodes (file-level dependencies)
    if (node.type !== 'file') {
      const sourceNode = graph.nodes.get(edge.fromId);
      if (sourceNode?.type === 'file') return false;
    }
    
    return edge.type !== 'imports';
  });

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
      const targetNode = graph.nodes.get(targetId);
      
      // If the target is an entity (not a file), we need to get its file's ID
      let fileId: string;
      if (targetNode?.type === 'file') {
        fileId = targetId;
      } else {
        // Find the file that contains this entity
        const entityFilePath = targetNode?.filePath;
        const fileNode = Array.from(graph.nodes.values()).find(n => n.type === 'file' && n.filePath === entityFilePath);
        fileId = fileNode?.id || targetId;
      }
      
      const targetScnId = idManager.getScnId(fileId);
      return `(${targetScnId}.0)`;
    }).filter(Boolean);
    
    // Remove duplicates and sort
    const uniqueLinks = [...new Set(links)].sort().join(', ');
    if (!uniqueLinks) return '';
    return `\n  ${prefix} ${uniqueLinks}`;
  };

  // File-level dependencies: imports or calls from this file to other files
  const fileDependencies = graph.edges.filter(e => 
    e.fromId === fileNode.id && 
    (e.type === 'imports' || (e.type === 'calls' && graph.nodes.get(e.toId)?.type !== 'file'))
  );
  
  // File-level callers: imports or calls to entities in this file from other files  
  const fileCallers = graph.edges.filter(e => {
    const toNode = graph.nodes.get(e.toId);
    const fromNode = graph.nodes.get(e.fromId);
    
    // If the target is an entity in this file and the source is from a different file
    return toNode?.filePath === fileNode.filePath && 
           fromNode?.filePath !== fileNode.filePath &&
           (e.type === 'imports' || e.type === 'calls');
  });

  const formattedPath = fileNode.filePath.includes(' ') ? `"${fileNode.filePath}"` : fileNode.filePath;
  let header = `§ (${scnId}) ${formattedPath}`;
  const fileDepLine = formatFileLinks('->', fileDependencies);
  if (fileDepLine) header += fileDepLine;
  const fileCallerLine = formatFileLinks('<-', fileCallers);
  if (fileCallerLine) header += fileCallerLine;

  // Hierarchical rendering
  const nodeWrappers = symbols.map(s => ({ node: s, children: [] as {node: CodeNode, children: any[]}[] })).sort((a,b) => a.node.startLine - b.node.startLine);
  const topLevelSymbols: typeof nodeWrappers = [];

  for (let i = 0; i < nodeWrappers.length; i++) {
    const currentWrapper = nodeWrappers[i];
    if (!currentWrapper) continue;
    let parentWrapper = null;
    
    // Find the tightest parent by looking backwards through the sorted list
    for (let j = i - 1; j >= 0; j--) {
        const potentialParentWrapper = nodeWrappers[j];
        if (!potentialParentWrapper) continue;
        // Check if current node is contained within the potential parent
        // For JSX elements, use a more flexible containment check
        const isContained = currentWrapper.node.startLine > potentialParentWrapper.node.startLine && 
                           currentWrapper.node.startLine < potentialParentWrapper.node.endLine;
        
        // Additional check for JSX elements - if they're on consecutive lines and the parent is a container element
        const isJsxNesting = currentWrapper.node.type === 'html_element' && 
                            potentialParentWrapper.node.type === 'html_element' &&
                            currentWrapper.node.startLine === potentialParentWrapper.node.startLine + 1;
        
        if (isContained || isJsxNesting) {
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
```

## File: package.json
```json
{
  "name": "scn-ts",
  "version": "1.0.4",
  "description": "Generate Symbolic Context Notation (SCN) maps from your TypeScript/JavaScript codebase.",
  "author": "anton",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/scn-ts.git"
  },
  "keywords": [
    "scn",
    "typescript",
    "code-analysis",
    "context-map",
    "repograph",
    "cli"
  ],
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "scn-ts": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "repograph": "^0.1.19"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/node": "^20.11.24",
    "tsup": "^8.0.2",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

## File: tsconfig.json
```json
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
    "resolveJsonModule": true,
    "esModuleInterop": true,

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
    "noPropertyAccessFromIndexSignature": false
  },
  "include": ["src", "test"],
  "exclude": ["node_modules", "dist"]
}
```

## File: tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true, // Cleans the dist folder once before building.
    splitting: false,
    shims: true,
    external: ['repograph'],
  },
  {
    entry: ['src/cli.ts'],
    format: ['cjs', 'esm'],
    sourcemap: true,
    splitting: false,
    shims: true,
    external: ['repograph'],
    banner: {
      js: '#!/usr/bin/env node',
    },
    // No .d.ts files for the CLI entry point.
  },
]);
```
