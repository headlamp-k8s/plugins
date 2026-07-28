import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalogsApi from '../api/catalogs';
import { mockCatalogList } from '../__tests__/mockData';
import { AvailableComponentVersions, CatalogLists } from './catalog';

// Mock the catalogs API
vi.mock('../api/catalogs', () => ({
  fetchCatalogs: vi.fn(),
}));

describe('Catalog Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CatalogLists', () => {
    it('should fetch and process catalog list', async () => {
      vi.mocked(catalogsApi.fetchCatalogs).mockResolvedValue(mockCatalogList);

      const result = await CatalogLists();

      expect(catalogsApi.fetchCatalogs).toHaveBeenCalledOnce();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'app-catalog-headlamp-system',
        displayName: 'App Catalog',
        metadataName: 'app-catalog',
        namespace: 'headlamp-system',
        protocol: 'artifacthub',
        uri: 'http://app-catalog.headlamp-system:8080',
      });
    });

    it('should prioritize default catalog as first element', async () => {
      const customCatalog = {
        metadata: {
          name: 'custom-catalog',
          namespace: 'default',
          annotations: {
            'catalog.headlamp.dev/name': 'custom',
            'catalog.headlamp.dev/protocol': 'helm',
            'catalog.headlamp.dev/displayName': 'Custom',
          },
        },
        spec: {
          ports: [{ name: 'http', port: 8080, protocol: 'TCP' }],
        },
      };

      vi.mocked(catalogsApi.fetchCatalogs).mockResolvedValue({
        items: [customCatalog, mockCatalogList.items[0]],
      });

      const result = await CatalogLists();

      // Default catalog (app-catalog in headlamp-system) should be first
      expect(result[0].metadataName).toBe('app-catalog');
      expect(result[0].namespace).toBe('headlamp-system');
    });

    it('should construct URI from service ports if annotation missing', async () => {
      const catalogWithoutUri = {
        metadata: {
          name: 'test-catalog',
          namespace: 'test-ns',
          annotations: {
            'catalog.headlamp.dev/name': 'test',
            'catalog.headlamp.dev/protocol': 'helm',
            'catalog.headlamp.dev/displayName': 'Test Catalog',
          },
        },
        spec: {
          ports: [
            {
              name: 'https',
              port: 443,
              protocol: 'TCP',
            },
          ],
        },
      };

      vi.mocked(catalogsApi.fetchCatalogs).mockResolvedValue({
        items: [catalogWithoutUri],
      });

      const result = await CatalogLists();

      expect(result[0].uri).toBe('https://test-catalog.test-ns:443');
    });

    it('should use name annotation as displayName if displayName annotation is empty', async () => {
      const catalogWithoutDisplayName = {
        metadata: {
          name: 'catalog-name',
          namespace: 'default',
          annotations: {
            'catalog.headlamp.dev/name': 'Catalog Name',
            'catalog.headlamp.dev/protocol': 'helm',
            'catalog.headlamp.dev/displayName': '',
          },
        },
        spec: {
          ports: [{ name: 'http', port: 80, protocol: 'TCP' }],
        },
      };

      vi.mocked(catalogsApi.fetchCatalogs).mockResolvedValue({
        items: [catalogWithoutDisplayName],
      });

      const result = await CatalogLists();

      expect(result[0].displayName).toBe('Catalog Name');
    });

    it('should handle empty catalog list', async () => {
      vi.mocked(catalogsApi.fetchCatalogs).mockResolvedValue({ items: [] });

      const result = await CatalogLists();

      expect(result).toEqual([]);
    });
  });

  describe('AvailableComponentVersions', () => {
    it('should extract versions from chart entries', () => {
      const chartEntries = {
        nginx: [
          { version: '1.0.0' },
          { version: '0.9.0' },
          { version: '0.8.0' },
        ],
        redis: [
          { version: '2.0.0' },
          { version: '1.9.0' },
        ],
      };

      const result = AvailableComponentVersions(chartEntries);

      expect(result.size).toBe(2);
      expect(result.get('nginx')).toEqual([
        { version: '1.0.0' },
        { version: '0.9.0' },
        { version: '0.8.0' },
      ]);
      expect(result.get('redis')).toEqual([
        { version: '2.0.0' },
        { version: '1.9.0' },
      ]);
    });

    it('should handle single version per component', () => {
      const chartEntries = {
        postgres: [{ version: '3.0.0' }],
      };

      const result = AvailableComponentVersions(chartEntries);

      expect(result.size).toBe(1);
      expect(result.get('postgres')).toEqual([{ version: '3.0.0' }]);
    });

    it('should handle empty chart entries', () => {
      const chartEntries = {};

      const result = AvailableComponentVersions(chartEntries);

      expect(result.size).toBe(0);
    });

    it('should handle component with empty versions array', () => {
      const chartEntries = {
        nginx: [],
      };

      const result = AvailableComponentVersions(chartEntries);

      expect(result.size).toBe(1);
      expect(result.get('nginx')).toEqual([]);
    });
  });
});
