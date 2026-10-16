import { describe, expect, it } from 'vitest';
import { getRuleStats, getRuleStatusInfo } from './ruleStats';

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
      expect(stats.isDryRun).toBe(false);
    });

    it('returns correctly calculated stats from nodeEvaluations and failedNodes', () => {
      const mockRule = {
        jsonData: {
          status: {
            nodeEvaluations: [
              {
                nodeName: 'node-1',
                taintStatus: 'Absent',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
              {
                nodeName: 'node-2',
                taintStatus: 'Present',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
            ],
            failedNodes: [
              { nodeName: 'node-3', lastEvaluationTime: '2026-10-14T00:00:00Z', message: 'error' },
            ],
          },
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(3);
      expect(stats.satisfied).toBe(1);
      expect(stats.unsatisfied).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.hasSummary).toBe(true);
      expect(stats.isDryRun).toBe(false);
    });

    it('gives failedNodes precedence over overlapping older nodeEvaluations without double-counting', () => {
      const mockRule = {
        jsonData: {
          status: {
            nodeEvaluations: [
              {
                nodeName: 'node-1',
                taintStatus: 'Absent',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
              {
                nodeName: 'node-2',
                taintStatus: 'Present',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
            ],
            failedNodes: [
              {
                nodeName: 'node-2',
                lastEvaluationTime: '2026-10-14T00:01:00Z',
                message: 'error on node-2',
              },
              {
                nodeName: 'node-3',
                lastEvaluationTime: '2026-10-14T00:01:00Z',
                message: 'error on node-3',
              },
            ],
          },
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(3);
      expect(stats.satisfied).toBe(1);
      expect(stats.unsatisfied).toBe(0);
      expect(stats.failed).toBe(2);
      expect(stats.hasSummary).toBe(true);
      expect(stats.isDryRun).toBe(false);
    });

    it('returns correct stats and affectedNodes for dry-run', () => {
      const mockRule = {
        jsonData: {
          spec: { dryRun: true },
          status: {
            dryRunResults: { affectedNodes: 5, summary: 'Simulation complete' },
          },
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(5);
      expect(stats.satisfied).toBe('N/A');
      expect(stats.unsatisfied).toBe('N/A');
      expect(stats.failed).toBe(0);
      expect(stats.isDryRun).toBe(true);
      expect(stats.hasSummary).toBe(true);
    });

    it('counts failedNodes on dry-run rules and marks status as Failed', () => {
      const mockRule = {
        jsonData: {
          spec: { dryRun: true },
          status: {
            dryRunResults: { affectedNodes: 5, summary: 'Simulation complete' },
            failedNodes: [
              { nodeName: 'node-1', lastEvaluationTime: '2026-10-14T00:00:00Z', message: 'err' },
            ],
          },
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(5);
      expect(stats.satisfied).toBe('N/A');
      expect(stats.unsatisfied).toBe('N/A');
      expect(stats.failed).toBe(1);
      expect(stats.isDryRun).toBe(true);
      expect(stats.hasSummary).toBe(true);

      const info = getRuleStatusInfo(mockRule);
      expect(info.status).toBe('Failed');
      expect(info.label).toBe('Failed');
      expect(info.severity).toBe('error');
    });

    it('returns pending (hasSummary: false) for dry-run before results are recorded', () => {
      const mockRule = {
        jsonData: {
          spec: { dryRun: true },
          status: {},
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(0);
      expect(stats.satisfied).toBe('N/A');
      expect(stats.unsatisfied).toBe('N/A');
      expect(stats.failed).toBe(0);
      expect(stats.isDryRun).toBe(true);
      expect(stats.hasSummary).toBe(false);
    });

    it('handles rule with spec.dryRun: true and completely missing status without throwing', () => {
      const mockRule = {
        jsonData: {
          spec: { dryRun: true },
        },
      } as any;

      const stats = getRuleStats(mockRule);
      expect(stats.targeted).toBe(0);
      expect(stats.satisfied).toBe('N/A');
      expect(stats.unsatisfied).toBe('N/A');
      expect(stats.failed).toBe(0);
      expect(stats.isDryRun).toBe(true);
      expect(stats.hasSummary).toBe(false);
    });

    it('memoizes calculation for the same rule/status object', () => {
      const mockRule = {
        jsonData: {
          status: {
            nodeEvaluations: [
              {
                nodeName: 'node-1',
                taintStatus: 'Absent',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
            ],
            failedNodes: [],
          },
        },
      } as any;

      const stats1 = getRuleStats(mockRule);
      const stats2 = getRuleStats(mockRule);
      expect(stats1).toBe(stats2);
    });
  });

  describe('getRuleStatusInfo', () => {
    it('returns Terminating when deletionTimestamp is present', () => {
      const mockRule = {
        metadata: { deletionTimestamp: '2026-10-14T10:00:00Z' },
        jsonData: {},
      } as any;

      const info = getRuleStatusInfo(mockRule);
      expect(info.status).toBe('Terminating');
      expect(info.label).toBe('Terminating');
      expect(info.severity).toBe('warning');
    });

    it('returns Dry Run when simulation summary is present', () => {
      const mockRule = {
        jsonData: {
          spec: { dryRun: true },
          status: {
            dryRunResults: { affectedNodes: 7, summary: 'Simulation complete' },
          },
        },
      } as any;

      const info = getRuleStatusInfo(mockRule);
      expect(info.status).toBe('Dry Run');
      expect(info.label).toBe('Dry Run');
      expect(info.severity).toBe('info');
    });

    it('returns Pending for dry-run rules without status/results', () => {
      const mockRule = {
        jsonData: {
          spec: { dryRun: true },
        },
      } as any;

      const info = getRuleStatusInfo(mockRule);
      expect(info.status).toBe('Pending');
      expect(info.label).toBe('Pending');
      expect(info.severity).toBe('warning');
    });

    it('returns Failed and prevents OK when failed > 0', () => {
      const mockRule = {
        jsonData: {
          status: {
            nodeEvaluations: [
              {
                nodeName: 'node-1',
                taintStatus: 'Absent',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
            ],
            failedNodes: [
              { nodeName: 'node-2', lastEvaluationTime: '2026-10-14T00:00:00Z', message: 'error' },
            ],
          },
        },
      } as any;

      const info = getRuleStatusInfo(mockRule);
      expect(info.status).toBe('Failed');
      expect(info.label).toBe('Failed');
      expect(info.severity).toBe('error');
    });

    it('returns OK only when all nodes are satisfied and failed is 0', () => {
      const mockRule = {
        jsonData: {
          status: {
            nodeEvaluations: [
              {
                nodeName: 'node-1',
                taintStatus: 'Absent',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
              {
                nodeName: 'node-2',
                taintStatus: 'Absent',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
            ],
            failedNodes: [],
          },
        },
      } as any;

      const info = getRuleStatusInfo(mockRule);
      expect(info.status).toBe('OK');
      expect(info.label).toBe('OK');
      expect(info.severity).toBe('success');
    });

    it('returns Pending with error severity when unsatisfied nodes exist', () => {
      const mockRule = {
        jsonData: {
          status: {
            nodeEvaluations: [
              {
                nodeName: 'node-1',
                taintStatus: 'Present',
                lastEvaluationTime: '2026-10-14T00:00:00Z',
                conditionResults: [],
              },
            ],
            failedNodes: [],
          },
        },
      } as any;

      const info = getRuleStatusInfo(mockRule);
      expect(info.status).toBe('Pending');
      expect(info.label).toBe('Pending');
      expect(info.severity).toBe('error');
    });
  });
});
