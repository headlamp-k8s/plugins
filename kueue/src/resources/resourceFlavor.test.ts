import {
  renderNodeLabels,
  renderTaint,
  renderTaints,
  renderToleration,
  renderTolerations,
} from './resourceFlavorFormatters';
import type { ResourceFlavorTaint, ResourceFlavorToleration } from './resourceFlavor';

describe('ResourceFlavor Formatters', () => {
  describe('renderNodeLabels', () => {
    it('returns "-" for an empty object', () => {
      expect(renderNodeLabels({})).toBe('-');
    });

    it('formats a single label correctly', () => {
      expect(renderNodeLabels({ 'region': 'us-west' })).toBe('region=us-west');
    });

    it('formats multiple labels joined by commas', () => {
      expect(renderNodeLabels({ 'region': 'us-west', 'zone': 'a' })).toBe('region=us-west, zone=a');
    });
  });

  describe('renderTaint', () => {
    it('formats a taint with key, value, and effect', () => {
      const taint: ResourceFlavorTaint = { key: 'gpu', value: 'true', effect: 'NoSchedule' };
      expect(renderTaint(taint)).toBe('gpu=true:NoSchedule');
    });

    it('formats a taint without a value', () => {
      const taint: ResourceFlavorTaint = { key: 'gpu', effect: 'NoExecute' };
      expect(renderTaint(taint)).toBe('gpu:NoExecute');
    });
  });

  describe('renderTaints', () => {
    it('returns "-" for an empty array', () => {
      expect(renderTaints([])).toBe('-');
    });

    it('formats multiple taints joined by commas', () => {
      const taints: ResourceFlavorTaint[] = [
        { key: 'gpu', value: 'true', effect: 'NoSchedule' },
        { key: 'dedicated', effect: 'NoExecute' },
      ];
      expect(renderTaints(taints)).toBe('gpu=true:NoSchedule, dedicated:NoExecute');
    });
  });

  describe('renderToleration', () => {
    it('formats a toleration with key, value, effect, and seconds', () => {
      const toleration: ResourceFlavorToleration = {
        key: 'node.kubernetes.io/not-ready',
        operator: 'Equal',
        value: 'true',
        effect: 'NoExecute',
        tolerationSeconds: 300,
      };
      expect(renderToleration(toleration)).toBe('node.kubernetes.io/not-ready=true:NoExecute (300s)');
    });

    it('ignores value when operator is Exists', () => {
      const toleration: ResourceFlavorToleration = {
        key: 'gpu',
        operator: 'Exists',
        value: 'true', // Should be ignored
        effect: 'NoSchedule',
      };
      expect(renderToleration(toleration)).toBe('gpu:NoSchedule');
    });

    it('defaults key to "*" when missing', () => {
      const toleration: ResourceFlavorToleration = {
        operator: 'Exists',
        effect: 'NoExecute',
      };
      expect(renderToleration(toleration)).toBe('*:NoExecute');
    });

    it('formats a minimal toleration with just a key', () => {
      const toleration: ResourceFlavorToleration = { key: 'gpu' };
      expect(renderToleration(toleration)).toBe('gpu');
    });
  });

  describe('renderTolerations', () => {
    it('returns "-" for an empty array', () => {
      expect(renderTolerations([])).toBe('-');
    });

    it('formats multiple tolerations joined by commas', () => {
      const tolerations: ResourceFlavorToleration[] = [
        { key: 'gpu', operator: 'Exists', effect: 'NoSchedule' },
        { key: 'dedicated', value: 'true', effect: 'NoExecute' },
      ];
      expect(renderTolerations(tolerations)).toBe('gpu:NoSchedule, dedicated=true:NoExecute');
    });
  });
});
