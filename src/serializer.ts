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
    return node.codeSnippet;
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
    if (match) {
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