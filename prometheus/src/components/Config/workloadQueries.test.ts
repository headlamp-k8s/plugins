import { getWorkloadQueries } from './workloadQueries';

function matcher(kind: Parameters<typeof getWorkloadQueries>[0], name: string) {
  const query = getWorkloadQueries(kind, 'apps', name).cpuQuery;
  const match = query.match(/pod=~("(?:\\.|[^"\\])*")/);
  if (!match) throw new Error('Missing Pod matcher');
  return new RegExp(`^(?:${JSON.parse(match[1])})$`);
}

function encodedHash(decimal: string) {
  return [...decimal].map(digit => '456789bcdf'[Number(digit)]).join('');
}

function deploymentPod(name: string, decimal: string) {
  return `${`${name}-${encodedHash(decimal)}-`.slice(0, 58)}bcdfg`;
}

describe('workload metric queries', () => {
  it.each(['Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet'] as const)(
    'preserves non-empty-container filters for %s memory/CPU/filesystem but not Pod-level network metrics',
    kind => {
      const queries = getWorkloadQueries(kind, 'apps', 'web');
      for (const query of [
        queries.cpuQuery,
        queries.memoryQuery,
        queries.filesystemReadQuery,
        queries.filesystemWriteQuery,
      ])
        expect(query).toContain("container!=''");
      expect(queries.networkRxQuery).not.toContain("container!=''");
      expect(queries.networkTxQuery).not.toContain("container!=''");
    }
  );
  it.each([
    {
      kind: 'Deployment',
      own: ['web-6d7f8b9b6c-bcdfg', 'web-7c8f6bb995-hjklm'],
      unrelated: ['web-api-6d7f8b9b6c-bcdfg', 'web-0', 'web-bcdfg'],
    },
    {
      kind: 'StatefulSet',
      own: ['web-0', 'web-12'],
      unrelated: ['web-api-0', 'web-0-extra', 'web-bcdfg'],
    },
    {
      kind: 'DaemonSet',
      own: ['web-bcdfg', 'web-hjklm'],
      unrelated: ['web-api-bcdfg', 'web-bcdfg-extra', 'web-6d7f8b9b6c-bcdfg'],
    },
    {
      kind: 'ReplicaSet',
      own: ['web-bcdfg', 'web-hjklm'],
      unrelated: ['web-api-bcdfg', 'web-bcdfg-extra', 'web-6d7f8b9b6c-bcdfg'],
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

  it.each(['Deployment', 'DaemonSet', 'ReplicaSet'] as const)(
    'excludes cross-kind and standalone Pod collisions from %s totals',
    kind => {
      const pattern = matcher(kind, 'web');
      expect(pattern.test('web-api-bcdfg')).toBe(false);
      expect(pattern.test('web-admin')).toBe(false);
      expect(pattern.test('web-6d7f8b9b6c-admin')).toBe(false);
    }
  );

  it('rejects invalid Deployment hash characters in full and truncated alternatives', () => {
    const name = 'w'.repeat(48);
    const pattern = matcher('Deployment', name);
    expect(pattern.test(`${name}-bcdf-bcdfg`)).toBe(true);
    expect(pattern.test(`${name}-6d7f8b9b6bcdfg`)).toBe(true);
    for (const invalid of ['g', '2', 'a', '0']) {
      expect(pattern.test(`${name}-${invalid}cdf-bcdfg`)).toBe(false);
      expect(pattern.test(`${name}-${invalid}d7f8b9b6bcdfg`)).toBe(false);
    }
  });

  it('accepts encoded uint32 values without leading zeros and rejects out-of-range values', () => {
    const pattern = matcher('Deployment', 'web');
    for (const decimal of [
      '0',
      '1',
      '10',
      '1000000000',
      '2147483647',
      '3999999999',
      '4294967294',
      '4294967295',
    ]) {
      expect(pattern.test(deploymentPod('web', decimal)), decimal).toBe(true);
    }
    for (const decimal of ['00', '010', '0429496729', '4294967296', '5000000000', '9999999999']) {
      expect(pattern.test(deploymentPod('web', decimal)), decimal).toBe(false);
    }
    expect(pattern.test('web-454-bcdfg')).toBe(false);
    expect(pattern.test('web-ffffffffff-bcdfg')).toBe(false);
  });

  it('restricts truncated Deployment hashes to prefixes of valid uint32 encodings', () => {
    const ten = 'w'.repeat(47);
    expect(matcher('Deployment', ten).test(deploymentPod(ten, '4294967295'))).toBe(true);
    expect(matcher('Deployment', ten).test(deploymentPod(ten, '4294967296'))).toBe(false);
    const nine = 'w'.repeat(48);
    expect(matcher('Deployment', nine).test(deploymentPod(nine, '999999999'))).toBe(true);
    expect(matcher('Deployment', nine).test(deploymentPod(nine, '4294967295'))).toBe(true);
    expect(matcher('Deployment', nine).test(deploymentPod(nine, '0100000000'))).toBe(false);
    const one = 'w'.repeat(56);
    expect(matcher('Deployment', one).test(deploymentPod(one, '0'))).toBe(true);
    expect(matcher('Deployment', one).test(deploymentPod(one, '9'))).toBe(true);
  });

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
        for (const hash of ['6d7f8b9b6c', '7c8f6bb99', 'bcdf']) {
          const controller = kind === 'Deployment' ? `${name}-${hash}` : name;
          const pod = `${`${controller}-`.slice(0, 58)}bcdfg`;
          expect(pattern.test(pod), `${kind}: ${pod}`).toBe(true);
        }
      }
    }
  );
});
