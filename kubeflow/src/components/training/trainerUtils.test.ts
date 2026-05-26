import type { ClusterTrainingRuntimeClass } from '../../resources/trainingRuntime';
import type { TrainJobClass } from '../../resources/trainJob';
import {
  buildTrainJobWarnings,
  getTrainJobStatusInfo,
  inferPodMetricSummary,
  mergeRuntimeObjects,
} from './trainerUtils';

describe('trainerUtils', () => {
  describe('getTrainJobStatusInfo', () => {
    it('returns Suspended state', () => {
      const job = {
        suspended: true,
        conditions: [],
      } as any as TrainJobClass;
      const info = getTrainJobStatusInfo(job);
      expect(info.label).toBe('Suspended');
      expect(info.status).toBe('warning');
    });

    it('returns Succeeded state from conditions', () => {
      const job = {
        conditions: [{ type: 'Succeeded', status: 'True' }],
      } as any as TrainJobClass;
      const info = getTrainJobStatusInfo(job);
      expect(info.label).toBe('Succeeded');
      expect(info.status).toBe('success');
    });

    it('returns Failed state from conditions', () => {
      const job = {
        conditions: [{ type: 'Failed', status: 'True', reason: 'OOMKilled' }],
      } as any as TrainJobClass;
      const info = getTrainJobStatusInfo(job);
      expect(info.label).toBe('Failed');
      expect(info.status).toBe('error');
      expect(info.reason).toBe('OOMKilled');
    });

    it('defaults to Pending if no true conditions', () => {
      const job = {
        conditions: [],
        phase: '',
      } as any as TrainJobClass;
      const info = getTrainJobStatusInfo(job);
      expect(info.label).toBe('Pending');
      expect(info.status).toBe('warning');
    });
  });

  describe('buildTrainJobWarnings', () => {
    it('returns missing runtime warning if name is missing', () => {
      const job = {
        runtimeKind: 'ClusterTrainingRuntime',
        runtimeName: '',
      } as any as TrainJobClass;
      const warnings = buildTrainJobWarnings({
        job,
        namespacedRuntime: null,
        clusterRuntime: null,
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].title).toBe('Missing runtime reference');
    });

    it('returns not found warning for missing cluster runtime', () => {
      const job = {
        runtimeKind: 'ClusterTrainingRuntime',
        runtimeName: 'my-runtime',
        runtimeApiGroup: 'trainer.kubeflow.org',
      } as any as TrainJobClass;
      const warnings = buildTrainJobWarnings({
        job,
        namespacedRuntime: null,
        clusterRuntime: null,
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].title).toBe('ClusterTrainingRuntime not found');
    });

    it('returns warning for multi-node job without scheduling', () => {
      const job = {
        runtimeKind: 'ClusterTrainingRuntime',
        runtimeName: 'my-runtime',
        runtimeApiGroup: 'trainer.kubeflow.org',
        numNodes: 2,
      } as any as TrainJobClass;
      const clusterRuntime = {
        framework: 'PyTorch',
        schedulingMode: '',
      } as any as ClusterTrainingRuntimeClass;
      const warnings = buildTrainJobWarnings({
        job,
        namespacedRuntime: null,
        clusterRuntime,
      });
      expect(warnings).toHaveLength(1);
      expect(warnings[0].title).toBe('Distributed job without gang scheduling');
    });
  });

  describe('mergeRuntimeObjects', () => {
    it('merges object properties recursively', () => {
      const base = { a: 1, b: { c: 2 } };
      const patch = { b: { d: 3 } };
      expect(mergeRuntimeObjects(base, patch)).toEqual({ a: 1, b: { c: 2, d: 3 } });
    });

    it('merges named arrays correctly', () => {
      const base = [
        { name: 'A', value: 1 },
        { name: 'B', value: 2 },
      ];
      const patch = [
        { name: 'A', value: 10 },
        { name: 'C', value: 3 },
      ];
      expect(mergeRuntimeObjects(base, patch)).toEqual([
        { name: 'A', value: 10 },
        { name: 'B', value: 2 },
        { name: 'C', value: 3 },
      ]);
    });

    it('overwrites primitives', () => {
      expect(mergeRuntimeObjects(1, 2)).toBe(2);
      expect(mergeRuntimeObjects('A', 'B')).toBe('B');
      expect(mergeRuntimeObjects(true, false)).toBe(false);
    });
  });

  describe('inferPodMetricSummary', () => {
    it('aggregates CPU and Memory correctly', () => {
      const metrics = [
        {
          containers: [
            { usage: { cpu: '500m', memory: '1Gi' } },
            { usage: { cpu: '500m', memory: '1Gi' } },
          ],
        },
        {
          containers: [{ usage: { cpu: '1', memory: '2Gi' } }],
        },
      ];
      const summary = inferPodMetricSummary(metrics);
      expect(summary.cpu).toBe('2 cores');
      expect(summary.memory).toBe('4.0 Gi');
    });

    it('returns "-" for empty metrics', () => {
      const summary = inferPodMetricSummary([]);
      expect(summary.cpu).toBe('-');
      expect(summary.memory).toBe('-');
    });
  });
});
