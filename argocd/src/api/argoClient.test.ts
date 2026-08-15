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

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: mockRequest },
  K8s: {
    cluster: {
      KubeObject: class KubeObject {
        jsonData: any;
        constructor(jsonData: any) {
          this.jsonData = jsonData;
        }
      },
    },
  },
}));

import { refreshApplication, rollbackApplication, syncApplication } from './argoClient';

describe('argoClient', () => {
  beforeEach(() => {
    mockRequest.mockReset().mockResolvedValue({ metadata: { resourceVersion: '42' } });
  });

  it('syncApplication sends a merge-patch with .operation.sync', async () => {
    await syncApplication('guestbook', 'argocd');

    expect(mockRequest).toHaveBeenCalledWith(
      '/apis/argoproj.io/v1alpha1/namespaces/argocd/applications/guestbook',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify({
          operation: {
            initiatedBy: { username: 'headlamp' },
            sync: {},
          },
        }),
      }
    );
  });

  it('syncApplication accepts a custom revision', async () => {
    await syncApplication('guestbook', 'argocd', 'main');

    expect(mockRequest).toHaveBeenCalledWith(
      '/apis/argoproj.io/v1alpha1/namespaces/argocd/applications/guestbook',
      expect.objectContaining({
        body: JSON.stringify({
          operation: {
            initiatedBy: { username: 'headlamp' },
            sync: { revision: 'main' },
          },
        }),
      })
    );
  });

  it('rollbackApplication sends a complete single-source history snapshot', async () => {
    await rollbackApplication(
      'guestbook',
      'argocd',
      {
        id: 4,
        revision: 'abc123def456',
        deployedAt: '2025-01-01T00:00:00Z',
        source: {
          repoURL: 'https://github.com/example/apps.git',
          targetRevision: 'main',
          path: 'guestbook',
          helm: { valueFiles: ['values-production.yaml'] },
        },
      },
      ['CreateNamespace=true']
    );

    expect(mockRequest).toHaveBeenLastCalledWith(
      '/apis/argoproj.io/v1alpha1/namespaces/argocd/applications/guestbook',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json-patch+json' },
        body: JSON.stringify([
          { op: 'test', path: '/metadata/resourceVersion', value: '42' },
          {
            op: 'add',
            path: '/operation',
            value: {
              initiatedBy: { username: 'headlamp' },
              sync: {
                revision: 'abc123def456',
                source: {
                  repoURL: 'https://github.com/example/apps.git',
                  targetRevision: 'main',
                  path: 'guestbook',
                  helm: { valueFiles: ['values-production.yaml'] },
                },
                dryRun: false,
                prune: false,
                syncOptions: ['CreateNamespace=true'],
                syncStrategy: { apply: {} },
              },
            },
          },
        ]),
      })
    );

    const requestOptions = mockRequest.mock.calls[1][1];
    expect(JSON.stringify(requestOptions.body)).not.toContain('spec');
  });

  it('rollbackApplication sends aligned multi-source revisions and snapshots', async () => {
    const sources = [
      { repoURL: 'https://github.com/example/apps.git', path: 'guestbook' },
      { repoURL: 'https://github.com/example/values.git', ref: 'values' },
    ];

    await rollbackApplication('guestbook', 'argocd', {
      id: 3,
      revisions: ['app-revision', 'values-revision'],
      sources,
      deployedAt: '2025-01-01T00:00:00Z',
    });

    const requestOptions = mockRequest.mock.calls[1][1];
    const patch = JSON.parse(requestOptions.body);
    expect(patch[1].value.sync).toEqual({
      revisions: ['app-revision', 'values-revision'],
      sources,
      dryRun: false,
      prune: false,
      syncOptions: [],
      syncStrategy: { apply: {} },
    });
    expect(JSON.stringify(patch)).not.toContain('spec');
  });

  it('rejects incomplete rollback history before sending a patch', async () => {
    await expect(
      rollbackApplication('guestbook', 'argocd', {
        id: 2,
        revisions: ['only-one-revision'],
        sources: [
          { repoURL: 'https://github.com/example/apps.git' },
          { repoURL: 'https://github.com/example/values.git' },
        ],
        deployedAt: '2025-01-01T00:00:00Z',
      })
    ).rejects.toThrow(/multi-source history entry is incomplete/);

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('uses the existing RBAC error handling for rollback', async () => {
    mockRequest
      .mockResolvedValueOnce({ metadata: { resourceVersion: '42' } })
      .mockRejectedValueOnce({ status: 403, message: 'Forbidden' });

    await expect(
      rollbackApplication('guestbook', 'argocd', {
        id: 1,
        revision: 'abc123',
        source: { repoURL: 'https://github.com/example/apps.git' },
        deployedAt: '2025-01-01T00:00:00Z',
      })
    ).rejects.toThrow(/Permission denied.*RBAC.*"argocd" namespace/);
  });

  it('refuses rollback when an operation is already in progress', async () => {
    mockRequest.mockResolvedValueOnce({
      metadata: { resourceVersion: '42' },
      operation: { sync: {} },
    });

    await expect(
      rollbackApplication('guestbook', 'argocd', {
        id: 1,
        revision: 'abc123',
        source: { repoURL: 'https://github.com/example/apps.git' },
        deployedAt: '2025-01-01T00:00:00Z',
      })
    ).rejects.toThrow(/operation is already in progress/);

    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('reports a stale Application conflict during rollback', async () => {
    mockRequest
      .mockResolvedValueOnce({ metadata: { resourceVersion: '42' } })
      .mockRejectedValueOnce({ status: 409, message: 'Conflict' });

    await expect(
      rollbackApplication('guestbook', 'argocd', {
        id: 1,
        revision: 'abc123',
        source: { repoURL: 'https://github.com/example/apps.git' },
        deployedAt: '2025-01-01T00:00:00Z',
      })
    ).rejects.toThrow(/Application changed/);
  });

  it('refreshApplication sends a merge-patch with the refresh annotation', async () => {
    await refreshApplication('guestbook', 'argocd');

    expect(mockRequest).toHaveBeenCalledWith(
      '/apis/argoproj.io/v1alpha1/namespaces/argocd/applications/guestbook',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/merge-patch+json' },
        body: JSON.stringify({
          metadata: {
            annotations: { 'argocd.argoproj.io/refresh': 'normal' },
          },
        }),
      }
    );
  });

  it('refreshApplication supports hard refresh', async () => {
    await refreshApplication('guestbook', 'argocd', 'hard');

    expect(mockRequest).toHaveBeenCalledWith(
      '/apis/argoproj.io/v1alpha1/namespaces/argocd/applications/guestbook',
      expect.objectContaining({
        body: JSON.stringify({
          metadata: {
            annotations: { 'argocd.argoproj.io/refresh': 'hard' },
          },
        }),
      })
    );
  });

  it('throws a user-friendly RBAC error on 403 Error', async () => {
    mockRequest.mockRejectedValueOnce(new Error('403 Forbidden'));

    await expect(syncApplication('guestbook', 'argocd')).rejects.toThrow(
      /Permission denied.*RBAC.*"argocd" namespace/
    );
  });

  it('throws a user-friendly RBAC error on { status: 403 } object', async () => {
    mockRequest.mockRejectedValueOnce({ status: 403, message: 'Forbidden' });

    await expect(syncApplication('guestbook', 'argocd')).rejects.toThrow(
      /Permission denied.*RBAC.*"argocd" namespace/
    );
  });

  it('re-throws non-403 errors unchanged', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network timeout'));

    await expect(refreshApplication('guestbook', 'argocd')).rejects.toThrow('network timeout');
  });

  it('does not false-positive on errors with 403 in message but a different status', async () => {
    mockRequest.mockRejectedValueOnce({ status: 500, message: 'upstream returned 403' });

    await expect(syncApplication('guestbook', 'argocd')).rejects.not.toThrow(/Permission denied/);
  });
});
