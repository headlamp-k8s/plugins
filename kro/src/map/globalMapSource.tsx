import { Icon } from '@iconify/react';
import { Link, NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  GraphEdge,
  GraphNode,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useMemo } from 'react';
import { ResourceGraphDefinition } from '../resources/resourceGraphDefinition';
import { getSubResourceHealth } from '../resources/subResources';
import { kroRouteNames } from '../utils/kroRoutes';

const KRO_OWNED_SELECTOR = 'kro.run/owned=true';

/**
 * Built-in kinds kro templates commonly create. The global map source
 * watches these with kro's ownership label; one static sub-source per
 * kind keeps every useData hook count fixed.
 */
const OWNED_KINDS = [
  'Deployment',
  'StatefulSet',
  'Service',
  'PersistentVolumeClaim',
  'ConfigMap',
  'Secret',
  'Job',
  'ServiceAccount',
  'Role',
  'RoleBinding',
] as const;

/** Side-panel details for a synthesized kro instance node. */
function InstanceNodeDetails(props: { node: GraphNode }) {
  const data = props.node.data ?? {};
  return (
    <SectionBox title={`${data.kind ?? 'Instance'}: ${data.name ?? ''}`}>
      <NameValueTable
        rows={[
          { name: 'Kind', value: data.kind ?? '-' },
          { name: 'Namespace', value: data.namespace ?? '-' },
          {
            name: 'Details',
            value:
              data.rgdName && data.name ? (
                data.namespace ? (
                  <Link
                    routeName={kroRouteNames.instanceDetail}
                    params={{ rgdName: data.rgdName, namespace: data.namespace, name: data.name }}
                  >
                    Open instance view
                  </Link>
                ) : (
                  <Link
                    routeName={kroRouteNames.clusterInstanceDetail}
                    params={{ rgdName: data.rgdName, name: data.name }}
                  >
                    Open instance view
                  </Link>
                )
              ) : (
                '-'
              ),
          },
        ]}
      />
    </SectionBox>
  );
}

/**
 * Synthesize graph elements for the kro instance owning an item, plus
 * the edges RGD -> instance -> item, purely from kro's ownership
 * labels. Instances are custom resources of dynamically generated CRDs,
 * so they cannot be listed with a fixed set of hooks — but every owned
 * resource carries enough labels to reconstruct its owner node.
 */
function getOwnershipElements(item: KubeObject<any>): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const labels = item.jsonData?.metadata?.labels ?? {};
  const instanceId = labels['kro.run/instance-id'];
  const instanceName = labels['kro.run/instance-name'];
  if (!instanceId || !instanceName) {
    return { nodes: [], edges: [] };
  }
  const instanceNode: GraphNode = {
    id: instanceId,
    label: instanceName,
    subtitle: labels['kro.run/instance-kind'] ?? 'kro instance',
    icon: <Icon icon="mdi:graph-outline" width="70%" height="70%" />,
    weight: 500,
    detailsComponent: InstanceNodeDetails,
    data: {
      name: instanceName,
      namespace: labels['kro.run/instance-namespace'],
      kind: labels['kro.run/instance-kind'],
      rgdName: labels['kro.run/resource-graph-definition-name'],
    },
  };
  const edges: GraphEdge[] = [
    {
      id: `kro-owns-${item.metadata.uid}`,
      source: instanceId,
      target: item.metadata.uid,
    },
  ];
  const rgdId = labels['kro.run/resource-graph-definition-id'];
  if (rgdId) {
    edges.push({
      id: `kro-defines-${instanceId}-${rgdId}`,
      source: rgdId,
      target: instanceId,
      label: 'defines',
    });
  }
  return { nodes: [instanceNode], edges };
}

function makeOwnedKindSource(kind: (typeof OWNED_KINDS)[number]) {
  return {
    id: `kro-owned-${kind.toLowerCase()}`,
    label: `${kind}s managed by kro`,
    useData() {
      const resourceClass = (ResourceClasses as Record<string, typeof KubeObject<any>>)[kind];
      const [items] = resourceClass.useList({ labelSelector: KRO_OWNED_SELECTOR });
      return useMemo(() => {
        if (!items) {
          return null;
        }
        const nodes: GraphNode[] = [];
        const edges: GraphEdge[] = [];
        for (const item of items) {
          const health = getSubResourceHealth(item.kind, item.jsonData);
          nodes.push({
            id: item.metadata.uid,
            kubeObject: item,
            status: health.status === '' ? undefined : health.status,
          });
          const ownership = getOwnershipElements(item);
          nodes.push(...ownership.nodes);
          edges.push(...ownership.edges);
        }
        return { nodes, edges };
      }, [items]);
    },
  };
}

const rgdSource = {
  id: 'kro-resourcegraphdefinitions',
  label: 'ResourceGraphDefinitions',
  useData() {
    const [rgds] = ResourceGraphDefinition.useList();
    return useMemo(() => {
      if (!rgds) {
        return null;
      }
      const nodes: GraphNode[] = rgds.map(rgd => ({
        id: rgd.metadata.uid,
        kubeObject: rgd,
        status: rgd.state === 'Active' ? 'success' : rgd.state === 'Inactive' ? 'error' : 'warning',
        weight: 900,
      }));
      return { nodes, edges: [] };
    }, [rgds]);
  },
};

export const kroMapSource = {
  id: 'kro',
  label: 'kro',
  icon: <Icon icon="mdi:graph-outline" width="100%" height="100%" />,
  sources: [rgdSource, ...OWNED_KINDS.map(makeOwnedKindSource)],
};
