import { clusterNamespaces, clusterNamesInNamespace, KafkaClusterRef } from './clusters';

const clusters: KafkaClusterRef[] = [
  { metadata: { namespace: 'prod', name: 'orders' } },
  { metadata: { namespace: 'prod', name: 'billing' } },
  { metadata: { namespace: 'dev', name: 'sandbox' } },
];

describe('clusterNamespaces', () => {
  it('returns unique namespaces sorted alphabetically', () => {
    expect(clusterNamespaces(clusters)).toEqual(['dev', 'prod']);
  });

  it('returns an empty array when the list is still loading (null)', () => {
    expect(clusterNamespaces(null)).toEqual([]);
  });

  it('ignores clusters without a namespace', () => {
    expect(clusterNamespaces([{ metadata: { name: 'orphan' } }])).toEqual([]);
  });
});

describe('clusterNamesInNamespace', () => {
  it('returns sorted cluster names within the namespace', () => {
    expect(clusterNamesInNamespace(clusters, 'prod')).toEqual(['billing', 'orders']);
  });

  it('returns an empty array when the list is still loading (null)', () => {
    expect(clusterNamesInNamespace(null, 'prod')).toEqual([]);
  });

  it('returns an empty array when no namespace is selected', () => {
    expect(clusterNamesInNamespace(clusters, '')).toEqual([]);
  });
});
