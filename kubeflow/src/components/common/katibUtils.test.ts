import { getKatibMetricValue, KatibMetric } from '../../resources/katibMetric';
import {
  formatKatibFeasibleSpace,
  getKatibBestTrial,
  getKatibConditionStatus,
  getKatibRelatedTrials,
  getKatibTerminalTrialCount,
  getKatibTrialMetricValue,
} from './katibUtils';

function createExperiment(name: string, namespace = 'kubeflow-user') {
  return {
    metadata: {
      name,
      namespace,
    },
  } as unknown as import('../../resources/katibExperiment').KatibExperimentClass;
}

function createTrial(options: {
  name: string;
  namespace?: string;
  ownerExperiment?: string;
  labels?: Record<string, string>;
  metrics?: KatibMetric[];
  objectiveType?: string;
  latestConditionType?: string;
  latestConditionStatus?: string;
}) {
  const {
    name,
    namespace = 'kubeflow-user',
    ownerExperiment,
    labels,
    metrics = [],
    objectiveType = 'maximize',
    latestConditionType,
    latestConditionStatus = 'True',
  } = options;
  const objective = { objectiveMetricName: 'accuracy', type: objectiveType };

  return {
    metadata: {
      name,
      namespace,
      labels,
      ownerReferences: ownerExperiment
        ? [
            {
              kind: 'Experiment',
              name: ownerExperiment,
            },
          ]
        : [],
    },
    spec: {
      objective,
    },
    status: {
      observation: {
        metrics,
      },
      conditions: latestConditionType
        ? [
            {
              type: latestConditionType,
              status: latestConditionStatus,
            },
          ]
        : [],
    },
    get ownerExperiment() {
      return ownerExperiment ?? '';
    },
    get objectiveMetricValue() {
      return getKatibMetricValue(
        metrics.find(metric => metric.name === 'accuracy'),
        objective
      );
    },
    get latestCondition() {
      return latestConditionType
        ? {
            type: latestConditionType,
            status: latestConditionStatus,
          }
        : null;
    },
  } as unknown as import('../../resources/katibTrial').KatibTrialClass;
}

describe('getKatibConditionStatus', () => {
  it('returns Pending when the resource has no condition yet', () => {
    expect(getKatibConditionStatus(null)).toEqual({
      label: 'Pending',
      status: '',
      reason: null,
    });
  });

  it('returns error styling for failed conditions', () => {
    expect(
      getKatibConditionStatus({
        type: 'Failed',
        status: 'True',
        reason: 'DeadlineExceeded',
      })
    ).toEqual({
      label: 'Failed',
      status: 'error',
      reason: 'DeadlineExceeded',
    });
  });

  it('returns success styling for true non-terminal conditions', () => {
    expect(
      getKatibConditionStatus({
        type: 'Running',
        status: 'True',
      })
    ).toEqual({
      label: 'Running',
      status: 'success',
      reason: null,
    });
  });
});

describe('formatKatibFeasibleSpace', () => {
  it('formats list-based feasible spaces', () => {
    expect(
      formatKatibFeasibleSpace({
        feasibleSpace: {
          list: ['adam', 'sgd'],
        },
      })
    ).toBe('adam, sgd');
  });

  it('formats ranged feasible spaces with steps', () => {
    expect(
      formatKatibFeasibleSpace({
        feasibleSpace: {
          min: '0.01',
          max: '0.1',
          step: '0.01',
        },
      })
    ).toBe('0.01 - 0.1 (step 0.01)');
  });
});

describe('getKatibMetricValue', () => {
  const metric = { name: 'accuracy', min: '0.71', max: '0.95', latest: '0.93' };

  it('uses max for maximize, min for minimize and latest otherwise', () => {
    expect(getKatibMetricValue(metric, { type: 'maximize' })).toBe('0.95');
    expect(getKatibMetricValue(metric, { type: 'minimize' })).toBe('0.71');
    expect(getKatibMetricValue(metric, {})).toBe('0.93');
  });

  it('follows the metric strategy set for the metric', () => {
    expect(
      getKatibMetricValue(metric, {
        type: 'maximize',
        metricStrategies: [{ name: 'accuracy', value: 'latest' }],
      })
    ).toBe('0.93');
  });

  it('falls back to latest, and to an empty string without a metric', () => {
    expect(getKatibMetricValue({ name: 'accuracy', latest: '0.8' }, { type: 'maximize' })).toBe(
      '0.8'
    );
    expect(getKatibMetricValue(undefined, { type: 'maximize' })).toBe('');
  });
});

describe('trial selection helpers', () => {
  it('returns the objective metric value when the metric name is present', () => {
    const trial = createTrial({
      name: 'trial-a',
      metrics: [
        { name: 'loss', min: '0.3', max: '0.9', latest: '0.4' },
        { name: 'accuracy', min: '0.5', max: '0.92', latest: '0.9' },
      ],
    });

    expect(getKatibTrialMetricValue(trial, 'accuracy')).toBe('0.92');
  });

  it('finds related trials via owner references and labels', () => {
    const experiment = createExperiment('experiment-a');
    const ownerTrial = createTrial({
      name: 'trial-owner',
      ownerExperiment: 'experiment-a',
    });
    const labelTrial = createTrial({
      name: 'trial-label',
      labels: {
        'katib.kubeflow.org/experiment-name': 'experiment-a',
      },
    });
    const otherTrial = createTrial({
      name: 'trial-other',
      ownerExperiment: 'experiment-b',
    });

    expect(getKatibRelatedTrials(experiment, [ownerTrial, labelTrial, otherTrial])).toHaveLength(2);
  });

  it('picks the highest metric for maximize objectives', () => {
    const bestTrial = createTrial({
      name: 'trial-best',
      metrics: [{ name: 'accuracy', min: '0.6', max: '0.95', latest: '0.94' }],
    });
    const otherTrial = createTrial({
      name: 'trial-other',
      metrics: [{ name: 'accuracy', min: '0.6', max: '0.91', latest: '0.9' }],
    });

    expect(
      getKatibBestTrial([otherTrial, bestTrial], 'accuracy', 'maximize')?.trial.metadata.name
    ).toBe('trial-best');
  });

  it('picks the lowest metric for minimize objectives', () => {
    const bestTrial = createTrial({
      name: 'trial-best',
      objectiveType: 'minimize',
      metrics: [{ name: 'accuracy', min: '0.12', max: '0.8', latest: '0.15' }],
    });
    const otherTrial = createTrial({
      name: 'trial-other',
      objectiveType: 'minimize',
      metrics: [{ name: 'accuracy', min: '0.2', max: '0.7', latest: '0.25' }],
    });

    expect(
      getKatibBestTrial([otherTrial, bestTrial], 'accuracy', 'minimize')?.trial.metadata.name
    ).toBe('trial-best');
  });

  it('counts only terminal succeeded and failed trials', () => {
    const succeededTrial = createTrial({
      name: 'trial-succeeded',
      latestConditionType: 'Succeeded',
    });
    const failedTrial = createTrial({
      name: 'trial-failed',
      latestConditionType: 'Failed',
    });
    const runningTrial = createTrial({
      name: 'trial-running',
      latestConditionType: 'Running',
    });

    expect(getKatibTerminalTrialCount([succeededTrial, failedTrial, runningTrial])).toBe(2);
  });
});
