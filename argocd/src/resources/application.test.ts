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

import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    cluster: {
      KubeObject: class KubeObject {
        jsonData: any;
        metadata: any;

        constructor(jsonData: any) {
          this.jsonData = jsonData;
          this.metadata = jsonData.metadata;
        }
      },
    },
  },
}));

import {
  ArgoApplication,
  getRollbackHistoryEntries,
  isAutomatedSyncEnabled,
  type KubeArgoApplication,
  type RevisionHistory,
} from './application';

function createApplication(controllerNamespace?: string) {
  return new ArgoApplication({
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'Application',
    metadata: {
      name: 'guestbook',
      namespace: 'applications',
      creationTimestamp: '2025-01-01T00:00:00Z',
      uid: 'guestbook-uid',
    },
    spec: {
      project: 'default',
      destination: { namespace: 'default', server: 'https://kubernetes.default.svc' },
    },
    status: controllerNamespace ? { controllerNamespace } : undefined,
  } as KubeArgoApplication);
}

describe('ArgoApplication controllerNamespace', () => {
  it('returns the namespace reported by Argo CD', () => {
    expect(createApplication('argocd').controllerNamespace).toBe('argocd');
  });

  it('returns undefined when Argo CD has not reported a controller namespace', () => {
    expect(createApplication().controllerNamespace).toBeUndefined();
  });
});

const source = {
  repoURL: 'https://github.com/example/apps.git',
  targetRevision: 'main',
  path: 'guestbook',
};

function historyEntry(
  id: number,
  deployedAt: string,
  revision: string,
  overrides: Partial<RevisionHistory> = {}
): RevisionHistory {
  return { id, deployedAt, revision, source, ...overrides };
}

describe('isAutomatedSyncEnabled', () => {
  const spec = (automated?: { enabled?: boolean | null }) => ({
    project: 'default',
    destination: {},
    syncPolicy: automated === undefined ? undefined : { automated },
  });

  it.each([
    [{}, true],
    [{ enabled: true }, true],
    [{ enabled: null }, true],
    [{ enabled: false }, false],
  ])('maps automated policy %j to %s', (automated, expected) => {
    expect(isAutomatedSyncEnabled(spec(automated))).toBe(expected);
  });

  it('treats a missing automated policy as manual sync', () => {
    expect(isAutomatedSyncEnabled(spec())).toBe(false);
  });
});

describe('getRollbackHistoryEntries', () => {
  it('sorts newest first and excludes the current deployment', () => {
    const entries = [
      historyEntry(1, '2025-01-01T00:00:00Z', 'oldest'),
      historyEntry(3, '2025-03-01T00:00:00Z', 'current'),
      historyEntry(2, '2025-02-01T00:00:00Z', 'previous'),
    ];

    expect(getRollbackHistoryEntries(entries).map(entry => entry.id)).toEqual([2, 1]);
  });

  it('rejects incomplete and legacy single-source entries', () => {
    const current = historyEntry(5, '2025-05-01T00:00:00Z', 'current');
    const entries = [
      current,
      historyEntry(4, '2025-04-01T00:00:00Z', '', {}),
      historyEntry(3, '2025-03-01T00:00:00Z', 'missing-source', { source: undefined }),
      historyEntry(2, '', 'missing-time'),
      historyEntry(1, 'not-a-date', 'invalid-time'),
    ];

    expect(getRollbackHistoryEntries(entries)).toEqual([]);
  });

  it('keeps complete multi-source snapshots with aligned revisions', () => {
    const sources = [source, { ...source, repoURL: 'https://github.com/example/values.git' }];
    const current = historyEntry(3, '2025-03-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['current-app', 'current-values'],
      source: undefined,
      sources,
    });
    const previous = historyEntry(2, '2025-02-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['previous-app', 'previous-values'],
      source: undefined,
      sources,
    });

    expect(getRollbackHistoryEntries([previous, current])).toEqual([previous]);
  });

  it('accepts a complete one-item sources snapshot', () => {
    const pluralSource = [{ ...source }];
    const current = historyEntry(3, '2025-03-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['current'],
      source: undefined,
      sources: pluralSource,
    });
    const previous = historyEntry(2, '2025-02-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['previous'],
      source: undefined,
      sources: pluralSource,
    });

    expect(getRollbackHistoryEntries([previous, current])).toEqual([previous]);
  });

  it('uses each historical source shape instead of the current Application source count', () => {
    const currentSources = [
      source,
      { ...source, repoURL: 'https://github.com/example/values.git' },
    ];
    const current = historyEntry(3, '2025-03-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['current-app', 'current-values'],
      source: undefined,
      sources: currentSources,
    });
    const previous = historyEntry(2, '2025-02-01T00:00:00Z', 'previous', {
      source,
    });

    expect(getRollbackHistoryEntries([previous, current])).toEqual([previous]);
  });

  it('rejects multi-source entries with missing or mismatched data', () => {
    const sources = [source, { ...source, repoURL: 'https://github.com/example/values.git' }];
    const current = historyEntry(4, '2025-04-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['current-app', 'current-values'],
      source: undefined,
      sources,
    });
    const mismatched = historyEntry(3, '2025-03-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['only-one'],
      source: undefined,
      sources,
    });
    const missingSource = historyEntry(2, '2025-02-01T00:00:00Z', '', {
      revision: undefined,
      revisions: ['app', 'values'],
      source: undefined,
      sources: [source],
    });

    expect(getRollbackHistoryEntries([current, mismatched, missingSource])).toEqual([]);
  });

  it('deduplicates history IDs while preserving the newest record', () => {
    const current = historyEntry(3, '2025-03-01T00:00:00Z', 'current');
    const newestDuplicate = historyEntry(2, '2025-02-02T00:00:00Z', 'newer-duplicate');
    const olderDuplicate = historyEntry(2, '2025-02-01T00:00:00Z', 'older-duplicate');

    expect(
      getRollbackHistoryEntries([olderDuplicate, current, newestDuplicate]).map(
        entry => entry.revision
      )
    ).toEqual(['newer-duplicate']);
  });

  it('exposes rollback and operation state through ArgoApplication getters', () => {
    const app = new ArgoApplication({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: { name: 'guestbook', namespace: 'argocd', uid: 'guestbook-uid' },
      spec: {
        project: 'default',
        source,
        destination: {},
        syncPolicy: { automated: { enabled: false } },
      },
      operation: { sync: {} },
      status: {
        history: [
          historyEntry(2, '2025-02-01T00:00:00Z', 'current'),
          historyEntry(1, '2025-01-01T00:00:00Z', 'previous'),
        ],
      },
    } as KubeArgoApplication);

    expect(app.isAutomatedSyncEnabled).toBe(false);
    expect(app.hasActiveOperation).toBe(true);
    expect(app.rollbackHistory.map(entry => entry.revision)).toEqual(['previous']);
  });
});
