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

import { afterEach, describe, expect, it, vi } from 'vitest';

const mockClusterRequest = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  clusterAction: (fn: () => unknown) => fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  apply: vi.fn(),
  clusterRequest: (...args: unknown[]) => mockClusterRequest(...args),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  getCluster: () => 'test-cluster',
}));

vi.mock('@headlamp-k8s/ai-ui/parsing/urlParsing', () => ({
  isLogRequest: () => false,
  isSpecificResourceRequestHelper: () => true,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('handleActualApiRequest GET', () => {
  it('redacts Secret data before pushing the response to history', async () => {
    mockClusterRequest.mockResolvedValue({
      kind: 'Secret',
      apiVersion: 'v1',
      metadata: { name: 'db-credentials', namespace: 'default' },
      data: { DATABASE_PASSWORD: 'aHVudGVyMg==', 'tls.key': 'LS0tLXByaXZhdGUta2V5LS0tLQ==' },
      type: 'Opaque',
    });

    const { handleActualApiRequest } = await import('./clusterActions');

    const aiManager = { history: [] as Array<{ content: string }> };
    await handleActualApiRequest(
      '/api/v1/namespaces/default/secrets/db-credentials',
      'GET',
      '',
      () => {},
      aiManager,
      'db-credentials'
    );

    const historyContent = aiManager.history.map(entry => entry.content).join('\n');
    expect(historyContent).not.toContain('aHVudGVyMg==');
    expect(historyContent).not.toContain('LS0tLXByaXZhdGUta2V5LS0tLQ==');
    expect(historyContent).toContain('[REDACTED]');
  });

  it('redacts Secret data in SecretList responses (list of secrets)', async () => {
    mockClusterRequest.mockResolvedValue({
      kind: 'SecretList',
      apiVersion: 'v1',
      metadata: { resourceVersion: '12345' },
      items: [
        {
          metadata: { name: 'db-credentials', namespace: 'default' },
          data: { DATABASE_PASSWORD: 'aHVudGVyMg==' },
          type: 'Opaque',
        },
      ],
    });

    const { handleActualApiRequest } = await import('./clusterActions');

    const aiManager = { history: [] as Array<{ content: string }> };
    await handleActualApiRequest(
      '/api/v1/namespaces/default/secrets',
      'GET',
      '',
      () => {},
      aiManager,
      'secrets'
    );

    const historyContent = aiManager.history.map(entry => entry.content).join('\n');
    expect(historyContent).not.toContain('aHVudGVyMg==');
    expect(historyContent).toContain('[REDACTED]');
  });
});
