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

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clusterRequest: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  clusterAction: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  apply: vi.fn(),
  clusterRequest: mocks.clusterRequest,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  getCluster: () => 'Headlamp',
}));

import { handleActualApiRequest } from './clusterActions';

describe('handleActualApiRequest resource links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['/api/v1/namespaces/default/pods/my.pod', 'Pod', 'my.pod'],
    ['/api/v1/namespaces/default/configmaps/app.properties', 'ConfigMap', 'app.properties'],
    ['/api/v1/nodes/worker.example.com', 'Node', 'worker.example.com'],
    [
      '/apis/apiextensions.k8s.io/v1/customresourcedefinitions/widgets.example.com',
      'CustomResourceDefinition',
      'widgets.example.com',
    ],
    [
      '/apis/rbac.authorization.k8s.io/v1/clusterroles/system:discovery',
      'ClusterRole',
      'system:discovery',
    ],
  ])('requests full resource JSON for %s', async (url, kind, name) => {
    mocks.clusterRequest.mockResolvedValue({ kind, metadata: { name } });

    await handleActualApiRequest(url, 'GET', '', vi.fn(), { history: [] }, '', 'Headlamp');

    expect(mocks.clusterRequest).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      })
    );
  });

  it('preserves full JSON for a Pod named log', async () => {
    const url = '/api/v1/namespaces/default/pods/log';
    const resource = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'log', namespace: 'default' },
      spec: { containers: [{ name: 'app', image: 'nginx:1.27' }] },
      status: { phase: 'Running' },
    };
    mocks.clusterRequest.mockResolvedValue(resource);
    const aiManager = { history: [] };

    const result = await handleActualApiRequest(url, 'GET', '', vi.fn(), aiManager, '', 'Headlamp');

    expect(mocks.clusterRequest).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        isJSON: true,
      })
    );
    expect(result).toBe(JSON.stringify(resource, null, 2));
    expect(aiManager.history).toContainEqual({
      success: true,
      role: 'tool',
      content: result,
    });
  });

  it('uses text mode for a Pod log subresource', async () => {
    const url = '/api/v1/namespaces/default/pods/log/log?container=app';
    const text = vi.fn().mockResolvedValue('startup complete');
    mocks.clusterRequest.mockResolvedValue({ text });
    const aiManager = { history: [] };

    await handleActualApiRequest(url, 'GET', '', vi.fn(), aiManager, '', 'Headlamp');

    expect(mocks.clusterRequest).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ headers: { Accept: '*/*' }, isJSON: false })
    );
    expect(text).toHaveBeenCalledOnce();
    expect(aiManager.history).toContainEqual(
      expect.objectContaining({
        role: 'tool',
        content: expect.stringContaining('startup complete'),
      })
    );
  });

  it.each([
    ['/api/v1/nodes', '/api/v1/nodes'],
    ['/api/v1/nodes?continue=token/log', '/api/v1/nodes?continue=token%2Flog'],
  ])(
    'uses the collection kind for metadata-wrapped table rows from %s',
    async (url, cleanedUrl) => {
      mocks.clusterRequest.mockResolvedValue({
        kind: 'Table',
        columnDefinitions: [{ name: 'Node' }, { name: 'Status' }, { name: 'Pool' }],
        rows: [
          {
            cells: ['aks-agentpool-000001', 'Ready', 'agentpool'],
            object: {
              kind: 'PartialObjectMetadata',
              metadata: { name: 'aks-agentpool-000001' },
            },
          },
        ],
      });
      const aiManager = { history: [] };

      const result = await handleActualApiRequest(
        url,
        'GET',
        '',
        vi.fn(),
        aiManager,
        '',
        'Headlamp'
      );

      expect(result).toContain(
        'https://headlamp/resource-details?cluster=Headlamp&kind=nodes&resource=aks-agentpool-000001'
      );
      expect(result).not.toContain('kind=PartialObjectMetadata');
      expect(mocks.clusterRequest).toHaveBeenCalledWith(
        cleanedUrl,
        expect.objectContaining({
          headers: expect.objectContaining({ Accept: expect.stringContaining('as=Table') }),
        })
      );
    }
  );

  it('extracts the collection kind from namespaced list URLs', async () => {
    mocks.clusterRequest.mockResolvedValue({
      kind: 'Table',
      columnDefinitions: [{ name: 'Name' }, { name: 'Status' }],
      rows: [
        {
          cells: ['test-pod', 'Running'],
          object: {
            kind: 'PartialObjectMetadata',
            metadata: { name: 'test-pod', namespace: 'default' },
          },
        },
      ],
    });

    const result = await handleActualApiRequest(
      '/api/v1/namespaces/default/pods',
      'GET',
      '',
      vi.fn(),
      { history: [] },
      '',
      'Headlamp'
    );

    expect(result).toContain(
      'https://headlamp/resource-details?cluster=Headlamp&kind=pods&resource=test-pod&ns=default'
    );
  });
});
