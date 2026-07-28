/**
 * Mock data for catalogs used in tests
 */

export const mockCatalogService = {
  metadata: {
    name: 'app-catalog',
    namespace: 'headlamp-system',
    annotations: {
      'catalog.headlamp.dev/uri': 'http://app-catalog.headlamp-system:8080',
      'catalog.headlamp.dev/name': 'app-catalog',
      'catalog.headlamp.dev/protocol': 'artifacthub',
      'catalog.headlamp.dev/displayName': 'App Catalog',
    },
  },
  spec: {
    ports: [
      {
        name: 'http',
        port: 8080,
        protocol: 'TCP',
      },
    ],
  },
};

export const mockVanillaHelmCatalogService = {
  metadata: {
    name: 'helm-repo',
    namespace: 'default',
    annotations: {
      'catalog.headlamp.dev/name': 'helm-repo',
      'catalog.headlamp.dev/protocol': 'helm',
      'catalog.headlamp.dev/displayName': 'Helm Repository',
    },
    labels: {
      'catalog.headlamp.dev/is-catalog': 'true',
    },
  },
  spec: {
    ports: [
      {
        name: 'http',
        port: 80,
        protocol: 'TCP',
      },
    ],
  },
};

export const mockCatalogList = {
  items: [mockCatalogService, mockVanillaHelmCatalogService],
};

export const mockCatalog = {
  name: 'app-catalog-headlamp-system',
  displayName: 'App Catalog',
  metadataName: 'app-catalog',
  namespace: 'headlamp-system',
  protocol: 'artifacthub',
  uri: 'http://app-catalog.headlamp-system:8080',
};

export const mockCatalogConfig = {
  catalogName: 'app-catalog',
  catalogNamespace: 'headlamp-system',
  chartProfile: 'COMMUNITY_REPOSITORY',
  chartValuesPrefix: 'https://example.com/values',
};
