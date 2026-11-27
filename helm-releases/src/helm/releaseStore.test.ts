/*
 * Copyright 2026 The Kubernetes Authors
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
import { releaseSecret, secretList } from '../test/fixtures';
import {
  accessErrorKind,
  HelmAccessError,
  HelmTransport,
  listReleases,
  listRevisions,
  ListSecretsRequest,
} from './releaseStore';

const CLUSTER = 'taz-ops-int-51';

function apiError(status: number) {
  // Headlamp rejects with the HTTP status and the message of the API server.
  return Object.assign(new Error(`Forbidden - secrets is forbidden: User "jane" cannot list`), {
    status,
  });
}

function fakeTransport(answer: (request: ListSecretsRequest) => unknown) {
  const requests: ListSecretsRequest[] = [];
  const transport: HelmTransport = {
    async listSecrets(request) {
      requests.push(request);
      const response = answer(request);
      if (response instanceof Error) throw response;
      return response;
    },
  };
  return { transport, requests };
}

async function failureOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as HelmAccessError;
  }
  throw new Error('the read succeeded');
}

describe('listReleases on the whole cluster', () => {
  it('lists the current revision of every release, sorted like helm ls -A', async () => {
    const { transport, requests } = fakeTransport(() =>
      secretList([
        releaseSecret({ namespace: 'team-b', name: 'api', revision: 2 }),
        releaseSecret({ namespace: 'team-a', name: 'web', revision: 5 }),
        releaseSecret({ namespace: 'team-a', name: 'cache', revision: 1 }),
      ])
    );

    const result = await listReleases(transport, CLUSTER, []);

    expect(result.releases.map(release => `${release.namespace}/${release.name}`)).toEqual([
      'team-a/cache',
      'team-a/web',
      'team-b/api',
    ]);
    expect(result.releases[1]).toMatchObject({
      revision: 5,
      status: 'deployed',
      chartName: 'web',
      chartVersion: '1.2.3',
      appVersion: '4.5.6',
    });
    expect(result).toMatchObject({ clusterWideDenied: false, unreadable: 0 });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      cluster: CLUSTER,
      namespace: undefined,
      labelSelector: 'owner=helm,status!=superseded',
    });
  });

  it('does not keep the values nor the manifest of the listed releases', async () => {
    const { transport } = fakeTransport(() => secretList([releaseSecret()]));

    const [release] = (await listReleases(transport, CLUSTER, [])).releases;

    expect(release).not.toHaveProperty('userValues');
    expect(release).not.toHaveProperty('manifest');
  });

  it('follows the pages of the API', async () => {
    const { transport, requests } = fakeTransport(request =>
      request.continueToken === 'next'
        ? secretList([releaseSecret({ name: 'second' })])
        : secretList([releaseSecret({ name: 'first' })], 'next')
    );

    const result = await listReleases(transport, CLUSTER, []);

    expect(result.releases.map(release => release.name)).toEqual(['first', 'second']);
    expect(requests.map(request => request.continueToken)).toEqual([undefined, 'next']);
  });

  it('keeps the highest revision when a failed upgrade sits on top of a deployed one', async () => {
    const { transport } = fakeTransport(() =>
      secretList([
        releaseSecret({ revision: 3, status: 'deployed' }),
        releaseSecret({ revision: 4, status: 'failed' }),
      ])
    );

    const result = await listReleases(transport, CLUSTER, []);

    expect(result.releases).toHaveLength(1);
    expect(result.releases[0]).toMatchObject({ revision: 4, status: 'failed' });
  });

  it('skips the Secrets that are not Helm releases and counts the unreadable ones', async () => {
    const corrupted = { ...releaseSecret({ name: 'broken' }), data: { release: '%%%' } };
    const foreign = { ...releaseSecret({ name: 'other' }), type: 'Opaque' };
    const { transport } = fakeTransport(() => secretList([releaseSecret(), corrupted, foreign]));

    const result = await listReleases(transport, CLUSTER, []);

    expect(result.releases.map(release => release.name)).toEqual(['web']);
    expect(result.unreadable).toBe(1);
  });

  it('reports a missing cluster-wide permission instead of failing', async () => {
    const { transport } = fakeTransport(() => apiError(403));

    expect(await listReleases(transport, CLUSTER, [])).toEqual({
      releases: [],
      clusterWideDenied: true,
      deniedNamespaces: [],
      failedNamespaces: [],
      unreadable: 0,
    });
  });

  it('fails on any other error, without the body of the API answer', async () => {
    const { transport } = fakeTransport(() => apiError(500));

    const error = await failureOf(listReleases(transport, CLUSTER, []));

    expect(error).toBeInstanceOf(HelmAccessError);
    expect(error.kind).toBe('unknown');
    expect(error.message).not.toContain('jane');
  });
});

describe('listReleases on selected namespaces', () => {
  it('reads each namespace and tells apart the ones it could not read', async () => {
    const { transport, requests } = fakeTransport(request => {
      if (request.namespace === 'team-b') return apiError(403);
      if (request.namespace === 'team-c') return apiError(503);
      return secretList([releaseSecret({ namespace: request.namespace })]);
    });

    const result = await listReleases(transport, CLUSTER, [
      'team-c',
      'team-a',
      'team-b',
      'team-a',
      'Not_A_Namespace',
    ]);

    expect(result.releases.map(release => release.namespace)).toEqual(['team-a']);
    expect(result.deniedNamespaces).toEqual(['team-b']);
    expect(result.failedNamespaces).toEqual(['team-c']);
    expect(result.clusterWideDenied).toBe(false);
    expect(requests.map(request => request.namespace).sort()).toEqual([
      'team-a',
      'team-b',
      'team-c',
    ]);
  });

  it('never falls back on the whole cluster when no selected namespace is valid', async () => {
    const { transport, requests } = fakeTransport(() => secretList([releaseSecret()]));

    const result = await listReleases(transport, CLUSTER, ['Not_A_Namespace']);

    expect(result.releases).toEqual([]);
    expect(requests).toEqual([]);
  });

  it('fails when the session itself is refused', async () => {
    const { transport } = fakeTransport(() => apiError(401));

    const error = await failureOf(listReleases(transport, CLUSTER, ['team-a']));

    expect(error.kind).toBe('unauthorized');
  });
});

describe('listRevisions', () => {
  it('reads the whole history of the release, the most recent revision first', async () => {
    const { transport, requests } = fakeTransport(() =>
      secretList([
        releaseSecret({ revision: 1, status: 'superseded' }),
        releaseSecret({ revision: 10, status: 'deployed' }),
        releaseSecret({ revision: 2, status: 'superseded' }),
      ])
    );

    const result = await listRevisions(transport, CLUSTER, 'team-a', 'web');

    expect(result.revisions.map(revision => revision.revision)).toEqual([10, 2, 1]);
    expect(result.revisions[0]).toMatchObject({
      userValues: { replicaCount: 2 },
      defaultValues: { replicaCount: 1, image: { tag: 'stable' } },
    });
    expect(requests[0]).toMatchObject({
      cluster: CLUSTER,
      namespace: 'team-a',
      labelSelector: 'owner=helm,name=web',
    });
  });

  it('only keeps the revisions of the requested release', async () => {
    const { transport } = fakeTransport(() =>
      secretList([releaseSecret({ name: 'web' }), releaseSecret({ name: 'web-canary' })])
    );

    const result = await listRevisions(transport, CLUSTER, 'team-a', 'web');

    expect(result.revisions.map(revision => revision.name)).toEqual(['web']);
  });

  it.each([
    ['team-a', 'web,owner!=helm'],
    ['team-a', 'Web'],
    ['team-a/../kube-system', 'web'],
    ['', 'web'],
  ])('refuses the reference %j / %j without any request', async (namespace, name) => {
    const { transport, requests } = fakeTransport(() => secretList([]));

    const error = await failureOf(listRevisions(transport, CLUSTER, namespace, name));

    expect(error.kind).toBe('not-found');
    expect(requests).toEqual([]);
  });

  it('reports a namespace the user cannot read', async () => {
    const { transport } = fakeTransport(() => apiError(403));

    const error = await failureOf(listRevisions(transport, CLUSTER, 'team-a', 'web'));

    expect(error.kind).toBe('forbidden');
  });
});

describe('accessErrorKind', () => {
  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [408, 'timeout'],
    [504, 'timeout'],
    [502, 'unavailable'],
    [503, 'unavailable'],
    [500, 'unknown'],
    [undefined, 'unknown'],
  ])('classifies the status %j as %s', (status, kind) => {
    expect(accessErrorKind({ status })).toBe(kind);
  });

  it('keeps the kind of an already classified error', () => {
    expect(accessErrorKind(new HelmAccessError('timeout'))).toBe('timeout');
  });
});
