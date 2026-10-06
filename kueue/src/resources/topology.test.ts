import { describe, expect, it } from 'vitest';
import {
  getTopologyNodeLabels,
  renderTopologyLevel,
  renderTopologyLevelsCount,
  renderTopologyLevelsSummary,
} from './topologyFormatters';

describe('Topology formatters', () => {
  describe('renderTopologyLevel', () => {
    it('formats single topology level from nodeLabel', () => {
      expect(
        renderTopologyLevel({
          nodeLabel: 'topology.kubernetes.io/rack',
        })
      ).toBe('topology.kubernetes.io/rack');
    });

    it('falls back to name when nodeLabel is not provided', () => {
      expect(
        renderTopologyLevel({
          nodeLabel: '',
          name: 'block',
        })
      ).toBe('block');
    });

    it('returns dash fallback for empty or missing level', () => {
      expect(renderTopologyLevel(null)).toBe('-');
      expect(renderTopologyLevel(undefined)).toBe('-');
      expect(renderTopologyLevel({ nodeLabel: '', name: '' })).toBe('-');
    });
  });

  describe('renderTopologyLevelsSummary', () => {
    it('formats hierarchy chain with arrow separators from nodeLabels', () => {
      const levels = [
        { nodeLabel: 'topology.kubernetes.io/rack' },
        { nodeLabel: 'topology.kubernetes.io/block' },
        { nodeLabel: 'kubernetes.io/hostname' },
      ];
      expect(renderTopologyLevelsSummary(levels)).toBe(
        'topology.kubernetes.io/rack → topology.kubernetes.io/block → kubernetes.io/hostname'
      );
    });

    it('returns dash fallback for empty or undefined levels array', () => {
      expect(renderTopologyLevelsSummary([])).toBe('-');
      expect(renderTopologyLevelsSummary(null)).toBe('-');
      expect(renderTopologyLevelsSummary(undefined)).toBe('-');
    });
  });

  describe('renderTopologyLevelsCount', () => {
    it('returns total count of levels', () => {
      expect(
        renderTopologyLevelsCount([
          { nodeLabel: 'topology.kubernetes.io/rack' },
          { nodeLabel: 'kubernetes.io/hostname' },
        ])
      ).toBe(2);
      expect(renderTopologyLevelsCount([])).toBe(0);
      expect(renderTopologyLevelsCount(undefined)).toBe(0);
    });
  });

  describe('getTopologyNodeLabels', () => {
    it('extracts list of non-empty node labels', () => {
      expect(
        getTopologyNodeLabels([
          { nodeLabel: 'topology.kubernetes.io/rack' },
          { nodeLabel: 'topology.kubernetes.io/block' },
          { nodeLabel: 'kubernetes.io/hostname' },
        ])
      ).toEqual([
        'topology.kubernetes.io/rack',
        'topology.kubernetes.io/block',
        'kubernetes.io/hostname',
      ]);
    });

    it('returns empty array when levels are missing', () => {
      expect(getTopologyNodeLabels([])).toEqual([]);
      expect(getTopologyNodeLabels(null)).toEqual([]);
    });
  });
});
