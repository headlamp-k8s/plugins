import { VolcanoNamespaceQueue } from '../resources/namespacequeue';
import {
  getChildNamespaceQueues,
  hasNamespaceQueue,
  resolveNamespaceQueueParent,
} from './namespaceQueueRelationships';

function namespaceQueue(name: string, namespace: string, parent?: string) {
  return { metadata: { name, namespace }, spec: { parent } } as unknown as VolcanoNamespaceQueue;
}

describe('resolveNamespaceQueueParent', () => {
  it('resolves cluster/<name> to a cluster Queue', () => {
    expect(resolveNamespaceQueueParent('team-a', 'cluster/default')).toEqual({
      kind: 'queue',
      name: 'default',
    });
  });

  it('resolves an unprefixed parent to a NamespaceQueue in the same namespace', () => {
    expect(resolveNamespaceQueueParent('team-a', 'platform')).toEqual({
      kind: 'namespacequeue',
      namespace: 'team-a',
      name: 'platform',
    });
  });

  it('returns null for an empty or malformed parent', () => {
    expect(resolveNamespaceQueueParent('team-a', undefined)).toBeNull();
    expect(resolveNamespaceQueueParent('team-a', '')).toBeNull();
    expect(resolveNamespaceQueueParent('team-a', 'cluster/')).toBeNull();
    expect(resolveNamespaceQueueParent('team-a', 'cluster/a/b')).toBeNull();
    expect(resolveNamespaceQueueParent('team-a', 'other/queue')).toBeNull();
    expect(resolveNamespaceQueueParent('', 'platform')).toBeNull();
  });
});

describe('hasNamespaceQueue', () => {
  const namespaceQueues = [
    namespaceQueue('team-a', 'default', 'cluster/default'),
    namespaceQueue('team-a', 'other', 'cluster/default'),
  ];

  it('finds a NamespaceQueue by namespace and name', () => {
    expect(hasNamespaceQueue(namespaceQueues, 'default', 'team-a')).toBe(true);
    expect(hasNamespaceQueue(namespaceQueues, 'other', 'team-a')).toBe(true);
  });

  it('does not match a missing name or the same name in another namespace', () => {
    expect(hasNamespaceQueue(namespaceQueues, 'default', 'missing')).toBe(false);
    expect(hasNamespaceQueue(namespaceQueues, 'third', 'team-a')).toBe(false);
  });

  it('returns false while the list is not loaded', () => {
    expect(hasNamespaceQueue(null, 'default', 'team-a')).toBe(false);
    expect(hasNamespaceQueue(undefined, 'default', 'team-a')).toBe(false);
  });
});

describe('getChildNamespaceQueues', () => {
  const namespaceQueues = [
    namespaceQueue('a', 'team-a', 'cluster/research'),
    namespaceQueue('b', 'team-b', 'cluster/research'),
    namespaceQueue('c', 'team-a', 'cluster/other'),
    // Unprefixed parents point at a NamespaceQueue, even when it is named like a cluster Queue.
    namespaceQueue('d', 'team-a', 'research'),
    namespaceQueue('e', 'team-a', undefined),
  ];

  it('returns only NamespaceQueues whose parent is the cluster Queue', () => {
    expect(
      getChildNamespaceQueues('research', namespaceQueues).map(item => item.metadata.name)
    ).toEqual(['a', 'b']);
  });

  it('returns an empty list when there are no matches or no data', () => {
    expect(getChildNamespaceQueues('missing', namespaceQueues)).toEqual([]);
    expect(getChildNamespaceQueues('research', null)).toEqual([]);
    expect(getChildNamespaceQueues('research', undefined)).toEqual([]);
  });
});
