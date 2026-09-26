import { describe, expect, it } from 'vitest';
import { EmbeddedGraph } from './graphData';
import { makeGraphSource, toGraphElements } from './toGraphSource';

const kubeObject = { kind: 'Deployment', metadata: { uid: 'uid-1', name: 'web' } } as any;

const graph: EmbeddedGraph = {
  nodes: [
    {
      id: 'uid-1',
      label: 'web',
      subtitle: 'Deployment',
      icon: 'mdi:layers-triple',
      status: 'success',
      kubeObject,
    },
    {
      id: 'template-root',
      label: 'webapp',
      subtitle: 'ResourceGraphDefinition',
      icon: 'mdi:graph-outline',
    },
  ],
  edges: [{ id: 'kro-owns-uid-1', source: 'template-root', target: 'uid-1', label: 'owns' }],
};

describe('toGraphElements', () => {
  it('emits kubeObject nodes without label overrides', () => {
    const { nodes } = toGraphElements(graph);
    expect(nodes[0]).toEqual({ id: 'uid-1', kubeObject, status: 'success' });
  });

  it('emits synthetic nodes with label, subtitle, and a rendered icon', () => {
    const { nodes } = toGraphElements(graph);
    expect(nodes[1]).toMatchObject({
      id: 'template-root',
      label: 'webapp',
      subtitle: 'ResourceGraphDefinition',
      status: undefined,
    });
    // Iconify string becomes a ReactNode at this boundary.
    expect((nodes[1].icon as any)?.props?.icon).toBe('mdi:graph-outline');
  });

  it('maps edges one to one', () => {
    const { edges } = toGraphElements(graph);
    expect(edges).toEqual([
      { id: 'kro-owns-uid-1', source: 'template-root', target: 'uid-1', label: 'owns' },
    ]);
  });
});

describe('makeGraphSource', () => {
  it('returns a stable elements object from useData', () => {
    const elements = toGraphElements(graph);
    const source = makeGraphSource('kro-embedded-test', 'Test', elements);
    expect(source.id).toBe('kro-embedded-test');
    expect(source.label).toBe('Test');
    // The host stores useData's return value in state and reloads on
    // identity change — repeated calls must return the same reference.
    const useData = (source as any).useData;
    expect(useData()).toBe(elements);
    expect(useData()).toBe(useData());
  });
});
