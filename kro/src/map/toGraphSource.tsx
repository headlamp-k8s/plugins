// Adapter from the plugin's pure EmbeddedGraph shape to the GraphSource
// contract of Headlamp's native GraphView.
import { Icon } from '@iconify/react';
import type {
  GraphEdge,
  GraphNode,
  GraphSource,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { EmbeddedGraph } from './graphData';

/**
 * Map an EmbeddedGraph to native nodes and edges. Nodes backed by a
 * live object are emitted as kubeObject nodes so the native view
 * renders its own KubeIcon, label, and details panel; synthetic nodes
 * (e.g. the template root and template resources) keep the plugin's
 * label/subtitle/icon. Pure apart from creating icon elements.
 */
export function toGraphElements(graph: EmbeddedGraph): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = graph.nodes.map(node =>
    node.kubeObject
      ? {
          id: node.id,
          kubeObject: node.kubeObject as GraphNode['kubeObject'],
          status: node.status,
        }
      : {
          id: node.id,
          label: node.label,
          subtitle: node.subtitle,
          status: node.status,
          icon: <Icon icon={node.icon} width="100%" height="100%" />,
        }
  );
  const edges: GraphEdge[] = graph.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
  }));
  return { nodes, edges };
}

/**
 * Wrap already-built elements as a native GraphSource. The elements
 * are captured by reference: the host stores useData's return value in
 * state and re-renders on identity changes, so callers must pass a
 * memoized object and mint a new source only when the graph changes.
 */
export function makeGraphSource(
  id: string,
  label: string,
  elements: { nodes: GraphNode[]; edges: GraphEdge[] }
): GraphSource {
  return {
    id,
    label,
    useData: () => elements,
  };
}
