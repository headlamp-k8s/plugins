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

import { refreshApplication, syncApplication } from './argoClient';

describe('argoClient', () => {
  beforeEach(() => {
    mockRequest.mockReset().mockResolvedValue({});
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
