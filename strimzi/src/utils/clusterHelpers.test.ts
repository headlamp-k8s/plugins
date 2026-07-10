import { describe, it, expect } from 'vitest';
import { getAvailableNamespaces, getFilteredClusterNames, type ClusterLike } from './clusterHelpers';

describe('clusterHelpers', () => {
  describe('getAvailableNamespaces', () => {
    it('returns empty array when clusters list is null or undefined', () => {
      expect(getAvailableNamespaces(null)).toEqual([]);
      expect(getAvailableNamespaces(undefined)).toEqual([]);
    });

    it('returns empty array when clusters list is empty', () => {
      expect(getAvailableNamespaces([])).toEqual([]);
    });

    it('extracts, deduplicates, and sorts namespaces', () => {
      const mockClusters: ClusterLike[] = [
        { metadata: { name: 'c1', namespace: 'prod' } },
        { metadata: { name: 'c2', namespace: 'dev' } },
        { metadata: { name: 'c3', namespace: 'prod' } },
        { metadata: { name: 'c4', namespace: 'staging' } },
      ];

      expect(getAvailableNamespaces(mockClusters)).toEqual(['dev', 'prod', 'staging']);
    });

    it('ignores empty, missing, or non-string namespaces', () => {
      const mockClusters: ClusterLike[] = [
        { metadata: { name: 'c1', namespace: '' } },
        { metadata: { name: 'c2', namespace: undefined } },
        { metadata: { name: 'c3', namespace: 'prod' } },
      ];

      expect(getAvailableNamespaces(mockClusters)).toEqual(['prod']);
    });
  });

  describe('getFilteredClusterNames', () => {
    it('returns empty array when clusters list is null, undefined, or empty', () => {
      expect(getFilteredClusterNames(null, 'default')).toEqual([]);
      expect(getFilteredClusterNames(undefined, 'default')).toEqual([]);
      expect(getFilteredClusterNames([], 'default')).toEqual([]);
    });

    it('returns empty array when namespace is null, undefined, or empty', () => {
      const mockClusters: ClusterLike[] = [{ metadata: { name: 'c1', namespace: 'prod' } }];
      expect(getFilteredClusterNames(mockClusters, null)).toEqual([]);
      expect(getFilteredClusterNames(mockClusters, undefined)).toEqual([]);
      expect(getFilteredClusterNames(mockClusters, '')).toEqual([]);
    });

    it('filters clusters by namespace and returns sorted names', () => {
      const mockClusters: ClusterLike[] = [
        { metadata: { name: 'cluster-z', namespace: 'prod' } },
        { metadata: { name: 'cluster-a', namespace: 'prod' } },
        { metadata: { name: 'cluster-b', namespace: 'dev' } },
      ];

      expect(getFilteredClusterNames(mockClusters, 'prod')).toEqual(['cluster-a', 'cluster-z']);
      expect(getFilteredClusterNames(mockClusters, 'dev')).toEqual(['cluster-b']);
      expect(getFilteredClusterNames(mockClusters, 'nonexistent')).toEqual([]);
    });

    it('ignores empty or missing names', () => {
      const mockClusters: ClusterLike[] = [
        { metadata: { name: '', namespace: 'prod' } },
        { metadata: { name: 'c2', namespace: 'prod' } },
      ];

      expect(getFilteredClusterNames(mockClusters, 'prod')).toEqual(['c2']);
    });
  });
});
