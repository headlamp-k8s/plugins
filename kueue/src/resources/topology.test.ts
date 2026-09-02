import { describe, expect, it } from 'vitest';
import {
  getTopologyLevelNames,
  renderTopologyLevel,
  renderTopologyLevelsCount,
  renderTopologyLevelsSummary,
} from './topologyFormatters';

describe('Topology formatters', () => {
  describe('renderTopologyLevel', () => {
    it('formats single topology level with node label', () => {
      expect(
        renderTopologyLevel({
          name: 'rack',
          nodeLabel: 'topology.kubernetes.io/rack',
        })
      ).toBe('rack (topology.kubernetes.io/rack)');
    });

    it('formats level without node label', () => {
      expect(
        renderTopologyLevel({
          name: 'block',
          nodeLabel: '',
        })
      ).toBe('block');
    });

    it('returns dash fallback for empty or missing level', () => {
      expect(renderTopologyLevel(null)).toBe('-');
      expect(renderTopologyLevel(undefined)).toBe('-');
      expect(renderTopologyLevel({ name: '', nodeLabel: '' })).toBe('-');
    });
  });

  describe('renderTopologyLevelsSummary', () => {
    it('formats hierarchy chain with arrow separators', () => {
      const levels = [
        { name: 'rack', nodeLabel: 'topology.kubernetes.io/rack' },
        { name: 'block', nodeLabel: 'topology.kubernetes.io/block' },
        { name: 'host', nodeLabel: 'kubernetes.io/hostname' },
      ];
      expect(renderTopologyLevelsSummary(levels)).toBe(
        'rack (topology.kubernetes.io/rack) → block (topology.kubernetes.io/block) → host (kubernetes.io/hostname)'
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
          { name: 'rack', nodeLabel: 'rack' },
          { name: 'host', nodeLabel: 'host' },
        ])
      ).toBe(2);
      expect(renderTopologyLevelsCount([])).toBe(0);
      expect(renderTopologyLevelsCount(undefined)).toBe(0);
    });
  });

  describe('getTopologyLevelNames', () => {
    it('extracts list of non-empty level names', () => {
      expect(
        getTopologyLevelNames([
          { name: 'rack', nodeLabel: '' },
          { name: 'block', nodeLabel: '' },
          { name: 'host', nodeLabel: '' },
        ])
      ).toEqual(['rack', 'block', 'host']);
    });

    it('returns empty array when levels are missing', () => {
      expect(getTopologyLevelNames([])).toEqual([]);
      expect(getTopologyLevelNames(null)).toEqual([]);
    });
  });
});
