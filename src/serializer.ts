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