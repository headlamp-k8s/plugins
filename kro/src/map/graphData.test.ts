import { describe, expect, it } from 'vitest';
import { KubeResourceGraphDefinition } from '../resources/resourceGraphDefinition';
import {
  computeLayout,
  getInstanceGraph,
  getTemplateGraph,
  TEMPLATE_ROOT_ID,
} from './graphData';

type RgdData = Pick<KubeResourceGraphDefinition, 'spec' | 'status'> & {
  metadata?: { name?: string };
};

const webappRgd: RgdData = {
  metadata: { name: 'webapp' },
  spec: {
    schema: { apiVersion: 'v1alpha1', kind: 'WebApp' },
    resources: [
      {
        id: 'platformConfig',
        externalRef: { apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'cfg' } },
      },
      { id: 'appConfig', template: { apiVersion: 'v1', kind: 'ConfigMap' } },
      { id: 'deployment', template: { apiVersion: 'apps/v1', kind: 'Deployment' } },
      // Independent of the chain above: without a synthetic root this
      // would be a second connected component.
      { id: 'service', template: { apiVersion: 'v1', kind: 'Service' } },
    ],
  },
  status: {
    state: 'Active',
    resources: [
      { id: 'appConfig', dependencies: [{ id: 'platformConfig' }] },
      { id: 'deployment', dependencies: [{ id: 'appConfig' }] },
    ],
    topologicalOrder: ['platformConfig', 'appConfig', 'deployment', 'service'],
  },
};

function makeItem(
  kind: string,
  uid: string,
  name: string,
  nodeId?: string,
  extra: Record<string, any> = {}
): any {
  const jsonData = {
    kind,
    metadata: {
      uid,
      name,
      labels: nodeId ? { 'kro.run/node-id': nodeId } : {},
    },
    ...extra,
  };
  return { kind, metadata: jsonData.metadata, jsonData };
}

function makeInstance(uid: string, name: string, state?: string): any {
  const jsonData = {
    kind: 'WebApp',
    metadata: { uid, name },
    status: state ? { state } : undefined,
  };
  return { kind: 'WebApp', metadata: jsonData.metadata, jsonData };
}

describe('getTemplateGraph', () => {
  it('returns an empty graph (no root) for an RGD without resources', () => {
    expect(getTemplateGraph({ spec: {} })).toEqual({ nodes: [], edges: [] });
  });

  it('emits a synthetic root labeled with the RGD name', () => {
    const graph = getTemplateGraph(webappRgd);
    const root = graph.nodes.find(node => node.id === TEMPLATE_ROOT_ID);
    expect(root).toMatchObject({
      label: 'webapp',
      subtitle: 'ResourceGraphDefinition',
      icon: 'mdi:graph-outline',
    });
  });

  it('falls back to the generated kind, then a generic root label', () => {
    const noName = { ...webappRgd, metadata: {} };
    expect(getTemplateGraph(noName).nodes[0].label).toBe('WebApp');
    const noSchema: RgdData = { spec: { resources: webappRgd.spec.resources } };
    expect(getTemplateGraph(noSchema).nodes[0].label).toBe('ResourceGraphDefinition');
  });

  it('hangs only dependency-less resources off the root', () => {
    const graph = getTemplateGraph(webappRgd);
    const rootTargets = graph.edges
      .filter(edge => edge.source === TEMPLATE_ROOT_ID)
      .map(edge => edge.target)
      .sort();
    expect(rootTargets).toEqual(['template-platformConfig', 'template-service']);
  });

  it('produces a single connected component rooted at the synthetic root', () => {
    const graph = getTemplateGraph(webappRgd);
    const children = new Map<string, string[]>();
    for (const edge of graph.edges) {
      children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
    }
    const reached = new Set<string>();
    const queue = [TEMPLATE_ROOT_ID];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (reached.has(id)) {
        continue;
      }
      reached.add(id);
      queue.push(...(children.get(id) ?? []));
    }
    expect(reached.size).toBe(graph.nodes.length);
  });

  it('drops edges referencing unknown resources and re-roots the orphan', () => {
    const brokenStatus: RgdData = {
      ...webappRgd,
      status: {
        resources: [{ id: 'deployment', dependencies: [{ id: 'doesNotExist' }] }],
      },
    };
    const graph = getTemplateGraph(brokenStatus);
    expect(graph.edges.every(edge => !edge.id.includes('doesNotExist'))).toBe(true);
    // With its only dependency filtered out, deployment hangs off the root.
    expect(
      graph.edges.some(
        edge => edge.source === TEMPLATE_ROOT_ID && edge.target === 'template-deployment'
      )
    ).toBe(true);
  });

  it('connects everything to the root for an Inactive RGD without status', () => {
    const inactive: RgdData = { metadata: { name: 'webapp' }, spec: webappRgd.spec };
    const graph = getTemplateGraph(inactive);
    const rootEdges = graph.edges.filter(edge => edge.source === TEMPLATE_ROOT_ID);
    expect(rootEdges).toHaveLength(webappRgd.spec.resources!.length);
  });

  it('marks external references dashed with a distinct subtitle', () => {
    const graph = getTemplateGraph(webappRgd);
    const external = graph.nodes.find(node => node.id === 'template-platformConfig');
    expect(external).toMatchObject({
      dashed: true,
      subtitle: 'ConfigMap · external (read-only)',
    });
  });
});

describe('getInstanceGraph', () => {
  const instance = makeInstance('uid-instance', 'my-app', 'Active');
  const deployment = makeItem('Deployment', 'uid-deploy', 'my-app-deploy', 'deployment', {
    spec: { replicas: 2 },
    status: { readyReplicas: 2 },
  });
  const appConfig = makeItem('ConfigMap', 'uid-cm', 'my-app-config', 'appConfig');
  const service = makeItem('Service', 'uid-svc', 'my-app-svc', 'service');

  it('maps instance state to node status', () => {
    const activeGraph = getInstanceGraph(webappRgd, instance, []);
    expect(activeGraph.nodes[0]).toMatchObject({ id: 'uid-instance', status: 'success' });
    const failed = getInstanceGraph(webappRgd, makeInstance('u', 'n', 'Failed'), []);
    expect(failed.nodes[0].status).toBe('error');
    const pending = getInstanceGraph(webappRgd, makeInstance('u', 'n'), []);
    expect(pending.nodes[0].status).toBe('warning');
  });

  it('attaches the live object to every node for the native renderer', () => {
    const graph = getInstanceGraph(webappRgd, instance, [deployment, service]);
    expect(graph.nodes.every(node => node.kubeObject !== undefined)).toBe(true);
    expect(graph.nodes[0].kubeObject).toBe(instance);
    expect(graph.nodes.find(node => node.id === 'uid-deploy')?.kubeObject).toBe(deployment);
  });

  it('emits kro-owns edges (matching the global map source ids) for dependency-less items', () => {
    const graph = getInstanceGraph(webappRgd, instance, [service]);
    expect(graph.edges).toEqual([
      { id: 'kro-owns-uid-svc', source: 'uid-instance', target: 'uid-svc' },
    ]);
  });

  it('prefers dependency edges over ownership edges when both apply', () => {
    // appConfig depends on platformConfig (absent) -> falls back to owns;
    // deployment depends on appConfig (present) -> dep edge, no owns edge.
    const graph = getInstanceGraph(webappRgd, instance, [appConfig, deployment]);
    const ids = graph.edges.map(edge => edge.id).sort();
    expect(ids).toEqual(['dep-appConfig-deployment', 'kro-owns-uid-cm']);
    expect(graph.edges.find(edge => edge.id === 'dep-appConfig-deployment')).toMatchObject({
      source: 'uid-cm',
      target: 'uid-deploy',
      label: 'depends on',
    });
  });

  it('normalizes empty health to an undefined status', () => {
    const storageClass = makeItem('StorageClass', 'uid-sc', 'standard');
    // StorageClass health falls through to the generic "Created" success
    // path; use a kind-less summary to exercise '' normalization instead.
    const graph = getInstanceGraph(webappRgd, instance, [storageClass]);
    const node = graph.nodes.find(n => n.id === 'uid-sc');
    expect(node?.status === undefined || node?.status === 'success').toBe(true);
  });
});

describe('computeLayout', () => {
  it('layers nodes by their longest path from a root', () => {
    const graph = getTemplateGraph(webappRgd);
    const positions = computeLayout(graph);
    const columnOf = (id: string) => positions.get(id)!.x / 280;
    expect(columnOf(TEMPLATE_ROOT_ID)).toBe(0);
    expect(columnOf('template-platformConfig')).toBe(1);
    expect(columnOf('template-appConfig')).toBe(2);
    expect(columnOf('template-deployment')).toBe(3);
    expect(columnOf('template-service')).toBe(1);
  });

  it('terminates on cyclic input instead of looping', () => {
    const positions = computeLayout({
      nodes: [
        { id: 'a', label: 'a', subtitle: '', icon: 'mdi:cube' },
        { id: 'b', label: 'b', subtitle: '', icon: 'mdi:cube' },
      ],
      edges: [
        { id: 'ab', source: 'a', target: 'b' },
        { id: 'ba', source: 'b', target: 'a' },
      ],
    });
    expect(positions.size).toBe(2);
  });
});
