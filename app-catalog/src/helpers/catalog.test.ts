import { describe, expect, it, vi } from 'vitest';
import { CatalogLists } from './catalog';

const { mockFetchCatalogs } = vi.hoisted(() => ({
  mockFetchCatalogs: vi.fn(),
}));

vi.mock('../api/catalogs', () => ({
  fetchCatalogs: mockFetchCatalogs,
}));

describe('CatalogLists', () => {
  it('does not throw for a catalog Service with no annotations', async () => {
    mockFetchCatalogs.mockResolvedValue({
      items: [
        {
          metadata: { name: 'my-catalog', namespace: 'default' },
          spec: { ports: [{ name: 'http', port: 8080 }] },
        },
      ],
    });

    const catalogs = await CatalogLists();

    expect(catalogs).toHaveLength(1);
    expect(catalogs[0].uri).toBe('http://my-catalog.default:8080');
  });

  it('still reads annotation values when present', async () => {
    mockFetchCatalogs.mockResolvedValue({
      items: [
        {
          metadata: {
            name: 'my-catalog',
            namespace: 'default',
            annotations: { 'catalog.headlamp.dev/uri': 'https://charts.example.com' },
          },
          spec: { ports: [{ name: 'http', port: 8080 }] },
        },
      ],
    });

    const catalogs = await CatalogLists();

    expect(catalogs[0].uri).toBe('https://charts.example.com');
  });
});
