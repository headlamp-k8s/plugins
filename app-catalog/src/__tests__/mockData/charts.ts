/**
 * Mock data for Helm charts used in tests
 */

export const mockChartMetadata = {
  name: 'nginx',
  version: '1.0.0',
  appVersion: '1.21.0',
  icon: 'https://example.com/nginx-icon.png',
};

export const mockChart = {
  name: 'nginx',
  version: '1.0.0',
  description: 'NGINX web server',
  icon: 'https://example.com/nginx-icon.png',
  logo_image_id: 'nginx-logo',
  app_version: '1.21.0',
  repository: {
    name: 'bitnami',
    url: 'https://charts.bitnami.com/bitnami',
    verified_publisher: true,
  },
  cncf: false,
  official: true,
  sources: ['https://github.com/bitnami/charts'],
  package_id: 'nginx-package-id',
  maintainers: [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Smith', email: 'jane@example.com' },
  ],
  readme: '# NGINX Chart\n\nThis is a Helm chart for NGINX.',
};

export const mockChartList = {
  data: {
    packages: [
      mockChart,
      {
        ...mockChart,
        name: 'redis',
        version: '2.0.0',
        description: 'Redis in-memory database',
        app_version: '6.2.0',
        package_id: 'redis-package-id',
      },
      {
        ...mockChart,
        name: 'postgres',
        version: '3.0.0',
        description: 'PostgreSQL database',
        app_version: '13.0',
        package_id: 'postgres-package-id',
        repository: {
          ...mockChart.repository,
          verified_publisher: false,
        },
      },
    ],
  },
  metadata: {
    limit: 12,
    offset: 0,
    total: 3,
  },
};

export const mockChartDetail = {
  name: 'nginx',
  version: '1.0.0',
  description: 'NGINX web server chart',
  available_versions: [
    { version: '1.0.0', created_at: '2024-01-15' },
    { version: '0.9.0', created_at: '2024-01-01' },
    { version: '0.8.0', created_at: '2023-12-15' },
  ],
  app_version: '1.21.0',
  readme: '# NGINX Helm Chart\n\nComplete documentation here...',
  maintainers: [
    { name: 'John Doe', email: 'john@example.com' },
  ],
  repository: {
    name: 'bitnami',
    url: 'https://charts.bitnami.com/bitnami',
    verified_publisher: true,
  },
};

export const mockChartValues = `# Default values for nginx
replicaCount: 1
image:
  repository: nginx
  tag: "1.21.0"
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
resources:
  limits:
    cpu: 100m
    memory: 128Mi
  requests:
    cpu: 100m
    memory: 128Mi
`;

export const mockVanillaHelmIndex = {
  apiVersion: 'v1',
  entries: {
    nginx: [
      {
        name: 'nginx',
        version: '1.0.0',
        appVersion: '1.21.0',
        description: 'NGINX web server',
        icon: 'https://example.com/nginx-icon.png',
        urls: ['charts/nginx-1.0.0.tgz'],
      },
      {
        name: 'nginx',
        version: '0.9.0',
        appVersion: '1.20.0',
        description: 'NGINX web server',
        icon: 'https://example.com/nginx-icon.png',
        urls: ['charts/nginx-0.9.0.tgz'],
      },
    ],
    redis: [
      {
        name: 'redis',
        version: '2.0.0',
        appVersion: '6.2.0',
        description: 'Redis database',
        urls: ['charts/redis-2.0.0.tgz'],
      },
    ],
  },
};
