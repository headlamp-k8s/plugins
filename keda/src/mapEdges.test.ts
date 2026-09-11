import { describe, expect, it } from 'vitest';
import { findAuthenticationEdges, makeKubeToKubeEdge } from './mapEdges';
import type { ClusterTriggerAuthentication } from './resources/clusterTriggerAuthentication';
import type { ScaledObject } from './resources/scaledobject';
import type { TriggerAuthentication } from './resources/triggerAuthentication';

/**
 * findAuthenticationEdges only reads metadata and spec.triggers, so fixtures are
 * plain objects rather than real KubeObjects. Building actual instances would
 * pull in the cluster request layer for no added coverage.
 */
function scaledObject(namespace: string, uid: string, triggers: any[]): ScaledObject {
  return {
    metadata: { name: 'so', namespace, uid },
    spec: { triggers },
  } as unknown as ScaledObject;
}

function auth(namespace: string, name: string, uid: string): TriggerAuthentication {
  return { metadata: { name, namespace, uid } } as unknown as TriggerAuthentication;
}

function clusterAuth(name: string, uid: string): ClusterTriggerAuthentication {
  return { metadata: { name, uid } } as unknown as ClusterTriggerAuthentication;
}

describe('makeKubeToKubeEdge', () => {
  it('derives the edge id from both uids so it is stable across renders', () => {
    const from = { metadata: { uid: 'uid-a' } };
    const to = { metadata: { uid: 'uid-b' } };

    expect(makeKubeToKubeEdge(from, to)).toEqual({
      id: 'uid-a-uid-b',
      source: 'uid-a',
      target: 'uid-b',
    });
  });
});

describe('findAuthenticationEdges', () => {
  it('links a trigger to a TriggerAuthentication in the same namespace', () => {
    const source = scaledObject('team-a', 'so-uid', [
      { type: 'cron', authenticationRef: { name: 'creds' } },
    ]);

    const edges = findAuthenticationEdges(source, [auth('team-a', 'creds', 'auth-uid')], []);

    expect(edges).toEqual([{ id: 'so-uid-auth-uid', source: 'so-uid', target: 'auth-uid' }]);
  });

  it('does not link a TriggerAuthentication of the same name in another namespace', () => {
    const source = scaledObject('team-a', 'so-uid', [
      { type: 'cron', authenticationRef: { name: 'creds' } },
    ]);

    // Same name, different namespace: namespaced refs must not cross namespaces.
    const edges = findAuthenticationEdges(source, [auth('team-b', 'creds', 'auth-uid')], []);

    expect(edges).toEqual([]);
  });

  it('treats a missing kind as TriggerAuthentication, matching KEDA default', () => {
    const source = scaledObject('team-a', 'so-uid', [
      { type: 'cron', authenticationRef: { name: 'creds' } },
    ]);

    // A cluster-scoped object of the same name must not satisfy an unqualified ref.
    const edges = findAuthenticationEdges(source, [], [clusterAuth('creds', 'cluster-uid')]);

    expect(edges).toEqual([]);
  });

  it('matches a ClusterTriggerAuthentication on name alone, ignoring namespace', () => {
    const source = scaledObject('team-a', 'so-uid', [
      {
        type: 'cron',
        authenticationRef: { name: 'shared', kind: 'ClusterTriggerAuthentication' },
      },
    ]);

    const edges = findAuthenticationEdges(source, [], [clusterAuth('shared', 'cluster-uid')]);

    expect(edges).toEqual([{ id: 'so-uid-cluster-uid', source: 'so-uid', target: 'cluster-uid' }]);
  });

  it('skips a reference that resolves to nothing', () => {
    const source = scaledObject('team-a', 'so-uid', [
      { type: 'cron', authenticationRef: { name: 'missing' } },
    ]);

    const edges = findAuthenticationEdges(source, [auth('team-a', 'other', 'auth-uid')], []);

    expect(edges).toEqual([]);
  });

  it('skips triggers that carry no authenticationRef', () => {
    const source = scaledObject('team-a', 'so-uid', [{ type: 'cron' }]);

    const edges = findAuthenticationEdges(source, [auth('team-a', 'creds', 'auth-uid')], []);

    expect(edges).toEqual([]);
  });

  it('returns one edge per resolving trigger', () => {
    const source = scaledObject('team-a', 'so-uid', [
      { type: 'cron', authenticationRef: { name: 'first' } },
      { type: 'kafka', authenticationRef: { name: 'second' } },
    ]);

    const edges = findAuthenticationEdges(
      source,
      [auth('team-a', 'first', 'uid-1'), auth('team-a', 'second', 'uid-2')],
      []
    );

    expect(edges).toHaveLength(2);
    expect(edges.map(edge => edge.target)).toEqual(['uid-1', 'uid-2']);
  });

  it('returns no edges when the object has no triggers', () => {
    const source = scaledObject('team-a', 'so-uid', undefined as any);

    expect(findAuthenticationEdges(source, [auth('team-a', 'creds', 'auth-uid')], [])).toEqual([]);
  });

  it('returns no edges while the authentication lists are still loading', () => {
    const source = scaledObject('team-a', 'so-uid', [
      { type: 'cron', authenticationRef: { name: 'creds' } },
    ]);

    // useList returns null before the first response resolves.
    expect(findAuthenticationEdges(source, null as any, [])).toEqual([]);
    expect(findAuthenticationEdges(source, [], null as any)).toEqual([]);
  });
});
