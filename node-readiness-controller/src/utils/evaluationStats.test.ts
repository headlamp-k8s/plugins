import { describe, expect, it } from 'vitest';
import type { NodeReadinessEvaluation } from '../resources';
import {
  formatDurationMs,
  getConditionEvaluationStatus,
  getEvaluationStateInfo,
  getEvaluationSummary,
  getRuleDurationInfo,
} from './evaluationStats';

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
    // Condition missing from node, but defaultStatus matches requiredStatus
    expect(
      getConditionEvaluationStatus({
        type: 'ConfigSynced',
        currentStatus: 'Unknown',
        requiredStatus: 'True',
        defaultStatus: 'True',
      })
    ).toBe('Satisfied');

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

  it('matches when requiredStatus is explicitly Unknown', () => {
    expect(
      getConditionEvaluationStatus({
        type: 'LegacyCondition',
        currentStatus: 'Unknown',
        requiredStatus: 'Unknown',
      })
    ).toBe('Satisfied');
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

  it('treats ambiguous Unknown conditions without defaultStatus as indeterminate Unknown', () => {
    // Parent rule is Unsatisfied, condition status is missing on node
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
    ).toBe('Unknown');

    // Parent rule is Satisfied but policy is anyOf (we cannot know if this specific condition satisfied it)
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
    ).toBe('Unknown');
  });
});
