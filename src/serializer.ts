import type {
  RankedCodeGraph,
  CodeNode,
  CodeEdge,
  CodeNodeVisibility as Visibility,
  CssIntent,
  CodeNodeType,
} from 'repograph';

type ScnSymbol = '◇' | '~' | '@' | '{}' | '☰' | '=:' | '⛶' | '¶' | '?';
type QualifierSymbol = '+' | '-' | '...' | '!' | 'o';
type CssIntentSymbol = '📐' | '✍' | '💧';

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

const getVisibilitySymbol = (visibility?: Visibility): '+' | '-' | undefined => {
  if (visibility === 'public') return '+';
  if (visibility === 'private') return '-';
  return undefined;
};

const getNodeSymbol = (node: CodeNode): ScnSymbol => {
  return ENTITY_TYPE_TO_SYMBOL[node.type] ?? '?';
};

const getQualifiers = (node: CodeNode): QualifierSymbol[] => {
  const qualifiers: QualifierSymbol[] = [];
  const visibilitySymbol = getVisibilitySymbol(node.visibility);
  if (visibilitySymbol) {
    qualifiers.push(visibilitySymbol);
  }
  if (node.isAsync) {
    qualifiers.push('...');
  }
  if (node.canThrow) {
    qualifiers.push('!');
  }
  if (node.isPure) {
    qualifiers.push('o');
  }
  return qualifiers;
};

const formatCssIntents = (intents: readonly CssIntent[] = []): string => {
  if (intents.length === 0) return '';
  const symbols = intents.map(intent => CSS_INTENT_TO_SYMBOL[intent] ?? '');
  return `{ ${symbols.join(' ')} }`;
};

const formatNodeId = (node: CodeNode): string => `(${node.id})`;

const formatSignature = (node: CodeNode): string => {
  if (node.codeSnippet) {
    return node.codeSnippet;
  }
  return node.type === 'css_rule' && node.cssIntents
    ? formatCssIntents(node.cssIntents)
    : '';
};

const formatNode = (node: CodeNode, allEdges: readonly CodeEdge[]): string[] => {
  const symbol = getNodeSymbol(node);
  const qualifiers = getQualifiers(node);
  const name = node.name;
  const signature = formatSignature(node);
  const id = formatNodeId(node);

  const mainLine = [
    '  ', // Indentation
    ...qualifiers,
    symbol,
    id,
    name,
    signature,
  ].filter(p => p).join(' ');
  
  const dependencyLines = allEdges
    .filter(edge => edge.fromId === node.id)
    .map(edge => `    -> (${edge.toId})`);

  const callerLines = allEdges
    .filter(edge => edge.toId === node.id)
    .map(edge => `    <- (${edge.fromId})`);

  return [mainLine, ...dependencyLines, ...callerLines];
};

const getFileDependencies = (fileNode: CodeNode, allEdges: readonly CodeEdge[]): string[] => {
  return allEdges
    .filter(edge => edge.type === 'imports' && edge.fromId === fileNode.id)
    .map(edge => `  -> (${edge.toId})`);
};

const getFileCallers = (fileNode: CodeNode, allEdges: readonly CodeEdge[]): string[] => {
  return allEdges
    .filter(edge => edge.type === 'imports' && edge.toId === fileNode.id)
    .map(edge => `  <- (${edge.fromId})`);
};

const serializeFile = (
  fileNode: CodeNode,
  symbols: readonly CodeNode[],
  allEdges: readonly CodeEdge[]
): string => {
  const header = `§ (${fileNode.id}) ${fileNode.filePath}`;
  
  const fileDependencies = getFileDependencies(fileNode, allEdges);
  const fileCallers = getFileCallers(fileNode, allEdges);

  const nodeLines = symbols.flatMap(node => formatNode(node, allEdges));

  return [header, ...fileDependencies, ...fileCallers, ...nodeLines].join('\n');
};

/**
 * Serializes a RankedCodeGraph into the SCN text format.
 * This function is the core rendering layer of `scn-ts`.
 *
 * @param graph The `RankedCodeGraph` produced by `repograph`.
 * @returns A string containing the full SCN map.
 */
export const serializeGraph = (graph: RankedCodeGraph): string => {
  const nodesByFile = new Map<string, CodeNode[]>();
  const fileNodes: CodeNode[] = [];

  for (const node of graph.nodes.values()) {
    if (node.type === 'file') {
      fileNodes.push(node);
    } else {
      if (!nodesByFile.has(node.filePath)) {
        nodesByFile.set(node.filePath, []);
      }
      nodesByFile.get(node.filePath)!.push(node);
    }
  }

  // SCN spec prefers sorting by a numeric ID, but repograph uses string IDs (paths).
  // We'll sort by path for consistent output.
  const sortedFileNodes = fileNodes.sort((a, b) => a.id.localeCompare(b.id));
  
  const scnParts = sortedFileNodes.map(fileNode => {
    const symbols = nodesByFile.get(fileNode.filePath) || [];
    symbols.sort((a,b) => a.startLine - b.startLine);
    return serializeFile(fileNode, symbols, graph.edges);
  });

  return scnParts.join('\n\n');
};