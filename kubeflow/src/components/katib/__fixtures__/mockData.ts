/**
 * Mock data for Katib Storybook stories.
 */
import { KatibExperiment } from '../../../resources/katibExperiment';
import { KatibSuggestion } from '../../../resources/katibSuggestion';
import { KatibTrial } from '../../../resources/katibTrial';

export const mockKatibExperiment: KatibExperiment = {
  kind: 'Experiment',
  apiVersion: 'kubeflow.org/v1beta1',
  metadata: {
    name: 'mnist-e2e',
    namespace: 'default',
    creationTimestamp: '2025-01-01T10:00:00Z',
    uid: '1',
  },
  spec: {
    objective: {
      type: 'maximize',
      goal: 0.99,
      objectiveMetricName: 'Validation-accuracy',
    },
    algorithm: {
      algorithmName: 'random',
    },
    parameters: [
      {
        name: 'lr',
        parameterType: 'double',
        feasibleSpace: { min: '0.01', max: '0.03' },
      },
      {
        name: 'num-layers',
        parameterType: 'int',
        feasibleSpace: { min: '2', max: '5' },
      },
    ],
    maxTrialCount: 12,
    parallelTrialCount: 3,
  },
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'True',
        lastTransitionTime: '2025-01-01T11:00:00Z',
        reason: 'ExperimentSucceeded',
        message: 'Experiment has succeeded',
      },
    ],
    currentOptimalTrial: {
      parameterAssignments: [
        { name: 'lr', value: '0.02' },
        { name: 'num-layers', value: '3' },
      ],
      observation: {
        metrics: [{ name: 'Validation-accuracy', value: '0.98' }],
      },
    },
    currentTrialCount: 12,
    succeededTrialCount: 12,
    failedTrialCount: 0,
  },
};

export const mockKatibExperimentRunning: KatibExperiment = {
  ...mockKatibExperiment,
  metadata: {
    ...mockKatibExperiment.metadata,
    name: 'hyperparameter-tuning-running',
    uid: '2',
  },
  status: {
    conditions: [
      {
        type: 'Running',
        status: 'True',
        lastTransitionTime: '2025-01-02T09:00:00Z',
        reason: 'ExperimentRunning',
        message: 'Experiment is running',
      },
    ],
    currentTrialCount: 5,
    succeededTrialCount: 2,
    failedTrialCount: 1,
  },
};

export const mockKatibExperimentFailed: KatibExperiment = {
  ...mockKatibExperiment,
  metadata: {
    ...mockKatibExperiment.metadata,
    name: 'tuning-failed',
    uid: '3',
  },
  status: {
    conditions: [
      {
        type: 'Failed',
        status: 'True',
        lastTransitionTime: '2025-01-01T15:00:00Z',
        reason: 'ExperimentFailed',
        message: 'Failed to create trials',
      },
    ],
  },
};

export const mockKatibSuggestion: KatibSuggestion = {
  kind: 'Suggestion',
  apiVersion: 'kubeflow.org/v1beta1',
  metadata: {
    name: 'mnist-e2e',
    namespace: 'default',
    creationTimestamp: '2025-01-01T10:00:05Z',
    uid: '4',
  },
  spec: {
    requests: 12,
    algorithm: {
      algorithmName: 'random',
    },
  },
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'True',
        lastTransitionTime: '2025-01-01T11:00:00Z',
      },
    ],
    suggestionCount: 12,
  },
};

export const mockKatibTrial: KatibTrial = {
  kind: 'Trial',
  apiVersion: 'kubeflow.org/v1beta1',
  metadata: {
    name: 'mnist-e2e-abc12',
    namespace: 'default',
    creationTimestamp: '2025-01-01T10:05:00Z',
    uid: '5',
    ownerReferences: [
      {
        apiVersion: 'kubeflow.org/v1beta1',
        kind: 'Experiment',
        name: 'mnist-e2e',
        uid: '1',
        blockOwnerDeletion: true,
        controller: true,
      },
    ],
  },
  spec: {
    objective: {
      type: 'maximize',
      goal: 0.99,
      objectiveMetricName: 'Validation-accuracy',
    },
  },
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'True',
        lastTransitionTime: '2025-01-01T10:15:00Z',
      },
    ],
    observation: {
      metrics: [{ name: 'Validation-accuracy', value: '0.975' }],
    },
    startTime: '2025-01-01T10:05:05Z',
    completionTime: '2025-01-01T10:15:00Z',
  },
};

export const allKatibExperiments = [
  mockKatibExperiment,
  mockKatibExperimentRunning,
  mockKatibExperimentFailed,
];
export const allKatibSuggestions = [mockKatibSuggestion];
export const allKatibTrials = [mockKatibTrial];
