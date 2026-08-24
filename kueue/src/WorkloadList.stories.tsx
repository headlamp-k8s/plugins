import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WorkloadListView } from './WorkloadListView';

export default {
  title: 'Kueue/WorkloadList',
  component: WorkloadListView,
};

export const MOCK_WORKLOADS = [
  {
    getName: () => 'sample-job-workload-1',
    getNamespace: () => 'default',
    jsonData: {
      spec: {
        queueName: 'team-a-queue',
        priority: 100,
      },
      status: {
        conditions: [
          { type: 'Admitted', status: 'True', reason: 'AdmittedByClusterQueue' },
        ],
      },
    },
  },
  {
    getName: () => 'sample-job-workload-2',
    getNamespace: () => 'team-a',
    jsonData: {
      spec: {
        queueName: 'team-a-queue',
        priority: 50,
      },
      status: {
        conditions: [
          { type: 'QuotaReserved', status: 'False', reason: 'Pending' },
        ],
      },
    },
  },
];

export const Default = () => (
  <MemoryRouter>
    <WorkloadListView workloads={MOCK_WORKLOADS as any} />
  </MemoryRouter>
);

export const Empty = () => (
  <MemoryRouter>
    <WorkloadListView workloads={[]} />
  </MemoryRouter>
);