/**
 * Mock data for Kubeflow Pipelines Storybook stories.
 * Based on setup-pipelines.yaml resources.
 */

export const mockPipeline = {
  kind: 'Pipeline',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'demo-pipeline',
    namespace: 'default',
    creationTimestamp: '2025-01-01T10:00:00Z',
  },
  spec: {
    displayName: 'Demo Pipeline',
    description: 'A simple demo pipeline for Storybook',
  },
  status: {
    conditions: [{ type: 'Ready', status: 'True' }],
  },
};

export const mockVersion = {
  kind: 'PipelineVersion',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'demo-v1',
    namespace: 'default',
    creationTimestamp: '2025-01-01T10:05:00Z',
  },
  spec: {
    pipelineName: 'demo-pipeline',
    displayName: 'Demo V1',
    description: 'First version of the demo pipeline',
  },
  status: {
    conditions: [{ type: 'Ready', status: 'True' }],
  },
};

export const mockExperiment = {
  kind: 'Experiment',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'demo-experiment',
    namespace: 'default',
    creationTimestamp: '2025-01-01T11:00:00Z',
  },
  spec: {
    displayName: 'Demo Experiment',
    description: 'Experiment grouping demo runs',
  },
  status: {
    conditions: [{ type: 'Ready', status: 'True' }],
  },
};

export const mockRun = {
  kind: 'Run',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'demo-run-001',
    namespace: 'default',
    creationTimestamp: '2025-01-01T12:00:00Z',
  },
  spec: {
    pipelineName: 'demo-pipeline',
    pipelineVersionName: 'demo-v1',
    experimentName: 'demo-experiment',
    displayName: 'Demo Run 001',
  },
  status: {
    state: 'SUCCEEDED',
    startTime: '2025-01-01T12:00:05Z',
    completionTime: '2025-01-01T12:05:00Z',
    conditions: [{ type: 'Ready', status: 'True' }],
  },
};

export const mockRecurringRun = {
  kind: 'RecurringRun',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'demo-recurring-run',
    namespace: 'default',
    creationTimestamp: '2025-01-01T10:30:00Z',
  },
  spec: {
    pipelineName: 'demo-pipeline',
    displayName: 'Demo Nightly',
    mode: 'ENABLE',
    cronSchedule: {
      cron: '0 0 * * *',
    },
  },
  status: {
    conditions: [{ type: 'Ready', status: 'True' }],
  },
};

export const mockRunRunning = {
  kind: 'Run',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'data-prep-running',
    namespace: 'default',
    creationTimestamp: '2025-01-02T09:00:00Z',
  },
  spec: {
    pipelineName: 'demo-pipeline',
    displayName: 'Data Prep (Running)',
  },
  status: {
    state: 'RUNNING',
    startTime: '2025-01-02T09:00:05Z',
  },
};

export const mockRunFailed = {
  kind: 'Run',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'model-train-failed',
    namespace: 'default',
    creationTimestamp: '2025-01-01T15:00:00Z',
  },
  spec: {
    pipelineName: 'demo-pipeline',
    displayName: 'Model Training (Failed)',
  },
  status: {
    state: 'FAILED',
    startTime: '2025-01-01T15:00:05Z',
    completionTime: '2025-01-01T15:20:00Z',
    conditions: [{ type: 'Ready', status: 'False', message: 'Resource limit exceeded' }],
  },
};

export const mockPipelineComplex = {
  kind: 'Pipeline',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'complex-ml-pipeline',
    namespace: 'default',
    creationTimestamp: '2025-01-05T08:00:00Z',
  },
  spec: {
    displayName: 'Advanced Model Training',
    description: 'A multi-step pipeline with preprocessing, training, and evaluation',
  },
};

export const mockRecurringRunDisabled = {
  kind: 'RecurringRun',
  apiVersion: 'pipelines.kubeflow.org/v2beta1',
  metadata: {
    name: 'cleanup-task',
    namespace: 'default',
    creationTimestamp: '2025-01-02T12:00:00Z',
  },
  spec: {
    pipelineName: 'demo-pipeline',
    displayName: 'Weekly Cleanup',
    mode: 'DISABLE',
    cronSchedule: {
      cron: '0 0 * * 0',
    },
  },
};

export const allPipelines = [mockPipeline, mockPipelineComplex];
export const allVersions = [mockVersion];
export const allExperiments = [mockExperiment];
export const allRuns = [mockRun, mockRunRunning, mockRunFailed];
export const allRecurringRuns = [mockRecurringRun, mockRecurringRunDisabled];
