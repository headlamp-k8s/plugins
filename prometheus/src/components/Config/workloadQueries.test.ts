import { getWorkloadQueries } from './workloadQueries';

function matcher(kind: Parameters<typeof getWorkloadQueries>[0], name: string) {
  const query = getWorkloadQueries(kind, 'apps', name).cpuQuery;
  const match = query.match(/pod=~("(?:\\.|[^"\\])*")/);
  if (!match) throw new Error('Missing Pod matcher');
  return new RegExp(`^(?:${JSON.parse(match[1])})$`);
}

describe('workload metric queries', () => {
  it.each([
    {
      kind: 'Deployment',
      own: ['web-6d7f8b9b6c-abcde', 'web-7c8f6bb995-fghjk'],
      unrelated: ['web-api-6d7f8b9b6c-abcde', 'web-0', 'web-abcde'],
    },
    {
      kind: 'StatefulSet',
      own: ['web-0', 'web-12'],
      unrelated: ['web-api-0', 'web-0-extra', 'web-abcde'],
    },
    {
      kind: 'DaemonSet',
      own: ['web-abcde', 'web-fghjk'],
      unrelated: ['web-api-abcde', 'web-abcde-extra', 'web-6d7f8b9b6c-abcde'],
    },
    {
      kind: 'ReplicaSet',
      own: ['web-abcde', 'web-fghjk'],
      unrelated: ['web-api-abcde', 'web-abcde-extra', 'web-6d7f8b9b6c-abcde'],
    },
  ] as const)(
    'selects $kind Pods without matching longer workload names',
    ({ kind, own, unrelated }) => {
      const pattern = matcher(kind, 'web');
      own.forEach(pod => expect(pattern.test(pod)).toBe(true));
      unrelated.forEach(pod => expect(pattern.test(pod)).toBe(false));
      for (const query of Object.values(getWorkloadQueries(kind, 'apps', 'web'))) {
        expect(query).toContain('namespace="apps"');
        expect(query).toMatch(/\) by \(namespace\)$/);
        expect(query).not.toContain('by (pod');
      }
    }
  );

  it('escapes dots in names as literals in the PromQL regex string', () => {
    const pattern = matcher('StatefulSet', 'web.api');
    expect(pattern.test('web.api-0')).toBe(true);
    expect(pattern.test('webXapi-0')).toBe(false);
    expect(pattern.test('web.api-extra-0')).toBe(false);
  });

  it.each(['Deployment', 'DaemonSet', 'ReplicaSet'] as const)(
    'matches generated Pods for long %s names after Kubernetes prefix truncation',
    kind => {
      for (const length of [45, 46, 47, 48, 55, 56, 57, 58, 60, 63]) {
        const name = 'w'.repeat(length);
        const pattern = matcher(kind, name);
        for (const hash of ['bcdfghjklm', 'bcdfghjkl', 'bcdf']) {
          const controller = kind === 'Deployment' ? `${name}-${hash}` : name;
          const pod = `${`${controller}-`.slice(0, 58)}abcde`;
          expect(pattern.test(pod), `${kind}: ${pod}`).toBe(true);
        }
      }
    }
  );
});
