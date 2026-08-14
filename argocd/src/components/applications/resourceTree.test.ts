/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from 'vitest';
import { ArgoApplication, KubeArgoApplication } from '../../resources/application';
import { ArgoAppProject, KubeArgoAppProject } from '../../resources/appproject';
import {
  buildArgoCDGraph,
  buildArgoCDProjectGraph,
  isLocalApplicationDestination,
  makeArgoDescriptorKey,
  makeDescriptorKey,
} from './resourceTree';

describe('isLocalApplicationDestination', () => {
  it('identifies in-cluster correctly', () => {
    const app = new ArgoApplication({
      spec: { destination: { name: 'in-cluster' } },
    } as KubeArgoApplication);
    expect(isLocalApplicationDestination(app)).toBe(true);
  });

  it('identifies kubernetes.default.svc correctly', () => {
    const app = new ArgoApplication({
      spec: { destination: { server: 'https://kubernetes.default.svc' } },
    } as KubeArgoApplication);
    expect(isLocalApplicationDestination(app)).toBe(true);
  });

  it('identifies remote cluster as non-local', () => {
    const app = new ArgoApplication({
      spec: { destination: { server: 'https://remote-cluster.com' } },
    } as KubeArgoApplication);
    expect(isLocalApplicationDestination(app)).toBe(false);
  });
});

describe('resourceTree descriptor keys', () => {
  it('builds a stable key handling missing namespace or group', () => {
    expect(makeDescriptorKey('apps', 'v1', 'Deployment', 'default', 'my-app')).toBe(
      'apps/v1/Deployment/default/my-app'
    );
    expect(makeDescriptorKey('', 'v1', 'Service', 'default', 'my-svc')).toBe(
      '/v1/Service/default/my-svc'
    );
    expect(makeDescriptorKey('rbac.authorization.k8s.io', 'v1', 'ClusterRole', '', 'my-role')).toBe(
      'rbac.authorization.k8s.io/v1/ClusterRole//my-role'
    );
  });

  it('builds Argo descriptor key correctly', () => {
    const res = {
      group: 'apps',
      version: 'v1',
      kind: 'Deployment',
      namespace: 'default',
      name: 'my-app',
    };
    expect(makeArgoDescriptorKey(res)).toBe('apps/v1/Deployment/default/my-app');
  });
});

describe('buildArgoCDGraph', () => {
  const localAppSpec = { destination: { name: 'in-cluster' } };
  const remoteAppSpec = { destination: { server: 'https://remote' } };

  function makeMockKubeObject(
    uid: string,
    kind: string,
    name: string,
    namespace: string,
    ownerUid?: string
  ) {
    return {
      kind,
      jsonData: { apiVersion: 'v1' }, // Simplification for core API
      metadata: {
        uid,
        name,
        namespace,
        ownerReferences: ownerUid ? [{ uid: ownerUid }] : [],
      },
    } as any;
  }

  it('creates Application root node and managed resource edges for local app', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        health: { status: 'Healthy' },
        sync: { status: 'Synced' },
        resources: [
          {
            group: '',
            version: 'v1',
            kind: 'Service',
            namespace: 'default',
            name: 'svc-name',
            status: 'Synced',
          },
        ],
      },
    } as KubeArgoApplication);

    const liveSvc = makeMockKubeObject('svc-uid', 'Service', 'svc-name', 'default');

    const graph = buildArgoCDGraph([app], [liveSvc]);

    // Nodes: App, Live Svc
    expect(graph.nodes).toHaveLength(2);

    const appNode = graph.nodes.find(n => n.id === 'app-uid');
    expect(appNode).toBeDefined();
    expect(appNode?.status).toBe('success');
    expect(appNode?.subtitle).toBe('Argo CD Application');

    const svcNode = graph.nodes.find(n => n.id === 'svc-uid');
    expect(svcNode).toBeDefined();
    expect(svcNode?.kubeObject).toBeDefined(); // Native object attached

    // Edges: App -> Svc
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].source).toBe('app-uid');
    expect(graph.edges[0].target).toBe('svc-uid');
    expect(graph.edges[0].data?.relationship).toBe('managed-by-argocd');
    expect(graph.edges[0].label).toBe('manages');
  });

  it('creates synthetic read-only nodes for missing or unsupported managed resources', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        resources: [
          { group: '', version: 'v1', kind: 'Service', namespace: 'default', name: 'svc-name' },
        ],
      },
    } as KubeArgoApplication);

    const graph = buildArgoCDGraph([app], []); // No live objects loaded

    expect(graph.nodes).toHaveLength(2);
    const syntheticNode = graph.nodes.find(n => n.id !== 'app-uid');

    expect(syntheticNode).toBeDefined();
    expect(syntheticNode?.id).toContain('argocd-managed:app-uid');
    expect(syntheticNode?.kubeObject).toBeUndefined();
    expect(syntheticNode?.subtitle).toBe('Service • default • Read-only');
  });

  it('remote Application creates only synthetic read-only nodes even if live object matches', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: remoteAppSpec,
      status: {
        resources: [
          { group: '', version: 'v1', kind: 'Service', namespace: 'default', name: 'svc-name' },
        ],
      },
    } as KubeArgoApplication);

    const liveSvc = makeMockKubeObject('local-svc-uid', 'Service', 'svc-name', 'default');

    const graph = buildArgoCDGraph([app], [liveSvc]);

    expect(graph.nodes).toHaveLength(2); // The liveSvc is not linked because app is remote
    const syntheticNode = graph.nodes.find(n => n.id !== 'app-uid');

    expect(syntheticNode).toBeDefined();
    expect(syntheticNode?.id).toContain('argocd-managed:app-uid');
    expect(syntheticNode?.kubeObject).toBeUndefined();
    expect(syntheticNode?.detailsComponent).toBeUndefined();
    expect(syntheticNode?.subtitle).toBe('Service • default • Remote');
  });

  it('creates owner-reference edges only when owner UID exists in graph', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        resources: [
          {
            group: 'apps',
            version: 'v1',
            kind: 'Deployment',
            namespace: 'default',
            name: 'dep-name',
          },
          {
            group: 'apps',
            version: 'v1',
            kind: 'ReplicaSet',
            namespace: 'default',
            name: 'rs-name',
          },
        ],
      },
    } as KubeArgoApplication);

    const liveDep = {
      kind: 'Deployment',
      jsonData: { apiVersion: 'apps/v1' },
      metadata: { uid: 'dep-uid', name: 'dep-name', namespace: 'default' },
    } as any;

    // RS is owned by Dep
    const liveRs = makeMockKubeObject('rs-uid', 'ReplicaSet', 'rs-name', 'default', 'dep-uid');
    liveRs.jsonData.apiVersion = 'apps/v1';
    // Pod is owned by RS
    const livePod = makeMockKubeObject('pod-uid', 'Pod', 'pod-name', 'default', 'rs-uid');

    const graph = buildArgoCDGraph([app], [liveDep, liveRs, livePod]);

    expect(graph.nodes).toHaveLength(3); // App, Dep, RS. Pod is not added because it's not in managedResources.

    const ownerEdges = graph.edges.filter(e => e.id.startsWith('owner-reference:'));
    expect(ownerEdges).toHaveLength(1);
    expect(ownerEdges[0].source).toBe('dep-uid');
    expect(ownerEdges[0].target).toBe('rs-uid');
    expect(ownerEdges[0].label).toBe('owns');
  });

  it('does not infer ownership from matching names or labels', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        resources: [
          {
            group: 'apps',
            version: 'v1',
            kind: 'Deployment',
            namespace: 'default',
            name: 'shared-name',
          },
          {
            group: 'apps',
            version: 'v1',
            kind: 'ReplicaSet',
            namespace: 'default',
            name: 'child-name',
          },
        ],
      },
    } as KubeArgoApplication);
    const liveOwner = {
      kind: 'Deployment',
      jsonData: { apiVersion: 'apps/v1' },
      metadata: {
        uid: 'owner-uid',
        name: 'shared-name',
        namespace: 'default',
        labels: { app: 'shared' },
      },
    } as any;
    const liveChild = {
      kind: 'ReplicaSet',
      jsonData: { apiVersion: 'apps/v1' },
      metadata: {
        uid: 'child-uid',
        name: 'child-name',
        namespace: 'default',
        labels: { app: 'shared', owner: 'shared-name' },
        ownerReferences: [{ uid: 'different-owner-uid', name: 'shared-name' }],
      },
    } as any;

    const graph = buildArgoCDGraph([app], [liveOwner, liveChild]);

    expect(graph.edges.filter(edge => edge.id.startsWith('owner-reference:'))).toEqual([]);
  });

  it('two Applications managing same Service create one Service node and two edges', () => {
    const app1 = new ArgoApplication({
      metadata: { uid: 'app1' },
      spec: localAppSpec,
      status: {
        resources: [
          { group: '', version: 'v1', kind: 'Service', namespace: 'default', name: 'svc-name' },
        ],
      },
    } as KubeArgoApplication);

    const app2 = new ArgoApplication({
      metadata: { uid: 'app2' },
      spec: localAppSpec,
      status: {
        resources: [
          { group: '', version: 'v1', kind: 'Service', namespace: 'default', name: 'svc-name' },
        ],
      },
    } as KubeArgoApplication);

    const liveSvc = makeMockKubeObject('svc-uid', 'Service', 'svc-name', 'default');

    const graph = buildArgoCDGraph([app1, app2], [liveSvc]);

    expect(graph.nodes).toHaveLength(3); // App1, App2, Svc
    expect(graph.nodes.filter(n => n.id === 'svc-uid')).toHaveLength(1);

    const managedEdges = graph.edges.filter(e => e.id.startsWith('managed-by-argocd'));
    expect(managedEdges).toHaveLength(2);
    expect(managedEdges.some(e => e.source === 'app1' && e.target === 'svc-uid')).toBe(true);
    expect(managedEdges.some(e => e.source === 'app2' && e.target === 'svc-uid')).toBe(true);
  });

  it('does not resolve a resource when its API group or version differs', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        resources: [
          {
            group: 'apps',
            version: 'v1',
            kind: 'Deployment',
            namespace: 'default',
            name: 'guestbook',
          },
        ],
      },
    } as KubeArgoApplication);
    const differentVersion = {
      kind: 'Deployment',
      jsonData: { apiVersion: 'apps/v1beta1' },
      metadata: { uid: 'different-version-uid', name: 'guestbook', namespace: 'default' },
    } as any;

    const graph = buildArgoCDGraph([app], [differentVersion]);
    const resourceNode = graph.nodes.find(node => node.id !== 'app-uid');

    expect(resourceNode?.id).toContain('argocd-managed:app-uid');
    expect(resourceNode?.kubeObject).toBeUndefined();
  });

  it('does not duplicate a managed-resource edge for duplicate references', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        resources: [
          { group: '', version: 'v1', kind: 'Service', namespace: 'default', name: 'svc-name' },
          { group: '', version: 'v1', kind: 'Service', namespace: 'default', name: 'svc-name' },
        ],
      },
    } as KubeArgoApplication);
    const liveSvc = makeMockKubeObject('svc-uid', 'Service', 'svc-name', 'default');

    const graph = buildArgoCDGraph([app], [liveSvc]);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it('keeps a namespaced resource without a namespace synthetic', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        resources: [{ group: '', version: 'v1', kind: 'Service', name: 'svc-name' }],
      },
    } as KubeArgoApplication);
    const liveSvc = makeMockKubeObject('svc-uid', 'Service', 'svc-name', 'default');

    const graph = buildArgoCDGraph([app], [liveSvc]);
    const resourceNode = graph.nodes.find(node => node.id !== 'app-uid');

    expect(resourceNode?.id).toContain('argocd-managed:app-uid');
    expect(resourceNode?.kubeObject).toBeUndefined();
  });

  it('keeps graph subtitles compact when controller diagnostics are present', () => {
    const app = new ArgoApplication({
      metadata: { uid: 'app-uid' },
      spec: localAppSpec,
      status: {
        health: { status: 'Degraded', message: 'Deployment is unavailable' },
        sync: { status: 'OutOfSync' },
        resources: [
          {
            group: '',
            version: 'v1',
            kind: 'Service',
            namespace: 'default',
            name: 'svc-name',
            status: 'OutOfSync',
            health: { status: 'Degraded', message: 'Endpoint is unavailable' },
          },
        ],
      },
    } as KubeArgoApplication);

    const graph = buildArgoCDGraph([app], []);
    expect(graph.nodes.find(node => node.id === 'app-uid')?.subtitle).toBe('Argo CD Application');
    expect(graph.nodes.find(node => node.id !== 'app-uid')?.subtitle).toBe(
      'Service • default • Read-only'
    );
    expect(graph.nodes.map(node => node.subtitle).join(' ')).not.toContain(
      'Deployment is unavailable'
    );
    expect(graph.nodes.map(node => node.subtitle).join(' ')).not.toContain(
      'Endpoint is unavailable'
    );
  });
});

describe('buildArgoCDProjectGraph', () => {
  it('emits only the AppProject overlay node and contains edge', () => {
    const project = new ArgoAppProject({
      metadata: { uid: 'project-uid', namespace: 'argocd', name: 'platform' },
      spec: {},
    } as KubeArgoAppProject);
    const application = new ArgoApplication({
      metadata: { uid: 'app-uid', namespace: 'argocd', name: 'guestbook' },
      spec: { destination: { name: 'in-cluster' }, project: 'platform' },
    } as KubeArgoApplication);

    const graph = buildArgoCDProjectGraph([project], [application]);
    expect(graph.nodes.map(node => node.id)).toEqual(['project-uid']);
    expect(graph.nodes[0].subtitle).toBe('Argo CD AppProject');
    expect(graph.edges).toEqual([
      expect.objectContaining({
        source: 'project-uid',
        target: 'app-uid',
        label: 'contains',
        data: { relationship: 'appproject-member' },
      }),
    ]);
  });

  it('leaves Applications without an accessible matching AppProject as roots', () => {
    const application = new ArgoApplication({
      metadata: { uid: 'app-uid', namespace: 'argocd', name: 'guestbook' },
      spec: { destination: { name: 'in-cluster' }, project: 'missing-project' },
    } as KubeArgoApplication);

    expect(buildArgoCDProjectGraph([], [application])).toEqual({ nodes: [], edges: [] });
  });

  it('does not mix projects with the same name across namespaces', () => {
    const projects = [
      new ArgoAppProject({
        metadata: { uid: 'project-a', namespace: 'team-a', name: 'platform' },
        spec: {},
      } as KubeArgoAppProject),
      new ArgoAppProject({
        metadata: { uid: 'project-b', namespace: 'team-b', name: 'platform' },
        spec: {},
      } as KubeArgoAppProject),
    ];
    const applications = [
      new ArgoApplication({
        metadata: { uid: 'app-a', namespace: 'team-a', name: 'frontend' },
        spec: { destination: { name: 'in-cluster' }, project: 'platform' },
      } as KubeArgoApplication),
      new ArgoApplication({
        metadata: { uid: 'app-b', namespace: 'team-b', name: 'backend' },
        spec: { destination: { name: 'in-cluster' }, project: 'platform' },
      } as KubeArgoApplication),
    ];

    const graph = buildArgoCDProjectGraph(projects, applications);

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'project-a', target: 'app-a' }),
        expect.objectContaining({ source: 'project-b', target: 'app-b' }),
      ])
    );
    expect(graph.edges).not.toContainEqual(
      expect.objectContaining({ source: 'project-a', target: 'app-b' })
    );
    expect(graph.edges).not.toContainEqual(
      expect.objectContaining({ source: 'project-b', target: 'app-a' })
    );
  });

  it('uses the worst Application status for the AppProject node', () => {
    const project = new ArgoAppProject({
      metadata: { uid: 'project-uid', namespace: 'argocd', name: 'platform' },
      spec: {},
    } as KubeArgoAppProject);
    const healthyApplication = new ArgoApplication({
      metadata: { uid: 'healthy-app', namespace: 'argocd', name: 'healthy' },
      spec: { destination: { name: 'in-cluster' }, project: 'platform' },
      status: { sync: { status: 'Synced' }, health: { status: 'Healthy' } },
    } as KubeArgoApplication);
    const degradedApplication = new ArgoApplication({
      metadata: { uid: 'degraded-app', namespace: 'argocd', name: 'degraded' },
      spec: { destination: { name: 'in-cluster' }, project: 'platform' },
      status: { sync: { status: 'Synced' }, health: { status: 'Degraded' } },
    } as KubeArgoApplication);

    const graph = buildArgoCDProjectGraph([project], [healthyApplication, degradedApplication]);

    expect(graph.nodes[0].status).toBe('error');
  });

  it('shows success only when every Application in the AppProject is healthy', () => {
    const project = new ArgoAppProject({
      metadata: { uid: 'project-uid', namespace: 'argocd', name: 'platform' },
      spec: {},
    } as KubeArgoAppProject);
    const healthyApplication = new ArgoApplication({
      metadata: { uid: 'healthy-app', namespace: 'argocd', name: 'healthy' },
      spec: { destination: { name: 'in-cluster' }, project: 'platform' },
      status: { sync: { status: 'Synced' }, health: { status: 'Healthy' } },
    } as KubeArgoApplication);

    expect(buildArgoCDProjectGraph([project], [healthyApplication]).nodes[0].status).toBe(
      'success'
    );
  });
});
