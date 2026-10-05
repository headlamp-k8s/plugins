/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';
import {
  getFailedProjectClusters,
  getProjectApplicationCounts,
  getProjectApplications,
} from './GitOps';

function application(overrides: Record<string, unknown> = {}) {
  const value = {
    cluster: 'cluster-a',
    metadata: { namespace: 'argocd', name: 'guestbook' },
    spec: { destination: { name: 'in-cluster', namespace: 'team-a' } },
    syncStatus: 'Synced',
    healthStatus: 'Healthy',
    ...overrides,
  };
  return value as any;
}

const project = { id: 'project', clusters: ['cluster-a', 'cluster-b'], namespaces: ['team-a'] };

describe('Headlamp Project Argo CD matching', () => {
  it('includes only exact local cluster and explicit destination namespace matches', () => {
    const local = application();
    const remote = application({
      spec: { destination: { server: 'https://remote', namespace: 'team-a' } },
    });
    const missingNamespace = application({ spec: { destination: { name: 'in-cluster' } } });
    const wrongCluster = application({ cluster: 'cluster-c' });
    const storedOnly = application({
      spec: { destination: { name: 'in-cluster', namespace: 'other' } },
    });

    expect(
      getProjectApplications([local, remote, missingNamespace, wrongCluster, storedOnly], project)
    ).toEqual([local]);
  });

  it('rejects destinations that mix a local identifier with a remote identifier', () => {
    const local = application();
    const localNameWithRemoteServer = application({
      metadata: { namespace: 'argocd', name: 'remote-server' },
      spec: { destination: { name: 'in-cluster', server: 'https://remote', namespace: 'team-a' } },
    });
    const localServerWithRemoteName = application({
      metadata: { namespace: 'argocd', name: 'remote-name' },
      spec: {
        destination: {
          server: 'https://kubernetes.default.svc',
          name: 'remote-cluster',
          namespace: 'team-a',
        },
      },
    });

    expect(
      getProjectApplications([local, localNameWithRemoteServer, localServerWithRemoteName], project)
    ).toEqual([local]);
  });

  it('keeps identical names on different Project clusters separate', () => {
    const first = application();
    const second = application({ cluster: 'cluster-b' });
    expect(getProjectApplications([first, second], project)).toHaveLength(2);
  });

  it('counts missing or unknown status as needing attention', () => {
    expect(
      getProjectApplicationCounts([
        application(),
        application({ metadata: { namespace: 'argocd', name: 'warning' }, syncStatus: 'Unknown' }),
      ])
    ).toEqual({ total: 2, synced: 1, healthy: 2, needsAttention: 1 });
  });

  it('detects partial and total cluster failures from missing result entries', () => {
    expect(
      getFailedProjectClusters(project.clusters, { 'cluster-a': { items: [application()] } }, [{}])
    ).toEqual(['cluster-b']);
    expect(getFailedProjectClusters(project.clusters, {}, [{}])).toEqual([
      'cluster-a',
      'cluster-b',
    ]);
  });

  it('detects explicit cluster errors and the legacy all-failed response', () => {
    expect(
      getFailedProjectClusters(
        project.clusters,
        {
          'cluster-a': { items: [] },
          'cluster-b': { errors: [new Error('forbidden')] },
        },
        null
      )
    ).toEqual(['cluster-b']);
    expect(getFailedProjectClusters(project.clusters, undefined, [new Error('forbidden')])).toEqual(
      project.clusters
    );
  });
});
