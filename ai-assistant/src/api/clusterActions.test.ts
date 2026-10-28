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
  isLogRequest: vi.fn<(url: string) => boolean>(),
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

vi.mock('@headlamp-k8s/ai-ui/parsing/urlParsing', async importOriginal => {
  const actual = await importOriginal<typeof import('@headlamp-k8s/ai-ui/parsing/urlParsing')>();
  return { ...actual, isLogRequest: mocks.isLogRequest };
});

import { handleActualApiRequest } from './clusterActions';

describe('handleActualApiRequest resource links', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const actual = await vi.importActual<typeof import('@headlamp-k8s/ai-ui/parsing/urlParsing')>(
      '@headlamp-k8s/ai-ui/parsing/urlParsing'
    );
    mocks.isLogRequest.mockImplementation(actual.isLogRequest);
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

describe('handleActualApiRequest GET redaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isLogRequest.mockReturnValue(false);
  });

  it('redacts Secret data before pushing the response to history', async () => {
    mocks.clusterRequest.mockResolvedValue({
      kind: 'Secret',
      apiVersion: 'v1',
      metadata: { name: 'db-credentials', namespace: 'default' },
      data: { DATABASE_PASSWORD: 'aHVudGVyMg==', 'tls.key': 'LS0tLXByaXZhdGUta2V5LS0tLQ==' },
      type: 'Opaque',
    });

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
    mocks.clusterRequest.mockResolvedValue({
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

  it('redacts credentials in pod log responses', async () => {
    mocks.isLogRequest.mockReturnValue(true);
    mocks.clusterRequest.mockResolvedValue({
      text: async () => 'starting server\npassword: hunter2\ntoken=abc123xyz\nready',
    });

    const onSuccess = vi.fn();
    const aiManager = { history: [] as Array<{ content: string }> };
    const result = await handleActualApiRequest(
      '/api/v1/namespaces/default/pods/my-pod/log',
      'GET',
      '',
      () => {},
      aiManager,
      'my-pod',
      'Headlamp',
      undefined,
      onSuccess
    );

    expect(result).toContain('starting server');
    expect(result).not.toContain('hunter2');
    expect(result).not.toContain('abc123xyz');
    expect(result).toContain('[REDACTED]');

    const historyContent = aiManager.history.map(entry => entry.content).join('\n');
    expect(historyContent).toContain('LOGS_BUTTON:');
    expect(historyContent).not.toContain('hunter2');
    expect(historyContent).not.toContain('abc123xyz');
    expect(historyContent).toContain('[REDACTED]');

    expect(onSuccess).toHaveBeenCalledTimes(1);
    const callbackPayload = JSON.stringify(onSuccess.mock.calls[0][0]);
    expect(callbackPayload).not.toContain('hunter2');
    expect(callbackPayload).not.toContain('abc123xyz');
    expect(callbackPayload).toContain('[REDACTED]');
  });

  it('returns a bounded tail of logs for large log outputs and separates model-facing history', async () => {
    mocks.isLogRequest.mockReturnValue(true);
    const manyLines = Array.from({ length: 150 }, (_, i) => `log line ${i + 1}`).join('\n');
    mocks.clusterRequest.mockResolvedValue({
      text: async () => manyLines,
    });

    const aiManager = {
      history: [] as Array<{
        content: string;
        role?: string;
        isDisplayOnly?: boolean;
        toolCallId?: string;
        name?: string;
      }>,
    };
    const result = await handleActualApiRequest(
      '/api/v1/namespaces/default/pods/large-pod/log',
      'GET',
      '',
      () => {},
      aiManager,
      'large-pod',
      'Headlamp'
    );

    expect(result).toContain('Logs retrieved for pods "large-pod" in namespace "default".');
    expect(result).toContain('... [truncated, showing most recent logs] ...');
    expect(result).toContain('log line 150');
    expect(result).not.toContain('log line 1\n');

    // The LOGS_BUTTON entry in history preserves the complete logs for UI inspection
    expect(aiManager.history).toHaveLength(2);
    const uiEntry = aiManager.history[0];
    expect(uiEntry.isDisplayOnly).toBe(true);
    expect(uiEntry.content).toContain('LOGS_BUTTON:');
    expect(uiEntry.content).toContain('log line 1');
    expect(uiEntry.content).toContain('log line 150');

    // The separate model-facing entry stores the bounded text without LOGS_BUTTON,
    // prefixed with the logSummary to attribute workload source (pod/namespace/container)
    const modelEntry = aiManager.history[1];
    expect(modelEntry.isDisplayOnly).toBeFalsy();
    expect(modelEntry.content).not.toContain('LOGS_BUTTON:');
    expect(modelEntry.content).toContain(
      'Logs retrieved for pods "large-pod" in namespace "default".'
    );
    expect(modelEntry.content).toContain('... [truncated, showing most recent logs] ...');
    expect(modelEntry.content).toContain('log line 150');
    expect(modelEntry.content).not.toContain('log line 1\n');

    // Integration assertion: simulate KubernetesTool tagging and model message selection
    for (let i = aiManager.history.length - 1; i >= 0; i--) {
      if (aiManager.history[i].role === 'tool' && !aiManager.history[i].toolCallId) {
        aiManager.history[i].toolCallId = 'tc-logs';
        aiManager.history[i].name = 'kubernetes_api_request';
        break;
      }
    }

    // Prepare model responses as LangChainAssistantSession does
    const modelToolResponses = aiManager.history.filter(
      p => p.role === 'tool' && p.toolCallId && !p.isDisplayOnly
    );
    expect(modelToolResponses).toHaveLength(1);
    expect(modelToolResponses[0].content).not.toContain('LOGS_BUTTON:');
    expect(modelToolResponses[0].content).toContain(
      'Logs retrieved for pods "large-pod" in namespace "default".'
    );
    expect(modelToolResponses[0].content).toContain('log line 150');
    expect(modelToolResponses[0].content).not.toContain('log line 1\n');
  });

  it('returns localized fallback message when pod logs are empty', async () => {
    mocks.isLogRequest.mockReturnValue(true);
    mocks.clusterRequest.mockResolvedValue({
      text: async () => '',
    });

    const aiManager = { history: [] as Array<{ content: string }> };
    const result = await handleActualApiRequest(
      '/api/v1/namespaces/default/pods/empty-pod/log',
      'GET',
      '',
      () => {},
      aiManager,
      'empty-pod',
      'Headlamp'
    );

    expect(result).toBe('No logs available for pods "empty-pod" in namespace "default".');
    expect(aiManager.history[0]?.content).toContain(
      'No logs available for pods "empty-pod" in namespace "default".'
    );
  });
});
