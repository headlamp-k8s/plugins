/**
 * Mock data for Helm releases used in tests
 */

export const mockReleaseInfo = {
  status: 'deployed',
  last_deployed: '2024-01-15T10:30:00Z',
  description: 'Install complete',
};

export const mockRelease = {
  name: 'my-nginx',
  namespace: 'default',
  version: 1,
  chart: {
    metadata: {
      name: 'nginx',
      version: '1.0.0',
      appVersion: '1.21.0',
      icon: 'https://example.com/nginx-icon.png',
    },
  },
  info: mockReleaseInfo,
  config: {
    replicaCount: 2,
    service: {
      type: 'LoadBalancer',
    },
  },
};

export const mockReleaseList = {
  releases: [
    mockRelease,
    {
      name: 'my-redis',
      namespace: 'default',
      version: 3,
      chart: {
        metadata: {
          name: 'redis',
          version: '2.0.0',
          appVersion: '6.2.0',
        },
      },
      info: {
        status: 'deployed',
        last_deployed: '2024-01-14T09:00:00Z',
        description: 'Upgrade complete',
      },
      config: {},
    },
    {
      name: 'my-postgres',
      namespace: 'database',
      version: 2,
      chart: {
        metadata: {
          name: 'postgresql',
          version: '3.0.0',
          appVersion: '13.0',
        },
      },
      info: {
        status: 'failed',
        last_deployed: '2024-01-13T14:20:00Z',
        description: 'Rollback to 1',
      },
      config: {},
    },
  ],
};

export const mockReleaseHistory = {
  releases: [
    {
      ...mockRelease,
      version: 3,
      info: {
        status: 'deployed',
        last_deployed: '2024-01-15T10:30:00Z',
        description: 'Upgrade complete',
      },
    },
    {
      ...mockRelease,
      version: 2,
      info: {
        status: 'superseded',
        last_deployed: '2024-01-14T09:00:00Z',
        description: 'Upgrade complete',
      },
    },
    {
      ...mockRelease,
      version: 1,
      info: {
        status: 'superseded',
        last_deployed: '2024-01-10T08:00:00Z',
        description: 'Install complete',
      },
    },
  ],
};

export const mockActionStatus = {
  status: 'complete',
  message: 'Operation completed successfully',
};

export const mockActionStatusProcessing = {
  status: 'processing',
  message: 'Operation in progress',
};
