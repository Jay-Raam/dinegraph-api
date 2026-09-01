import {
  ASTNode,
  FragmentDefinitionNode,
  GraphQLError,
  OperationDefinitionNode,
  SelectionSetNode,
  ValidationContext,
  ValidationRule,
} from 'graphql';

const MAX_DEPTH = 8;
const MAX_FIELDS = 100;

type FragmentMap = Map<string, FragmentDefinitionNode>;

function measureSelectionSet(
  selectionSet: SelectionSetNode,
  fragments: FragmentMap,
  fragmentStack: Set<string>,
  depth: number
): { depth: number; fields: number } {
  let maxDepth = depth;
  let fields = 0;

  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      fields += 1;
      maxDepth = Math.max(maxDepth, depth);
      if (selection.selectionSet) {
        const nested = measureSelectionSet(selection.selectionSet, fragments, fragmentStack, depth + 1);
        maxDepth = Math.max(maxDepth, nested.depth);
        fields += nested.fields;
      }
    } else if (selection.kind === 'InlineFragment') {
      const nested = measureSelectionSet(selection.selectionSet, fragments, fragmentStack, depth);
      maxDepth = Math.max(maxDepth, nested.depth);
      fields += nested.fields;
    } else if (!fragmentStack.has(selection.name.value)) {
      const fragment = fragments.get(selection.name.value);
      if (fragment) {
        const nextStack = new Set(fragmentStack);
        nextStack.add(selection.name.value);
        const nested = measureSelectionSet(fragment.selectionSet, fragments, nextStack, depth);
        maxDepth = Math.max(maxDepth, nested.depth);
        fields += nested.fields;
      }
    }
  }

  return { depth: maxDepth, fields };
}

export const queryLimitsRule: ValidationRule = (context: ValidationContext) => {
  const fragments: FragmentMap = new Map();

  return {
    Document(node) {
      for (const definition of node.definitions) {
        if (definition.kind === 'FragmentDefinition') {
          fragments.set(definition.name.value, definition);
        }
      }
    },
    OperationDefinition(node: OperationDefinitionNode) {
      const measured = measureSelectionSet(node.selectionSet, fragments, new Set(), 1);
      if (measured.depth > MAX_DEPTH) {
        context.reportError(
          new GraphQLError(`Query depth exceeds the maximum of ${MAX_DEPTH}`, {
            nodes: [node as ASTNode],
            extensions: { code: 'QUERY_TOO_COMPLEX' },
          })
        );
      }
      if (measured.fields > MAX_FIELDS) {
        context.reportError(
          new GraphQLError(`Query selects more than the maximum of ${MAX_FIELDS} fields`, {
            nodes: [node as ASTNode],
            extensions: { code: 'QUERY_TOO_COMPLEX' },
          })
        );
      }
    },
  };
};

