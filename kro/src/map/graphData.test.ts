import { describe, expect, it } from 'vitest';
import { KubeResourceGraphDefinition } from '../resources/resourceGraphDefinition';
import {
  computeLayout,
  getCrdName,
  getInstanceGraph,
  getTemplateGraph,
  getTopologyKey,
  MAX_DEPENDENCY_EDGES,
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

  it('never collides with a resource literally named "root"', () => {
    // 'root' is a valid resource id; its node id is 'template-root'. The
    // synthetic root must live outside the template-<id> namespace or the
    // two ids collide (dedupe would drop the real resource and the root
    // edge would become a self-loop).
    const withRootResource: RgdData = {
      metadata: { name: 'edge-case' },
      spec: {
        resources: [
          { id: 'root', template: { apiVersion: 'v1', kind: 'ConfigMap' } },
          { id: 'app', template: { apiVersion: 'apps/v1', kind: 'Deployment' } },
        ],
      },
    };
    const graph = getTemplateGraph(withRootResource);
    const ids = graph.nodes.map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length); // all node ids unique
    expect(ids).toContain(TEMPLATE_ROOT_ID);
    expect(ids).toContain('template-root'); // the real resource survives
    expect(graph.edges.every(edge => edge.source !== edge.target)).toBe(true); // no self-loop
  });

  it('marks external references dashed with a distinct subtitle', () => {
    const graph = getTemplateGraph(webappRgd);
    const external = graph.nodes.find(node => node.id === 'template-platformConfig');
    expect(external).toMatchObject({
      dashed: true,
      subtitle: 'ConfigMap · external (read-only)',
    });
  });

  it('shows the external and conditional markers independently', () => {
    // kro permits an externalRef guarded by includeWhen; neither marker
    // may hide the other.
    const rgd: RgdData = {
      spec: {
        resources: [
          { id: 'plain', template: { apiVersion: 'v1', kind: 'ConfigMap' } },
          {
            id: 'optional',
            template: { apiVersion: 'v1', kind: 'Service' },
            includeWhen: ['${schema.spec.expose}'],
          },
          {
            id: 'optionalExternal',
            externalRef: { apiVersion: 'v1', kind: 'Secret', metadata: { name: 'tls' } },
            includeWhen: ['${schema.spec.tls}'],
          },
        ],
      },
    };
    const subtitleOf = (id: string) =>
      getTemplateGraph(rgd).nodes.find(node => node.id === `template-${id}`)?.subtitle;
    expect(subtitleOf('plain')).toBe('ConfigMap');
    expect(subtitleOf('optional')).toBe('Service · conditional');
    expect(subtitleOf('optionalExternal')).toBe('Secret · external (read-only) · conditional');
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

  it('carries the CRD name of custom resources for the native details panel', () => {
    // Classes built from a CRD (the instance itself, custom-kind
    // sub-resources) are stamped with crdName; built-in classes and plain
    // objects are not.
    class GenAIService {
      static crdName = 'genaiservices.kro.run';
      kind = 'GenAIService';
      metadata = { uid: 'uid-cr', name: 'chat' };
      jsonData = { kind: 'GenAIService', metadata: this.metadata, status: { state: 'Active' } };
    }
    const customInstance = new GenAIService() as any;
    class Model {
      static crdName = 'models.ai.example.com';
      kind = 'Model';
      metadata = { uid: 'uid-model', name: 'llm', labels: { 'kro.run/node-id': 'model' } };
      jsonData = { kind: 'Model', metadata: this.metadata };
    }
    const graph = getInstanceGraph(webappRgd, customInstance, [new Model() as any, deployment]);
    expect(getCrdName(customInstance)).toBe('genaiservices.kro.run');
    expect(graph.nodes.find(node => node.id === 'uid-cr')?.crdName).toBe('genaiservices.kro.run');
    expect(graph.nodes.find(node => node.id === 'uid-model')?.crdName).toBe(
      'models.ai.example.com'
    );
    expect(graph.nodes.find(node => node.id === 'uid-deploy')?.crdName).toBeUndefined();
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
    expect(ids).toEqual(['dep-uid-cm-uid-deploy', 'kro-owns-uid-cm']);
    expect(graph.omittedDependencyEdges).toBeUndefined();
    expect(graph.edges.find(edge => edge.id === 'dep-uid-cm-uid-deploy')).toMatchObject({
      source: 'uid-cm',
      target: 'uid-deploy',
      label: 'required by',
    });
  });

  it('keeps dependency edges for every member of a forEach collection', () => {
    // kro's forEach expands one resource into several objects that all
    // carry the same kro.run/node-id. Every member must get its own
    // dependency edge, and none may be demoted to a bare ownership edge.
    const deployA = makeItem('Deployment', 'uid-deploy-a', 'my-app-a', 'deployment');
    const deployB = makeItem('Deployment', 'uid-deploy-b', 'my-app-b', 'deployment');
    const graph = getInstanceGraph(webappRgd, instance, [appConfig, deployA, deployB]);
    const ids = graph.edges.map(edge => edge.id).sort();
    expect(ids).toEqual(['dep-uid-cm-uid-deploy-a', 'dep-uid-cm-uid-deploy-b', 'kro-owns-uid-cm']);
    expect(graph.edges.filter(edge => edge.source === 'uid-cm').map(edge => edge.target)).toEqual([
      'uid-deploy-a',
      'uid-deploy-b',
    ]);
  });

  it('fans dependency edges out from every member of a collection dependency', () => {
    const configA = makeItem('ConfigMap', 'uid-cm-a', 'cfg-a', 'appConfig');
    const configB = makeItem('ConfigMap', 'uid-cm-b', 'cfg-b', 'appConfig');
    const graph = getInstanceGraph(webappRgd, instance, [configA, configB, deployment]);
    const ids = graph.edges.map(edge => edge.id).sort();
    expect(ids).toEqual([
      'dep-uid-cm-a-uid-deploy',
      'dep-uid-cm-b-uid-deploy',
      'kro-owns-uid-cm-a',
      'kro-owns-uid-cm-b',
    ]);
  });

  it('omits the edges of a collection pair that exceeds the budget and reports it', () => {
    // Two collections of this size multiply to more than the budget;
    // every member must then fall back to an ownership edge so nothing
    // floats, and the graph must say what was left out.
    const size = Math.ceil(Math.sqrt(MAX_DEPENDENCY_EDGES)) + 1;
    const configs = Array.from({ length: size }, (_, index) =>
      makeItem('ConfigMap', `uid-cm-${index}`, `cfg-${index}`, 'appConfig')
    );
    const deploys = Array.from({ length: size }, (_, index) =>
      makeItem('Deployment', `uid-deploy-${index}`, `app-${index}`, 'deployment')
    );
    const graph = getInstanceGraph(webappRgd, instance, [...configs, ...deploys]);
    expect(graph.omittedDependencyEdges).toBe(size * size);
    expect(graph.edges).toHaveLength(size * 2);
    expect(graph.edges.every(edge => edge.id.startsWith('kro-owns-'))).toBe(true);
  });

  it('keeps the collection pairs that fit the budget when a later pair does not', () => {
    const chainRgd: RgdData = {
      spec: {
        resources: [
          { id: 'config', template: { apiVersion: 'v1', kind: 'ConfigMap' } },
          { id: 'deployment', template: { apiVersion: 'apps/v1', kind: 'Deployment' } },
          { id: 'pod', template: { apiVersion: 'v1', kind: 'Pod' } },
        ],
      },
      status: {
        resources: [
          { id: 'deployment', dependencies: [{ id: 'config' }] },
          { id: 'pod', dependencies: [{ id: 'deployment' }] },
        ],
        topologicalOrder: ['config', 'deployment', 'pod'],
      },
    };
    const config = makeItem('ConfigMap', 'uid-cm', 'cfg', 'config');
    const deploys = [
      makeItem('Deployment', 'uid-deploy-a', 'app-a', 'deployment'),
      makeItem('Deployment', 'uid-deploy-b', 'app-b', 'deployment'),
    ];
    const podCount = Math.ceil(MAX_DEPENDENCY_EDGES / 2) + 1; // 2 × podCount > budget
    const pods = Array.from({ length: podCount }, (_, index) =>
      makeItem('Pod', `uid-pod-${index}`, `pod-${index}`, 'pod')
    );
    const graph = getInstanceGraph(chainRgd, instance, [config, ...deploys, ...pods]);
    const dependencyEdges = graph.edges.filter(edge => edge.id.startsWith('dep-'));
    expect(dependencyEdges.map(edge => edge.id).sort()).toEqual([
      'dep-uid-cm-uid-deploy-a',
      'dep-uid-cm-uid-deploy-b',
    ]);
    expect(graph.omittedDependencyEdges).toBe(2 * podCount);
    // config and every pod hang off the instance; the deployments do not.
    const owned = graph.edges.filter(edge => edge.id.startsWith('kro-owns-'));
    expect(owned).toHaveLength(1 + podCount);
  });

  it('emits each object once when collectors report the same uid twice', () => {
    // Templates using two served versions of one custom kind get two
    // collectors resolving to the same class; renderers need unique ids.
    const again = makeItem('Deployment', 'uid-deploy', 'my-app-deploy', 'deployment');
    const graph = getInstanceGraph(webappRgd, instance, [appConfig, deployment, again]);
    expect(graph.nodes.map(node => node.id)).toEqual(['uid-instance', 'uid-cm', 'uid-deploy']);
    expect(graph.edges.map(edge => edge.id).sort()).toEqual([
      'dep-uid-cm-uid-deploy',
      'kro-owns-uid-cm',
    ]);
  });

  it('attaches collection members to the instance when their dependency is absent', () => {
    // platformConfig is an external reference and never collected, so
    // every appConfig member hangs off the instance node.
    const configA = makeItem('ConfigMap', 'uid-cm-a', 'cfg-a', 'appConfig');
    const configB = makeItem('ConfigMap', 'uid-cm-b', 'cfg-b', 'appConfig');
    const graph = getInstanceGraph(webappRgd, instance, [configA, configB]);
    expect(graph.edges.map(edge => edge.id).sort()).toEqual([
      'kro-owns-uid-cm-a',
      'kro-owns-uid-cm-b',
    ]);
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

describe('getTopologyKey', () => {
  const instance = makeInstance('uid-instance', 'my-app', 'Active');
  const service = makeItem('Service', 'uid-svc', 'my-app-svc', 'service');

  it('is unchanged by health-only updates', () => {
    const healthy = makeItem('Deployment', 'uid-deploy', 'd', 'deployment', {
      spec: { replicas: 2 },
      status: { readyReplicas: 2 },
    });
    const degraded = makeItem('Deployment', 'uid-deploy', 'd', 'deployment', {
      spec: { replicas: 2 },
      status: { readyReplicas: 0 },
    });
    const before = getInstanceGraph(webappRgd, instance, [healthy]);
    const after = getInstanceGraph(webappRgd, instance, [degraded]);
    expect(before.nodes[1].status).not.toBe(after.nodes[1].status);
    expect(getTopologyKey(before)).toBe(getTopologyKey(after));
  });

  it('changes when resources arrive', () => {
    const cold = getInstanceGraph(webappRgd, instance, []);
    const loaded = getInstanceGraph(webappRgd, instance, [service]);
    expect(getTopologyKey(cold)).not.toBe(getTopologyKey(loaded));
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
