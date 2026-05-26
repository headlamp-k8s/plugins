/**
 * Shared mock data fixtures for Kubeflow Training components.
 */

export const trainJobRunning = {
  apiVersion: 'trainer.kubeflow.org/v1alpha1',
  kind: 'TrainJob',
  metadata: {
    name: 'llm-finetuning',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-05-25T10:00:00Z',
    uid: 'tj-1111-2222',
  },
  spec: {
    runtimeRef: {
      name: 'pytorch-distributed',
      kind: 'ClusterTrainingRuntime',
      apiGroup: 'trainer.kubeflow.org',
    },
    trainer: {
      numNodes: 4,
      numProcPerNode: '8',
      image: 'my-registry.com/ai/pytorch-llm:v2.1',
    },
  },
  status: {
    conditions: [
      {
        type: 'Running',
        status: 'True',
        lastTransitionTime: '2026-05-25T10:05:00Z',
      },
    ],
    trainerStatus: {
      progressPercentage: 45.5,
      estimatedRemainingSeconds: 3600,
      lastUpdatedTime: '2026-05-25T11:00:00Z',
    },
  },
};

export const trainJobSuspended = {
  apiVersion: 'trainer.kubeflow.org/v1alpha1',
  kind: 'TrainJob',
  metadata: {
    name: 'cv-model-training',
    namespace: 'research-team',
    creationTimestamp: '2026-05-24T08:00:00Z',
    uid: 'tj-3333-4444',
  },
  spec: {
    suspend: true,
    runtimeRef: {
      name: 'tf-distributed',
      kind: 'ClusterTrainingRuntime',
    },
    trainer: {
      numNodes: 2,
      image: 'tensorflow/tensorflow:latest-gpu',
    },
  },
  status: {
    conditions: [
      {
        type: 'Suspended',
        status: 'True',
        lastTransitionTime: '2026-05-24T12:00:00Z',
      },
    ],
  },
};

export const trainJobFailed = {
  apiVersion: 'trainer.kubeflow.org/v1alpha1',
  kind: 'TrainJob',
  metadata: {
    name: 'nlp-experiment',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-05-26T09:00:00Z',
    uid: 'tj-5555-6666',
  },
  spec: {
    runtimeRef: {
      name: 'xgboost-single',
      kind: 'ClusterTrainingRuntime',
    },
    trainer: {
      numNodes: 1,
      image: 'xgboost/xgboost:latest',
    },
  },
  status: {
    conditions: [
      {
        type: 'Failed',
        status: 'True',
        reason: 'OOMKilled',
        message: 'The training process ran out of memory.',
        lastTransitionTime: '2026-05-26T09:15:00Z',
      },
    ],
  },
};

export const allTrainJobs = [trainJobRunning, trainJobSuspended, trainJobFailed];

export const trainingRuntimeCustom = {
  apiVersion: 'trainer.kubeflow.org/v1alpha1',
  kind: 'TrainingRuntime',
  metadata: {
    name: 'custom-mpi-runtime',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-05-20T10:00:00Z',
    labels: {
      'trainer.kubeflow.org/framework': 'MPI',
    },
  },
  spec: {
    mlPolicy: {
      numNodes: 4,
    },
    podGroupPolicy: {
      volcano: {
        queue: 'high-priority',
      },
    },
    template: {
      spec: {
        replicatedJobs: [
          {
            name: 'Launcher',
            replicas: 1,
          },
          {
            name: 'Worker',
            replicas: 4,
          },
        ],
      },
    },
  },
};

export const allTrainingRuntimes = [trainingRuntimeCustom];

export const clusterTrainingRuntimePytorch = {
  apiVersion: 'trainer.kubeflow.org/v1alpha1',
  kind: 'ClusterTrainingRuntime',
  metadata: {
    name: 'pytorch-distributed',
    creationTimestamp: '2026-01-10T00:00:00Z',
    labels: {
      'trainer.kubeflow.org/framework': 'PyTorch',
    },
  },
  spec: {
    mlPolicy: {
      numNodes: 1,
    },
    template: {
      spec: {
        replicatedJobs: [
          {
            name: 'Master',
            replicas: 1,
          },
          {
            name: 'Worker',
            replicas: 2,
          },
        ],
      },
    },
  },
};

export const clusterTrainingRuntimeTF = {
  apiVersion: 'trainer.kubeflow.org/v1alpha1',
  kind: 'ClusterTrainingRuntime',
  metadata: {
    name: 'tf-distributed',
    creationTimestamp: '2026-01-10T00:00:00Z',
    labels: {
      'trainer.kubeflow.org/framework': 'TensorFlow',
    },
  },
  spec: {
    mlPolicy: {
      numNodes: 2,
    },
    template: {
      spec: {
        replicatedJobs: [
          {
            name: 'Chief',
            replicas: 1,
          },
          {
            name: 'Worker',
            replicas: 2,
          },
        ],
      },
    },
  },
};

export const allClusterTrainingRuntimes = [clusterTrainingRuntimePytorch, clusterTrainingRuntimeTF];
