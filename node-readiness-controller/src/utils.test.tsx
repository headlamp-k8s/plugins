import { describe, expect, it } from 'vitest';
import { getRuleStats } from './utils';

describe('utils', () => {
  describe('getRuleStats', () => {
    it('returns default stats for empty rule', () => {
      const mockRule = { jsonData: {} } as any;
      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(0);
      expect(stats.satisfied).toBe(0);
      expect(stats.unsatisfied).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.hasSummary).toBe(false);
      expect(stats.isDryRun).toBeFalsy();
    });

    it('returns correctly calculated stats from nodeEvaluations', () => {
      const mockRule = {
        jsonData: {
          status: {
            nodeEvaluations: [
              { taintStatus: 'Absent' },
              { taintStatus: 'Absent' },
              { taintStatus: 'Present' },
            ],
            failedNodes: ['node-1'],
          },
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(4);
      expect(stats.satisfied).toBe(2);
      expect(stats.unsatisfied).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.hasSummary).toBe(true);
    });

    it('returns N/A and affectedNodes for dry-run', () => {
      const mockRule = {
        jsonData: {
          spec: { dryRun: true },
          status: {
            dryRunResults: { affectedNodes: 5 },
          },
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(5);
      expect(stats.satisfied).toBe('N/A');
      expect(stats.unsatisfied).toBe('N/A');
      expect(stats.failed).toBe('N/A');
      expect(stats.isDryRun).toBe(true);
    });
  });
});
