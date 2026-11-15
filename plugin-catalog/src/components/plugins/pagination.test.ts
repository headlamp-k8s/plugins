import { describe, expect, it, vi } from 'vitest';
import { fetchAllPages } from './pagination';

describe('fetchAllPages', () => {
  it('continues fetching while Artifact Hub returns full pages without a total', async () => {
    const fetchPage = vi.fn(async (offset: number) => ({
      packages: Array.from({ length: offset < 120 ? 60 : 15 }, (_, index) => offset + index),
    }));

    const packages = await fetchAllPages(fetchPage, 60);

    expect(packages).toHaveLength(135);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 60);
    expect(fetchPage).toHaveBeenNthCalledWith(3, 120);
  });

  it('stops fetching when Artifact Hub provides a total', async () => {
    const fetchPage = vi.fn(async (offset: number) => ({
      packages: Array.from({ length: 60 }, (_, index) => offset + index),
      total: 120,
    }));

    const packages = await fetchAllPages(fetchPage, 60);

    expect(packages).toHaveLength(120);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 0);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 60);
  });
});
