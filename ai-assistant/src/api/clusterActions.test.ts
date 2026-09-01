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

  it('uses the collection kind for metadata-wrapped table rows', async () => {
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
      '/api/v1/nodes',
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
  });

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
