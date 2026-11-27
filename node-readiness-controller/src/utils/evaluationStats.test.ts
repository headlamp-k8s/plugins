import { describe, expect, it, vi } from 'vitest';
import { NodeReadinessEvaluation } from '../resources';
import {
  formatDurationMs,
  getActiveTaints,
  getConditionEvaluationStatus,
  getEvaluationStateInfo,
  getEvaluationSummary,
  getRuleDurationInfo,
} from './evaluationStats';

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: vi.fn().mockImplementation(() => {
    return class MockCRD {
      jsonData: any;
      metadata: any;
      constructor(jsonData: any) {
        this.jsonData = jsonData;
        this.metadata = jsonData?.metadata;
      }
    };
  }),
}));

describe('getEvaluationSummary', () => {
  it('returns pending when evaluation or status is empty or undefined', () => {
    expect(getEvaluationSummary(null)).toEqual({
      total: 0,
      satisfied: 0,
      unsatisfied: 0,
      isPending: true,
      statusLabel: 'Evaluation Pending',
      statusSeverity: undefined,
    });

    const emptyEval = {
      status: {},
    } as unknown as NodeReadinessEvaluation;
    expect(getEvaluationSummary(emptyEval).isPending).toBe(true);
  });

  it('returns pending on a resource instance when status.rules is absent and Evaluated is False', () => {
    const partialInstance = new NodeReadinessEvaluation({
      metadata: { name: 'worker-partial' },
      spec: { nodeName: 'worker-partial' },
      status: {
        conditions: [{ type: 'Evaluated', status: 'False' }],
      },
    });

    // The getter defaults to [], so raw status.rules must be checked instead
    expect(partialInstance.rules).toEqual([]);
    const summary = getEvaluationSummary(partialInstance);
    expect(summary.isPending).toBe(true);
    expect(summary.statusLabel).toBe('Evaluation Pending');
    expect(summary.statusSeverity).toBeUndefined();
  });

  it('returns no rules applicable on a resource instance when status.rules is omitted but evaluation completed', () => {
    const completedEmptyInstance = new NodeReadinessEvaluation({
      metadata: { name: 'worker-empty-complete' },
      spec: { nodeName: 'worker-empty-complete' },
      status: {
        state: 'Available',
        conditions: [{ type: 'Evaluated', status: 'True' }],
      },
    });

    const summary = getEvaluationSummary(completedEmptyInstance);
    expect(summary.isPending).toBe(false);
    expect(summary.statusLabel).toBe('No Rules Applicable');
    expect(summary.statusSeverity).toBe('success');
  });

  it('returns no rules applicable when rules array is empty', () => {
    const evalObj = {
      status: {
        rules: [],
      },
      rules: [],
    } as unknown as NodeReadinessEvaluation;

    const summary = getEvaluationSummary(evalObj);
    expect(summary.total).toBe(0);
    expect(summary.statusLabel).toBe('No Rules Applicable');
    expect(summary.statusSeverity).toBe('success');
  });

  it('returns OK status when all rules are satisfied', () => {
    const evalObj = {
      status: {
        rules: [
          { ruleName: 'rule-1', ruleStatus: 'Satisfied', taintStatus: 'Absent' },
          { ruleName: 'rule-2', ruleStatus: 'Satisfied', taintStatus: 'Absent' },
        ],
      },
      rules: [
        { ruleName: 'rule-1', ruleStatus: 'Satisfied', taintStatus: 'Absent' },
        { ruleName: 'rule-2', ruleStatus: 'Satisfied', taintStatus: 'Absent' },
      ],
    } as unknown as NodeReadinessEvaluation;

    const summary = getEvaluationSummary(evalObj);
    expect(summary.total).toBe(2);
    expect(summary.satisfied).toBe(2);
    expect(summary.unsatisfied).toBe(0);
    expect(summary.statusLabel).toBe('OK (2/2)');
    expect(summary.statusSeverity).toBe('success');
  });

  it('returns Not Ready status when some rules are unsatisfied', () => {
    const evalObj = {
      status: {
        rules: [
          { ruleName: 'rule-1', ruleStatus: 'Satisfied', taintStatus: 'Absent' },
          { ruleName: 'rule-2', ruleStatus: 'Unsatisfied', taintStatus: 'Present' },
          { ruleName: 'rule-3', ruleStatus: 'Unsatisfied', taintStatus: 'Present' },
        ],
      },
      rules: [
        { ruleName: 'rule-1', ruleStatus: 'Satisfied', taintStatus: 'Absent' },
        { ruleName: 'rule-2', ruleStatus: 'Unsatisfied', taintStatus: 'Present' },
        { ruleName: 'rule-3', ruleStatus: 'Unsatisfied', taintStatus: 'Present' },
      ],
    } as unknown as NodeReadinessEvaluation;

    const summary = getEvaluationSummary(evalObj);
    expect(summary.total).toBe(3);
    expect(summary.satisfied).toBe(1);
    expect(summary.unsatisfied).toBe(2);
    expect(summary.statusLabel).toBe('Not Ready (2/3)');
    expect(summary.statusSeverity).toBe('warning');
  });
});

describe('getEvaluationStateInfo', () => {
  it('handles Available state', () => {
    expect(getEvaluationStateInfo('Available')).toEqual({
      label: 'Available',
      severity: 'success',
    });
  });

  it('handles NotAvailable state', () => {
    expect(getEvaluationStateInfo('NotAvailable')).toEqual({
      label: 'NotAvailable',
      severity: 'error',
    });
  });

  it('handles undefined or pending state', () => {
    expect(getEvaluationStateInfo(undefined)).toEqual({
      label: 'Evaluation Pending',
      severity: undefined,
    });
  });
});

describe('formatDurationMs & getRuleDurationInfo', () => {
  it('formats milliseconds into human readable durations', () => {
    expect(formatDurationMs(42000)).toBe('42s');
    expect(formatDurationMs(130000)).toBe('2m 10s');
    expect(formatDurationMs(3600000)).toBe('1h');
    expect(formatDurationMs(8100000)).toBe('2h 15m');
    expect(formatDurationMs(90000000)).toBe('1d 1h');
    expect(formatDurationMs(-500)).toBe('0s');
  });

  it('computes unblock duration for satisfied rules with taint timestamps', () => {
    const info = getRuleDurationInfo({
      ruleStatus: 'Satisfied',
      taintAddedAt: '2026-11-06T10:00:00Z',
      taintRemovedAt: '2026-11-06T10:00:42Z',
    });
    expect(info).toEqual({
      label: '⏱️ Unblock Duration',
      text: '42s',
    });
  });

  it('computes currently blocked duration for unsatisfied rules', () => {
    const info = getRuleDurationInfo({
      ruleStatus: 'Unsatisfied',
      taintAddedAt: '2026-11-06T10:00:00Z',
      lastEvaluatedAt: '2026-11-06T10:03:12Z',
    });
    expect(info).toEqual({
      label: '⏳ Blocked at Last Evaluation',
      text: '3m 12s',
    });
  });

  it('returns null if timestamps are missing', () => {
    expect(getRuleDurationInfo({ ruleStatus: 'Satisfied' })).toBeNull();
    expect(getRuleDurationInfo({ ruleStatus: 'Unsatisfied' })).toBeNull();
  });

  it('computes unblock duration for adopted taints where taintAddedAt is unset (NRC lifecycle handling)', () => {
    // Adopted taint has taintObservedAt set, but taintAddedAt is empty
    const info = getRuleDurationInfo({
      taintStatus: 'Absent',
      taintObservedAt: '2026-11-06T10:00:00Z',
      taintRemovedAt: '2026-11-06T10:01:30Z',
    });
    expect(info).toEqual({
      label: '⏱️ Unblock Duration',
      text: '1m 30s',
    });
  });

  it('computes currently blocked duration for actively present adopted taints', () => {
    const info = getRuleDurationInfo({
      taintStatus: 'Present',
      taintObservedAt: '2026-11-06T10:00:00Z',
      lastEvaluatedAt: '2026-11-06T10:04:00Z',
    });
    expect(info).toEqual({
      label: '⏳ Blocked at Last Evaluation',
      text: '4m 0s',
    });
  });

  it('labels completed bootstrap-only lifecycles as unblock duration even if ruleStatus is Unsatisfied', () => {
    // In bootstrap-only mode, taint is removed once bootstrap passes. If conditions later become unmet,
    // ruleStatus may be Unsatisfied, but taintStatus is Absent so it is NOT currently blocked.
    const info = getRuleDurationInfo({
      ruleStatus: 'Unsatisfied',
      taintStatus: 'Absent',
      taintObservedAt: '2026-11-06T10:00:00Z',
      taintRemovedAt: '2026-11-06T10:02:00Z',
    });
    expect(info).toEqual({
      label: '⏱️ Unblock Duration',
      text: '2m 0s',
    });
  });
});

describe('getConditionEvaluationStatus', () => {
  it('evaluates directly against requiredStatus when currentStatus is True or False', () => {
    expect(
      getConditionEvaluationStatus({
        type: 'Ready',
        currentStatus: 'True',
        requiredStatus: 'True',
      })
    ).toBe('Satisfied');

    expect(
      getConditionEvaluationStatus({
        type: 'Ready',
        currentStatus: 'False',
        requiredStatus: 'True',
      })
    ).toBe('Unsatisfied');
  });

  it('evaluates defaultStatus fallback when currentStatus is Unknown (NRC #345)', () => {
    // Condition missing from node, defaultStatus matches requiredStatus, and parent rule is Satisfied
    expect(
      getConditionEvaluationStatus(
        {
          type: 'ConfigSynced',
          currentStatus: 'Unknown',
          requiredStatus: 'True',
          defaultStatus: 'True',
        },
        'Satisfied',
        'allOf'
      )
    ).toBe('Satisfied');

    // Condition explicitly Unknown on node where parent rule is Unsatisfied (NRC marks rule Unsatisfied)
    // Must NOT be falsely marked Satisfied; treated as indeterminate Unknown
    expect(
      getConditionEvaluationStatus(
        {
          type: 'ConfigSynced',
          currentStatus: 'Unknown',
          requiredStatus: 'True',
          defaultStatus: 'True',
        },
        'Unsatisfied',
        'allOf'
      )
    ).toBe('Unknown');

    // Condition missing from node, defaultStatus does not match requiredStatus
    expect(
      getConditionEvaluationStatus({
        type: 'ConfigSynced',
        currentStatus: 'Unknown',
        requiredStatus: 'True',
        defaultStatus: 'False',
      })
    ).toBe('Unsatisfied');
  });

  it('matches when requiredStatus is explicitly Unknown and fallback does not contradict it', () => {
    expect(
      getConditionEvaluationStatus({
        type: 'LegacyCondition',
        currentStatus: 'Unknown',
        requiredStatus: 'Unknown',
      })
    ).toBe('Satisfied');

    expect(
      getConditionEvaluationStatus(
        {
          type: 'LegacyCondition',
          currentStatus: 'Unknown',
          requiredStatus: 'Unknown',
          defaultStatus: 'True',
        },
        'Satisfied',
        'allOf'
      )
    ).toBe('Satisfied');
  });

  it('treats Unknown with requiredStatus Unknown and non-Unknown defaultStatus as indeterminate when not proven satisfied', () => {
    expect(
      getConditionEvaluationStatus(
        {
          type: 'MissingFallbackCondition',
          currentStatus: 'Unknown',
          requiredStatus: 'Unknown',
          defaultStatus: 'True',
        },
        'Unsatisfied',
        'allOf'
      )
    ).toBe('Unknown');

    expect(
      getConditionEvaluationStatus(
        {
          type: 'MissingFallbackCondition',
          currentStatus: 'Unknown',
          requiredStatus: 'Unknown',
          defaultStatus: 'False',
        },
        'Satisfied',
        'anyOf'
      )
    ).toBe('Unknown');
  });

  it('infers Satisfied for conditions when parent rule is authoritatively Satisfied in allOf', () => {
    expect(
      getConditionEvaluationStatus(
        {
          type: 'StorageReady',
          currentStatus: 'Unknown',
          requiredStatus: 'True',
        },
        'Satisfied',
        'allOf'
      )
    ).toBe('Satisfied');
  });

  it('treats Unknown conditions with omitted or Unknown defaultStatus as Unsatisfied when requiredStatus is True or False', () => {
    // Parent rule is Unsatisfied, condition missing or Unknown with omitted defaultStatus (implicit Unknown != True)
    expect(
      getConditionEvaluationStatus(
        {
          type: 'StorageReady',
          currentStatus: 'Unknown',
          requiredStatus: 'True',
        },
        'Unsatisfied',
        'allOf'
      )
    ).toBe('Unsatisfied');

    // Explicitly Unknown defaultStatus also fails to match requiredStatus False
    expect(
      getConditionEvaluationStatus(
        {
          type: 'DiskPressure',
          currentStatus: 'Unknown',
          requiredStatus: 'False',
          defaultStatus: 'Unknown',
        },
        'Unsatisfied',
        'allOf'
      )
    ).toBe('Unsatisfied');

    // Parent rule is Satisfied under anyOf with omitted defaultStatus (implicit Unknown != True)
    expect(
      getConditionEvaluationStatus(
        {
          type: 'StorageReady',
          currentStatus: 'Unknown',
          requiredStatus: 'True',
        },
        'Satisfied',
        'anyOf'
      )
    ).toBe('Unsatisfied');

    // Indeterminate Unknown still applies when defaultStatus === requiredStatus under anyOf
    expect(
      getConditionEvaluationStatus(
        {
          type: 'StorageReady',
          currentStatus: 'Unknown',
          requiredStatus: 'True',
          defaultStatus: 'True',
        },
        'Satisfied',
        'anyOf'
      )
    ).toBe('Unknown');
  });

  it('uses explicit effectiveStatus when provided by controller', () => {
    expect(
      getConditionEvaluationStatus({
        type: 'StorageReady',
        currentStatus: 'Unknown',
        effectiveStatus: 'True',
        requiredStatus: 'True',
        defaultStatus: 'True',
      })
    ).toBe('Satisfied');

    expect(
      getConditionEvaluationStatus({
        type: 'StorageReady',
        currentStatus: 'Unknown',
        effectiveStatus: 'Unknown',
        requiredStatus: 'True',
        defaultStatus: 'True',
      })
    ).toBe('Unsatisfied');
  });
});

describe('getActiveTaints', () => {
  it('extracts deduplicated key:effect strings for Present taints and defaults missing effect to NoSchedule', () => {
    expect(
      getActiveTaints([
        {
          ruleName: 'r1',
          ruleStatus: 'Unsatisfied',
          taintStatus: 'Present',
          taintKey: 'readiness.k8s.io/gpu',
          taintEffect: 'NoSchedule',
        },
        {
          ruleName: 'r2',
          ruleStatus: 'Unsatisfied',
          taintStatus: 'Present',
          taintKey: 'readiness.k8s.io/gpu',
          taintEffect: 'NoSchedule',
        },
        {
          ruleName: 'r3',
          ruleStatus: 'Unsatisfied',
          taintStatus: 'Present',
          taintKey: 'readiness.k8s.io/csi',
        },
        {
          ruleName: 'r4',
          ruleStatus: 'Satisfied',
          taintStatus: 'Absent',
          taintKey: 'readiness.k8s.io/cni',
          taintEffect: 'NoSchedule',
        },
      ])
    ).toEqual(['readiness.k8s.io/gpu:NoSchedule', 'readiness.k8s.io/csi:NoSchedule']);
  });
});
