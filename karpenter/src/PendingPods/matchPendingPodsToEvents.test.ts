import { describe, expect, it } from 'vitest';
import { matchPendingPodsToEvents } from './matchPendingPodsToEvents';

function pod(namespace: string, name: string) {
  const metadata = {
    name,
    namespace,
    uid: `${namespace}-${name}-uid`,
    creationTimestamp: '2026-01-01T00:00:00Z',
  };
  return { jsonData: { metadata }, metadata };
}

function event(namespace: string, name: string, message: string) {
  return {
    involvedObject: { kind: 'Pod', namespace, name },
    reason: 'FailedScheduling',
    type: 'Warning',
    message,
    source: { component: 'default-scheduler' },
    count: 1,
    lastOccurrence: '2026-01-01T00:01:00Z',
    firstOccurrence: '2026-01-01T00:01:00Z',
  };
}

describe('matchPendingPodsToEvents', () => {
  it('keeps pods with the same name in different namespaces apart', () => {
    const result = matchPendingPodsToEvents(
      [pod('team-a', 'web'), pod('team-b', 'web')],
      [event('team-a', 'web', 'node selector mismatch'), event('team-b', 'web', 'Insufficient cpu')]
    );

    expect(result.map(p => [p.namespace, p.name, p.message])).toEqual([
      ['team-a', 'web', 'node selector mismatch'],
      ['team-b', 'web', 'Insufficient cpu'],
    ]);
  });

  it('does not attach an event to a same-named pod in another namespace', () => {
    const result = matchPendingPodsToEvents(
      [pod('team-a', 'web')],
      [event('team-b', 'web', 'Insufficient cpu')]
    );

    expect(result).toEqual([]);
  });
});
