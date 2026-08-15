import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { LocalQueueListView } from './LocalQueueListView';

export default {
  title: 'Kueue/LocalQueueList',
  component: LocalQueueListView,
};

export const MOCK_LOCAL_QUEUES = [
  {
    getName: () => 'local-queue-team-a',
    getNamespace: () => 'team-a',
    jsonData: {
      apiVersion: 'kueue.x-k8s.io/v1beta1',
      kind: 'LocalQueue',
      metadata: {
        name: 'local-queue-team-a',
        namespace: 'team-a',
        creationTimestamp: '2026-08-15T10:00:00Z',
      },
      spec: {
        clusterQueue: 'cluster-queue-team-a',
      },
      status: {
        pendingWorkloads: 1,
        admittedWorkloads: 4,
        flavorFrequencies: [
          {
            flavor: 'default-flavor',
            resources: [{ name: 'cpu', total: '4000m' }],
          },
        ],
        conditions: [
          {
            type: 'Active',
            status: 'True',
            reason: 'Ready',
            message: 'LocalQueue is active and connected to ClusterQueue cluster-queue-team-a',
          },
        ],
      },
    },
  },
  {
    getName: () => 'local-queue-team-b',
    getNamespace: () => 'team-b',
    jsonData: {
      apiVersion: 'kueue.x-k8s.io/v1beta1',
      kind: 'LocalQueue',
      metadata: {
        name: 'local-queue-team-b',
        namespace: 'team-b',
      },
      spec: {
        clusterQueue: 'cluster-queue-team-b',
      },
      status: {
        pendingWorkloads: 5,
        admittedWorkloads: 0,
        conditions: [
          {
            type: 'Active',
            status: 'False',
            reason: 'ClusterQueueDoesNotExist',
            message: 'Can not submit workloads until ClusterQueue exists',
          },
        ],
      },
    },
  },
];

export const Default = () => (
  <MemoryRouter>
    <LocalQueueListView localQueues={MOCK_LOCAL_QUEUES as any} />
  </MemoryRouter>
);

export const Empty = () => (
  <MemoryRouter>
    <LocalQueueListView localQueues={[]} />
  </MemoryRouter>
);