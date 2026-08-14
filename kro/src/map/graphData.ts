// Pure graph builders for the embedded detail-page graphs. The same
// graph feeds Headlamp's native GraphView (when the host exposes it
// through pluginLib.ResourceMap) and the local fallback renderer.
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KroInstance } from '../resources/instance';
import { KubeResourceGraphDefinition } from '../resources/resourceGraphDefinition';
import { getComposedResources } from '../resources/rgdGraph';
import { getNodeId, getResolvedValues, getSubResourceHealth } from '../resources/subResources';

export interface EmbeddedGraphNode {
  id: string;
  label: string;
  subtitle: string;
  status?: 'success' | 'error' | 'warning';
  /** Iconify icon name. */
  icon: string;
  /** Render with a dashed outline (external, read-only references). */
  dashed?: boolean;
  /**
   * The live object backing this node, when there is one. The native
   * GraphView renders such nodes with Headlamp's own KubeIcon and
   * details panel; the fallback renderer ignores this field.
   */
  kubeObject?: KubeObject<any>;
}

export interface EmbeddedGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface EmbeddedGraph {
  nodes: EmbeddedGraphNode[];
  edges: EmbeddedGraphEdge[];
}

/**
 * Id of the synthetic root node of the template graph. Deliberately
 * not the RGD's metadata.uid: the global map source emits an RGD node
 * under that uid with edges to every instance, and reusing it would
 * pull all instances into the embedded template view's connected
 * component.
 */
export const TEMPLATE_ROOT_ID = 'template-root';

const KIND_ICONS: Record<string, string> = {
  Deployment: 'mdi:layers-triple',
  StatefulSet: 'mdi:database-clock',
  PersistentVolumeClaim: 'mdi:harddisk',
  Service: 'mdi:lan',
  ConfigMap: 'mdi:file-cog',
  Secret: 'mdi:key',
  Job: 'mdi:briefcase-clock',
  ServiceAccount: 'mdi:account-key',
  Role: 'mdi:shield-account',
  RoleBinding: 'mdi:shield-link-variant',
  StorageClass: 'mdi:database-cog',
  Pod: 'mdi:cube',
};

export function iconForKind(kind: string): string {
  return KIND_ICONS[kind] ?? 'mdi:cube-outline';
}

/**
 * The static template DAG of an RGD: a synthetic root for the RGD
 * itself, one node per spec.resources entry, one edge per dependency
 * from kro's published static analysis. Resources without dependencies
 * hang off the root, so the graph is always a single connected
 * component — the native GraphView only renders the selected node's
 * component. Pure so it stays unit-testable; safe on Inactive RGDs
 * without status.
 */
export function getTemplateGraph(
  rgd: Pick<KubeResourceGraphDefinition, 'spec' | 'status'> & { metadata?: { name?: string } }
): EmbeddedGraph {
  const composed = getComposedResources(rgd);
  if (composed.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: EmbeddedGraphNode[] = composed.map(resource => ({
    id: `template-${resource.id}`,
    label: resource.id,
    subtitle: resource.external
      ? `${resource.kind} · external (read-only)`
      : resource.conditional
      ? `${resource.kind} · conditional`
      : resource.kind,
    icon: resource.external ? 'mdi:link-variant' : iconForKind(resource.kind),
    dashed: resource.external,
  }));

  const edges: EmbeddedGraphEdge[] = composed.flatMap(resource =>
    resource.dependencies.map(dependency => ({
      id: `template-${dependency}-${resource.id}`,
      source: `template-${dependency}`,
      target: `template-${resource.id}`,
    }))
  );

  // Never emit edges pointing at nodes that don't exist; stay defensive
  // against partial status.
  const nodeIds = new Set(nodes.map(node => node.id));
  const validEdges = edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  // Root the graph: every node without an incoming dependency edge
  // (after the defensive filter above) connects to the synthetic root.
  const hasIncoming = new Set(validEdges.map(edge => edge.target));
  const rootEdges: EmbeddedGraphEdge[] = nodes
    .filter(node => !hasIncoming.has(node.id))
    .map(node => ({
      id: `${TEMPLATE_ROOT_ID}-${node.id}`,
      source: TEMPLATE_ROOT_ID,
      target: node.id,
    }));

  return {
    nodes: [
      {
        id: TEMPLATE_ROOT_ID,
        label: rgd.metadata?.name ?? rgd.spec?.schema?.kind ?? 'ResourceGraphDefinition',
        subtitle: 'ResourceGraphDefinition',
        icon: 'mdi:graph-outline',
      },
      ...nodes,
    ],
    edges: [...rootEdges, ...validEdges],
  };
}

/**
 * The live graph of an instance: the instance itself plus the actual
 * resources kro created for it, with node status reflecting real
 * health. Dependency edges mirror the template DAG via the
 * kro.run/node-id label; resources with no in-graph dependency hang
 * directly off the instance node. Ownership edge ids match the ones
 * the global map source emits (`kro-owns-<uid>`), so when both feed
 * the native GraphView, first-wins dedupe collapses them into one.
 */
export function getInstanceGraph(
  rgd: Pick<KubeResourceGraphDefinition, 'spec' | 'status'>,
  instance: KubeObject<KroInstance>,
  subResources: KubeObject<any>[]
): EmbeddedGraph {
  const composed = getComposedResources(rgd);
  const itemsByNodeId = new Map<string, KubeObject<any>>();
  for (const item of subResources) {
    const nodeId = getNodeId(item.jsonData);
    if (nodeId !== '-') {
      itemsByNodeId.set(nodeId, item);
    }
  }

  const instanceState = instance.jsonData.status?.state?.toLowerCase();
  const nodes: EmbeddedGraphNode[] = [
    {
      id: instance.metadata.uid,
      label: instance.metadata.name,
      subtitle: instance.kind,
      icon: 'mdi:graph-outline',
      status:
        instanceState === 'active'
          ? 'success'
          : instanceState === 'failed' || instanceState === 'error'
          ? 'error'
          : 'warning',
      kubeObject: instance,
    },
    ...subResources.map(item => {
      const health = getSubResourceHealth(item.kind, item.jsonData);
      const resolved = getResolvedValues(item.kind, item.jsonData);
      return {
        id: item.metadata.uid,
        label: item.metadata.name,
        subtitle: resolved ? `${item.kind} · ${resolved}` : item.kind,
        icon: iconForKind(item.kind),
        status: health.status === '' ? undefined : health.status,
        kubeObject: item,
      };
    }),
  ];

  const edges: EmbeddedGraphEdge[] = [];
  const hasDependencyEdge = new Set<string>();
  for (const resource of composed) {
    const item = itemsByNodeId.get(resource.id);
    if (!item) {
      continue;
    }
    for (const dependency of resource.dependencies) {
      const dependencyItem = itemsByNodeId.get(dependency);
      if (!dependencyItem) {
        continue;
      }
      edges.push({
        id: `dep-${dependency}-${resource.id}`,
        source: dependencyItem.metadata.uid,
        target: item.metadata.uid,
        label: 'depends on',
      });
      hasDependencyEdge.add(resource.id);
    }
  }
  for (const item of subResources) {
    const nodeId = getNodeId(item.jsonData);
    if (nodeId !== '-' && hasDependencyEdge.has(nodeId)) {
      continue;
    }
    edges.push({
      id: `kro-owns-${item.metadata.uid}`,
      source: instance.metadata.uid,
      target: item.metadata.uid,
    });
  }

  return { nodes, edges };
}

/**
 * Layered left-to-right layout: a node's column is the longest edge
 * path from any root, which matches kro's topological ordering for
 * DAGs. Returns positions keyed by node id.
 */
export function computeLayout(graph: EmbeddedGraph): Map<string, { x: number; y: number }> {
  const incoming = new Map<string, string[]>();
  for (const node of graph.nodes) {
    incoming.set(node.id, []);
  }
  for (const edge of graph.edges) {
    incoming.get(edge.target)?.push(edge.source);
  }

  const depthCache = new Map<string, number>();
  const visiting = new Set<string>();
  const depthOf = (id: string): number => {
    const cached = depthCache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(id)) {
      // Cycle guard: kro graphs are DAGs, but never loop on bad data.
      return 0;
    }
    visiting.add(id);
    const parents = incoming.get(id) ?? [];
    const depth =
      parents.length === 0 ? 0 : Math.max(...parents.map(parent => depthOf(parent))) + 1;
    visiting.delete(id);
    depthCache.set(id, depth);
    return depth;
  };

  const byDepth = new Map<number, string[]>();
  for (const node of graph.nodes) {
    const depth = depthOf(node.id);
    if (!byDepth.has(depth)) {
      byDepth.set(depth, []);
    }
    byDepth.get(depth)!.push(node.id);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const columnWidth = 280;
  const rowHeight = 110;
  for (const [depth, ids] of byDepth) {
    ids.forEach((id, index) => {
      positions.set(id, {
        x: depth * columnWidth,
        y: index * rowHeight - ((ids.length - 1) * rowHeight) / 2,
      });
    });
  }
  return positions;
}
