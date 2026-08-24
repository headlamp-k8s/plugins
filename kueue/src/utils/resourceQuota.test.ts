import { describe, expect, it } from 'vitest';
import {
  calculateResourceQuotaRatio,
  findConfiguredQuota,
  formatQuantityValue,
  formatRawQuantity,
  parseQuantity,
} from './resourceQuota';

describe('resourceQuota utils', () => {
  describe('parseQuantity', () => {
    it('parses CPU quantities in cores, millicores, and numbers', () => {
      expect(parseQuantity('8', 'cpu')).toBe(8);
      expect(parseQuantity('500m', 'cpu')).toBe(0.5);
      expect(parseQuantity('1500m', 'cpu')).toBe(1.5);
      expect(parseQuantity(2, 'cpu')).toBe(2);
      expect(parseQuantity(undefined, 'cpu')).toBe(0);
      expect(parseQuantity('', 'cpu')).toBe(0);
    });

    it('parses RAM quantities in bytes, Ki, Mi, Gi', () => {
      expect(parseQuantity('32Gi', 'memory')).toBe(32 * 1024 * 1024 * 1024);
      expect(parseQuantity('512Mi', 'memory')).toBe(512 * 1024 * 1024);
      expect(parseQuantity('1024Ki', 'memory')).toBe(1024 * 1024);
      expect(parseQuantity(undefined, 'memory')).toBe(0);
    });

    it('parses generic count resources', () => {
      expect(parseQuantity('4', 'nvidia.com/gpu')).toBe(4);
      expect(parseQuantity(2, 'pods')).toBe(2);
      expect(parseQuantity(undefined, 'pods')).toBe(0);
    });
  });

  describe('formatQuantityValue & formatRawQuantity', () => {
    it('formats CPU values with core units', () => {
      expect(formatQuantityValue(8, 'cpu')).toEqual({ display: '8', unit: 'cores' });
      expect(formatQuantityValue(1, 'cpu')).toEqual({ display: '1', unit: 'core' });
      expect(formatQuantityValue(0.5, 'cpu')).toEqual({ display: '0.5', unit: 'cores' });
    });

    it('formats RAM values with human readable units', () => {
      expect(formatRawQuantity('32Gi', 'memory')).toBe('32 Gi');
      expect(formatRawQuantity('512Mi', 'memory')).toBe('512 Mi');
      expect(formatRawQuantity(undefined, 'memory')).toBe('-');
    });
  });

  describe('findConfiguredQuota & calculateResourceQuotaRatio', () => {
    const resourceGroups = [
      {
        coveredResources: ['cpu', 'memory'],
        flavors: [
          {
            name: 'default',
            resources: [
              { name: 'cpu', nominalQuota: '8', borrowingLimit: '4' },
              { name: 'memory', nominalQuota: '32Gi' },
            ],
          },
        ],
      },
    ];

    it('finds nominal quota and borrowing limit from resourceGroups', () => {
      const quota = findConfiguredQuota(resourceGroups, 'default', 'cpu');
      expect(quota.nominalQuota).toBe('8');
      expect(quota.borrowingLimit).toBe('4');

      const missing = findConfiguredQuota(resourceGroups, 'nonexistent', 'cpu');
      expect(missing.nominalQuota).toBeUndefined();
    });

    it('calculates 50% reservation ratio for 4/8 CPU', () => {
      const calc = calculateResourceQuotaRatio('default', 'cpu', '4', '0', resourceGroups);
      expect(calc.ratio).toBe(0.5);
      expect(calc.percentage).toBe(50);
      expect(calc.isOverNominal).toBe(false);
      expect(calc.isBorrowingOnly).toBe(false);
    });

    it('calculates 100% reservation ratio for 8/8 CPU', () => {
      const calc = calculateResourceQuotaRatio('default', 'cpu', '8', '0', resourceGroups);
      expect(calc.percentage).toBe(100);
      expect(calc.isOverNominal).toBe(false);
    });

    it('calculates 125% reservation ratio for 10/8 CPU with borrowing', () => {
      const calc = calculateResourceQuotaRatio('default', 'cpu', '10', '2', resourceGroups);
      expect(calc.percentage).toBe(125);
      expect(calc.isOverNominal).toBe(true);
    });

    it('handles zero nominal quota (borrowing-only flavor)', () => {
      const borrowOnlyGroups = [
        {
          flavors: [
            {
              name: 'borrow-only',
              resources: [{ name: 'cpu', nominalQuota: '0', borrowingLimit: '8' }],
            },
          ],
        },
      ];
      const calc = calculateResourceQuotaRatio('borrow-only', 'cpu', '4', '4', borrowOnlyGroups);
      expect(calc.percentage).toBeNull();
      expect(calc.isBorrowingOnly).toBe(true);
    });

    it('handles missing reservation status gracefully', () => {
      const calc = calculateResourceQuotaRatio('default', 'cpu', undefined, undefined, resourceGroups);
      expect(calc.ratio).toBe(0);
      expect(calc.percentage).toBe(0);
    });
  });
});
