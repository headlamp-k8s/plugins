// Fixtures matching official Kueue v1beta1 specs for realistic storybook rendering

export const mockClusterQueueActive = {
  apiVersion: 'kueue.x-k8s.io/v1beta1',
  kind: 'ClusterQueue',
  metadata: {
    name: 'cluster-queue-sample',
    creationTimestamp: '2026-01-01T00:00:00Z',
    uid: 'cq-uid-1',
  },
  spec: {
    cohort: 'prod-cohort',
    queueingStrategy: 'BestEffortFIFO',
    namespaceSelector: {},
    resourceGroups: [
      {
        coveredResources: ['cpu', 'memory'],
        flavors: [
          {
            name: 'default-flavor',
            resources: [
              { name: 'cpu', nominalQuota: '9', borrowingLimit: '1' },
              { name: 'memory', nominalQuota: '36Gi' },
            ],
          },
        ],
      },
    ],
  },
  status: {
    pendingWorkloads: 3,
    admittedWorkloads: 10,
    flavorsReservation: [
      {
        name: 'default-flavor',
        resources: [
          { name: 'cpu', total: '4' },
          { name: 'memory', total: '16Gi' },
        ],
      },
    ],
    conditions: [
      {
        type: 'Active',
        status: 'True',
        reason: 'Ready',
        message: 'Can admit new workloads',
        lastTransitionTime: '2026-01-01T00:00:00Z',
      },
    ],
  },
};

export const mockLocalQueueActive = {
  apiVersion: 'kueue.x-k8s.io/v1beta1',
  kind: 'LocalQueue',
  metadata: {
    name: 'user-queue',
    namespace: 'default',
    creationTimestamp: '2026-01-01T00:00:00Z',
    uid: 'lq-uid-1',
  },
  spec: {
    clusterQueue: 'cluster-queue-sample',
  },
  status: {
    pendingWorkloads: 1,
    admittedWorkloads: 4,
    flavorUsage: [
      {
        name: 'default-flavor',
        resources: [
          { name: 'cpu', total: '2' },
          { name: 'memory', total: '8Gi' },
        ],
      },
    ],
    conditions: [
      {
        type: 'Active',
        status: 'True',
        reason: 'Ready',
        message: 'LocalQueue is ready',
        lastTransitionTime: '2026-01-01T00:00:00Z',
      },
    ],
  },
};

export const mockWorkloadAdmitted = {
  apiVersion: 'kueue.x-k8s.io/v1beta1',
  kind: 'Workload',
  metadata: {
    name: 'sample-job-workload',
    namespace: 'default',
    creationTimestamp: '2026-01-01T00:00:00Z',
    uid: 'wl-uid-1',
  },
  spec: {
    queueName: 'user-queue',
    priority: 100,
    podSets: [
      {
        name: 'main',
        count: 2,
      },
    ],
  },
  status: {
    admission: {
      clusterQueue: 'cluster-queue-sample',
      podSetFlavors: [
        {
          name: 'main',
          flavors: {
            cpu: 'default-flavor',
          },
        },
      ],
    },
    conditions: [
      {
        type: 'Admitted',
        status: 'True',
        reason: 'AdmittedByClusterQueue',
        message: 'Admitted by ClusterQueue cluster-queue-sample',
        lastTransitionTime: '2026-01-01T00:00:00Z',
      },
    ],
  },
};

export const mockResourceFlavor = {
  apiVersion: 'kueue.x-k8s.io/v1beta1',
  kind: 'ResourceFlavor',
  metadata: {
    name: 'default-flavor',
    creationTimestamp: '2026-01-01T00:00:00Z',
    uid: 'rf-uid-1',
  },
  spec: {
    nodeLabels: {
      'instance-type': 'on-demand',
    },
  },
};