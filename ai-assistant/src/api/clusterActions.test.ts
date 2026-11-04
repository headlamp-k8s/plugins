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

import {
  getMessageTargetCluster,
  sanitizeToolAlignment,
} from '@headlamp-k8s/ai-common/conversation/history';
import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  clusterRequest: vi.fn(),
  apply: vi.fn(),
  clusterAction: vi.fn<(action: () => Promise<unknown>) => Promise<unknown>>(),
  isLogRequest: vi.fn<(url: string) => boolean>(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  clusterAction: mocks.clusterAction,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({
  apply: mocks.apply,
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

  it.each([{ kind: 'ServiceAccount', metadata: { name: 'default' } }, 'resource output', null])(
    'records the actual request cluster on tool history: %j',
    async response => {
      mocks.clusterRequest.mockResolvedValue(response);
      const history: Array<{ role: string; cluster?: string }> = [];
      await handleActualApiRequest(
        '/api/v1/namespaces/demo/serviceaccounts/default',
        'GET',
        '',
        vi.fn(),
        { history },
        '',
        'chat-cluster'
      );
      expect(mocks.clusterRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cluster: 'chat-cluster' })
      );
      expect(history.at(-1)).toMatchObject({ role: 'tool', cluster: 'chat-cluster' });
    }
  );

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
      cluster: 'Headlamp',
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

describe('handleActualApiRequest handled log failures', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const actual = await vi.importActual<typeof import('@headlamp-k8s/ai-ui/parsing/urlParsing')>(
      '@headlamp-k8s/ai-ui/parsing/urlParsing'
    );
    mocks.isLogRequest.mockImplementation(actual.isLogRequest);
  });

  it.each([
    'a container name must be specified for pod test-pod, choose one of: [app sidecar]',
    'Bad Request',
  ])('retains a failed log request in multi-cluster provenance: %s', async message => {
    const history: ConversationMessage[] = [
      { role: 'user', content: 'Inspect cluster A and get the logs from cluster B.' },
    ];
    mocks.clusterRequest
      .mockResolvedValueOnce({ kind: 'Pod', metadata: { name: 'test-pod' } })
      .mockRejectedValueOnce(new Error(message));
    await handleActualApiRequest(
      '/api/v1/namespaces/demo/pods/test-pod',
      'GET',
      '',
      vi.fn(),
      { history },
      '',
      'cluster-a'
    );
    const result = await handleActualApiRequest(
      '/api/v1/namespaces/demo/pods/test-pod/log',
      'GET',
      '',
      vi.fn(),
      { history },
      '',
      'cluster-b'
    );

    expect(getMessageTargetCluster(history)).toBeNull();
    expect(
      history.filter(entry => entry.role === 'tool' && entry.cluster === 'cluster-b')
    ).toHaveLength(1);
    const guidance = history.find(entry => entry.role === 'assistant');
    expect(guidance?.content).toContain('test-pod');
    expect(JSON.parse(result)).toEqual({
      error: false,
      role: 'assistant',
      content: guidance?.content,
    });
    expect(mocks.clusterRequest).toHaveBeenCalledTimes(2);
  });
});

describe('handleActualApiRequest failed mutation provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clusterRequest.mockReset();
    mocks.apply.mockReset();
    mocks.clusterAction.mockReset();
    mocks.isLogRequest.mockReturnValue(false);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  const resource = { kind: 'ConfigMap', name: 'example', namespace: 'demo' };
  const url = '/api/v1/namespaces/demo/configmaps/example';
  const resourceBody = JSON.stringify({
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: { name: resource.name, namespace: resource.namespace },
  });

  async function readClusterA(): Promise<ConversationMessage[]> {
    const history: ConversationMessage[] = [
      { role: 'user', content: 'Inspect A, then update the resource in B.' },
    ];
    mocks.clusterRequest.mockResolvedValueOnce({ kind: 'Pod', metadata: { name: 'test-pod' } });
    await handleActualApiRequest(
      '/api/v1/namespaces/demo/pods/test-pod',
      'GET',
      '',
      vi.fn(),
      { history },
      '',
      'cluster-a'
    );
    return history;
  }

  it.each([
    { method: 'POST', operation: 'POST' },
    { method: 'DELETE', operation: 'DELETE' },
    { method: 'PUT', operation: 'PATCH' },
  ])(
    'retains the confirmed target after a failed $method mutation',
    async ({ method, operation }) => {
      const actions: Promise<unknown>[] = [];
      mocks.clusterAction.mockImplementation(action => {
        const result = action();
        actions.push(result);
        return result;
      });
      const failure = new Error('Mutation was forbidden');
      mocks.clusterRequest.mockRejectedValue(failure);
      mocks.apply.mockRejectedValue(failure);
      const history = await readClusterA();
      const body =
        method === 'POST'
          ? resourceBody
          : method === 'DELETE'
          ? JSON.stringify(resource)
          : JSON.stringify({ data: { setting: 'updated' } });
      const callbackTargets: Array<string | null | undefined> = [];
      const onFailure = vi.fn(() => {
        callbackTargets.push(getMessageTargetCluster(history));
        history.push({
          role: 'tool',
          toolCallId: 'unmatched-confirmation-error',
          error: true,
          content: failure.message,
        });
      });
      await handleActualApiRequest(
        url,
        method,
        body,
        vi.fn(),
        { history },
        JSON.stringify(resource),
        'cluster-b',
        onFailure
      );
      await Promise.all(actions);

      expect(callbackTargets).toEqual([null]);
      expect(getMessageTargetCluster(history)).toBeNull();
      expect(sanitizeToolAlignment(history)).toContainEqual(
        expect.objectContaining({
          role: 'assistant',
          error: true,
          content: expect.stringContaining(failure.message),
        })
      );
      expect(
        history.filter(entry => entry.role === 'tool' && entry.cluster === 'cluster-b')
      ).toHaveLength(1);
      expect(onFailure).toHaveBeenCalledWith(failure, operation, resource);
      if (method === 'POST') {
        expect(mocks.apply).toHaveBeenCalledWith(expect.anything(), 'cluster-b');
      } else {
        expect(mocks.clusterRequest).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({ method: operation, cluster: 'cluster-b' })
        );
      }
    }
  );

  it.each([
    { method: 'POST', operation: 'POST', phase: 'parse' },
    { method: 'DELETE', operation: 'DELETE', phase: 'parse' },
    { method: 'PUT', operation: 'PUT', phase: 'parse' },
    { method: 'PUT', operation: 'PUT', phase: 'resource-info' },
    { method: 'POST', operation: 'POST', phase: 'setup' },
    { method: 'PUT', operation: 'PATCH', phase: 'setup' },
  ])(
    'retains the confirmed target when $method fails during $phase',
    async ({ method, operation, phase }) => {
      const history = await readClusterA();
      mocks.clusterAction.mockImplementation(() => {
        throw new Error('Could not start the cluster action');
      });
      const callbackTargets: Array<string | null | undefined> = [];
      const onFailure = vi.fn(() => callbackTargets.push(getMessageTargetCluster(history)));
      await handleActualApiRequest(
        url,
        method,
        phase === 'parse' ? '[invalid' : resourceBody,
        vi.fn(),
        { history },
        phase === 'resource-info' ? '[invalid' : JSON.stringify(resource),
        'cluster-b',
        onFailure
      );

      expect(callbackTargets).toEqual([null]);
      expect(getMessageTargetCluster(history)).toBeNull();
      expect(
        history.filter(entry => entry.role === 'tool' && entry.cluster === 'cluster-b')
      ).toHaveLength(1);
      expect(onFailure).toHaveBeenCalledWith(expect.any(Error), operation, expect.any(Object));
      expect(mocks.clusterRequest).toHaveBeenCalledTimes(1);
      expect(mocks.apply).not.toHaveBeenCalled();
      expect(mocks.clusterAction).toHaveBeenCalledTimes(phase === 'setup' ? 1 : 0);
    }
  );

  it('records a terminal update failure once after the strategic-patch fallback', async () => {
    const history = await readClusterA();
    const actions: Promise<unknown>[] = [];
    mocks.clusterAction.mockImplementation(action => {
      const result = action();
      actions.push(result);
      return result;
    });
    mocks.clusterRequest
      .mockRejectedValueOnce(Object.assign(new Error('Unsupported media type'), { status: 415 }))
      .mockRejectedValueOnce(new Error('Mutation was forbidden'));
    const onFailure = vi.fn(() => expect(getMessageTargetCluster(history)).toBeNull());
    await handleActualApiRequest(
      url,
      'PUT',
      resourceBody,
      vi.fn(),
      { history },
      JSON.stringify(resource),
      'cluster-b',
      onFailure
    );
    await Promise.all(actions);

    expect(onFailure).toHaveBeenCalledOnce();
    expect(mocks.clusterRequest).toHaveBeenCalledTimes(3);
    expect(mocks.clusterRequest).toHaveBeenLastCalledWith(
      url,
      expect.objectContaining({
        cluster: 'cluster-b',
        headers: expect.objectContaining({ 'Content-Type': 'application/merge-patch+json' }),
      })
    );
    expect(
      history.filter(entry => entry.role === 'tool' && entry.cluster === 'cluster-b')
    ).toHaveLength(1);
  });

  it('redacts mutation failure content before recording trusted request history', async () => {
    const history = await readClusterA();
    mocks.clusterRequest.mockRejectedValue(new Error('Authorization: Bearer mutation-test-secret'));
    await handleActualApiRequest(
      url,
      'DELETE',
      JSON.stringify(resource),
      vi.fn(),
      { history },
      '',
      'cluster-b'
    );
    expect(getMessageTargetCluster(history)).toBeNull();
    const failure = history.find(entry => entry.role === 'tool' && entry.cluster === 'cluster-b');
    expect(failure?.error).toBe(true);
    expect(failure?.content).toContain('[REDACTED]');
    expect(failure?.content).not.toContain('mutation-test-secret');
    expect(history.find(entry => entry.role === 'assistant' && entry.error)?.content).toBe(
      failure?.content
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
