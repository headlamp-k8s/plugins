import { describe, expect, it } from 'vitest';
import { buildDependsOnEdges } from './mapDependencies';

function obj(
  name: string,
  namespace: string,
  dependsOn?: { name: string; namespace?: string }[],
  cluster?: string
) {
  return {
    cluster,
    metadata: {
      uid: cluster ? `${cluster}:${namespace}-${name}` : `${namespace}-${name}`,
      name,
      namespace,
    },
    jsonData: { spec: dependsOn ? { dependsOn } : {} },
  };
}

const pairs = (edges: { source: string; target: string }[]) =>
  edges.map(e => `${e.source}>${e.target}`).sort();

describe('buildDependsOnEdges', () => {
  it('returns no edges when nothing declares dependsOn', () => {
    expect(buildDependsOnEdges([obj('a', 'flux-system'), obj('b', 'flux-system')])).toEqual([]);
  });

  it('draws a labelled edge from the dependent to its dependency', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'flux-system', [{ name: 'infra' }]),
      obj('infra', 'flux-system'),
    ]);
    expect(edges).toEqual([
      {
        id: 'flux-system-app-flux-system-infra-depends-on',
        source: 'flux-system-app',
        target: 'flux-system-infra',
        label: 'depends on',
      },
    ]);
  });

  it('follows a chain', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'ns', [{ name: 'infra' }]),
      obj('infra', 'ns', [{ name: 'crds' }]),
      obj('crds', 'ns'),
    ]);
    expect(pairs(edges)).toEqual(['ns-app>ns-infra', 'ns-infra>ns-crds']);
  });

  it('handles a diamond', () => {
    const edges = buildDependsOnEdges([
      obj('top', 'ns', [{ name: 'left' }, { name: 'right' }]),
      obj('left', 'ns', [{ name: 'base' }]),
      obj('right', 'ns', [{ name: 'base' }]),
      obj('base', 'ns'),
    ]);
    expect(pairs(edges)).toEqual([
      'ns-left>ns-base',
      'ns-right>ns-base',
      'ns-top>ns-left',
      'ns-top>ns-right',
    ]);
  });

  it('defaults the reference namespace to the namespace of the dependent', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'team-a', [{ name: 'infra' }]),
      obj('infra', 'team-a'),
      obj('infra', 'team-b'),
    ]);
    expect(pairs(edges)).toEqual(['team-a-app>team-a-infra']);
  });

  it('treats an empty reference namespace as the namespace of the dependent', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'team-a', [{ name: 'infra', namespace: '' }]),
      obj('infra', 'team-a'),
      obj('infra', 'team-b'),
    ]);
    expect(pairs(edges)).toEqual(['team-a-app>team-a-infra']);
  });

  it('keeps objects with the same namespace and name in different clusters apart', () => {
    const edges = buildDependsOnEdges([
      obj('infra', 'flux-system', undefined, 'a'),
      obj('app', 'flux-system', [{ name: 'infra' }], 'a'),
      obj('infra', 'flux-system', undefined, 'b'),
      obj('app', 'flux-system', [{ name: 'infra' }], 'b'),
    ]);
    expect(pairs(edges)).toEqual([
      'a:flux-system-app>a:flux-system-infra',
      'b:flux-system-app>b:flux-system-infra',
    ]);
  });

  it('does not link to a dependency that only exists in another cluster', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'flux-system', [{ name: 'infra' }], 'a'),
      obj('infra', 'flux-system', undefined, 'b'),
    ]);
    expect(edges).toEqual([]);
  });

  it('resolves references to another namespace', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'team-a', [{ name: 'infra', namespace: 'flux-system' }]),
      obj('infra', 'flux-system'),
      obj('infra', 'team-a'),
    ]);
    expect(pairs(edges)).toEqual(['team-a-app>flux-system-infra']);
  });

  it('ignores a dependency that does not exist', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'ns', [{ name: 'missing' }, { name: 'infra', namespace: 'other' }]),
      obj('infra', 'ns'),
    ]);
    expect(edges).toEqual([]);
  });

  it('ignores a reference to itself', () => {
    expect(buildDependsOnEdges([obj('app', 'ns', [{ name: 'app' }])])).toEqual([]);
  });

  it('ignores references without a name', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'ns', [{ name: '' }, null as any]),
      obj('infra', 'ns'),
    ]);
    expect(edges).toEqual([]);
  });

  it('does not repeat an edge for a duplicated reference', () => {
    const edges = buildDependsOnEdges([
      obj('app', 'ns', [{ name: 'infra' }, { name: 'infra', namespace: 'ns' }]),
      obj('infra', 'ns'),
    ]);
    expect(edges).toHaveLength(1);
  });

  it('returns both edges of a cycle without looping', () => {
    const edges = buildDependsOnEdges([
      obj('a', 'ns', [{ name: 'b' }]),
      obj('b', 'ns', [{ name: 'a' }]),
    ]);
    expect(pairs(edges)).toEqual(['ns-a>ns-b', 'ns-b>ns-a']);
  });
});
