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
  metrics?: Array<{ name?: string; value?: string }>;
  latestConditionType?: string;
  latestConditionStatus?: string;
}) {
  const {
    name,
    namespace = 'kubeflow-user',
    ownerExperiment,
    labels,
    metrics = [],
    latestConditionType,
    latestConditionStatus = 'True',
  } = options;

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
      objective: {
        objectiveMetricName: 'accuracy',
      },
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
      return metrics.find(metric => metric.name === 'accuracy')?.value ?? '';
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

describe('trial selection helpers', () => {
  it('returns the objective metric value when the metric name is present', () => {
    const trial = createTrial({
      name: 'trial-a',
      metrics: [
        { name: 'loss', value: '0.4' },
        { name: 'accuracy', value: '0.92' },
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
      metrics: [{ name: 'accuracy', value: '0.95' }],
    });
    const otherTrial = createTrial({
      name: 'trial-other',
      metrics: [{ name: 'accuracy', value: '0.91' }],
    });

    expect(
      getKatibBestTrial([otherTrial, bestTrial], 'accuracy', 'maximize')?.trial.metadata.name
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
