/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParsedSkill } from '../parseSkill';
import { MAX_ZIP_EXTRACTED_BYTES } from '../SkillLoader';
import {
  BrowserSkillCache,
  buildSourceCacheKey,
  createArchiveHttpClient,
  createFetchHttpClient,
  createNoopFileSystem,
} from './browser';

function makeParsedSkill(name: string, content = ''): ParsedSkill {
  return {
    metadata: { name, description: name },
    content,
    contentSizeBytes: content.length,
    source: `memory://${name}`,
  };
}

describe('BrowserSkillAdapters', () => {
  describe('createFetchHttpClient', () => {
    it('creates a browser client without zip downloads', () => {
      const client = createFetchHttpClient();
      expect(client).toBeDefined();
      expect(client.fetchZip).toBeUndefined();
      expect(typeof client.fetchFiles).toBe('function');
    });
  });

  describe('createNoopFileSystem', () => {
    it('creates a filesystem where nothing exists', async () => {
      const fs = createNoopFileSystem();
      expect(await fs.exists('/any/path')).toBe(false);
      expect(await fs.readdir('/any/path')).toEqual([]);
      expect(await fs.isDirectory('/any/path')).toBe(false);
    });

    it('throws on readFile', async () => {
      const fs = createNoopFileSystem();
      await expect(fs.readFile('/any/file.md')).rejects.toThrow('Cannot read file in browser');
    });

    it('joins paths with forward slashes', () => {
      const fs = createNoopFileSystem();
      expect(fs.joinPath('a', 'b', 'c')).toBe('a/b/c');
    });
  });

  describe('buildSourceCacheKey', () => {
    it('builds a key from all components', () => {
      expect(buildSourceCacheKey('git', 'https://github.com/owner/repo', 'v1.0', 'skills')).toBe(
        'git:https://github.com/owner/repo:v1.0:skills'
      );
    });

    it('handles missing optional components', () => {
      expect(buildSourceCacheKey('git', 'https://github.com/owner/repo')).toBe(
        'git:https://github.com/owner/repo::'
      );
    });

    it('produces different keys for different refs', () => {
      const key1 = buildSourceCacheKey('git', 'https://github.com/owner/repo', 'main');
      const key2 = buildSourceCacheKey('git', 'https://github.com/owner/repo', 'v2.0');
      expect(key1).not.toBe(key2);
    });
  });
});

// ---------------------------------------------------------------------------
// fetchFiles (Trees-API path) progress tests
// ---------------------------------------------------------------------------

/**
 * Helper that mocks the GitHub Trees API + raw file fetches for
 * fetchGitHubFilesViaTreesApi tests.
 *
 * @param filePaths  - paths returned by the Trees API (all are .md blobs)
 */
function mockGitHubTreesAndFiles(filePaths: string[]) {
  const treeResponse = {
    ok: true,
    json: async () => ({
      truncated: false,
      tree: filePaths.map(path => ({ type: 'blob', path })),
    }),
  };

  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
    const urlStr = String(input);
    if (urlStr.includes('api.github.com')) {
      return treeResponse as unknown as Response;
    }
    // Individual file fetch
    const filename = urlStr.split('/').pop() ?? 'file.md';
    const content = new TextEncoder().encode(`# ${filename}`);
    return {
      ok: true,
      arrayBuffer: async () => content.buffer,
    } as unknown as Response;
  });

  return fetchSpy;
}

describe('createFetchHttpClient - fetchFiles progress reporting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onProgress(0, total) before any files are downloaded', async () => {
    const filePaths = ['skills/a.md', 'skills/b.md', 'skills/c.md'];
    const fetchSpy = mockGitHubTreesAndFiles(filePaths);

    const calls: [number, number][] = [];
    const client = createFetchHttpClient();
    await client.fetchFiles!('https://github.com/owner/repo', 'abc123', 'skills', (done, total) =>
      calls.push([done, total])
    );

    fetchSpy.mockRestore();

    // First call must be (0, 3) — total known, no files fetched yet
    expect(calls[0]).toEqual([0, 3]);
  });

  it('final onProgress call has done === total', async () => {
    const filePaths = ['skills/a.md', 'skills/b.md', 'skills/c.md'];
    const fetchSpy = mockGitHubTreesAndFiles(filePaths);

    const calls: [number, number][] = [];
    const client = createFetchHttpClient();
    await client.fetchFiles!('https://github.com/owner/repo', 'abc123', 'skills', (done, total) =>
      calls.push([done, total])
    );

    fetchSpy.mockRestore();

    const last = calls[calls.length - 1];
    expect(last[0]).toBe(last[1]); // done === total
    expect(last[1]).toBe(3);
  });

  it('progress is monotonically non-decreasing', async () => {
    const filePaths = Array.from({ length: 15 }, (_, i) => `skills/file${i}.md`);
    const fetchSpy = mockGitHubTreesAndFiles(filePaths);

    const calls: [number, number][] = [];
    const client = createFetchHttpClient();
    await client.fetchFiles!('https://github.com/owner/repo', 'abc123', 'skills', (done, total) =>
      calls.push([done, total])
    );

    fetchSpy.mockRestore();

    for (let i = 1; i < calls.length; i++) {
      expect(calls[i][0]).toBeGreaterThanOrEqual(calls[i - 1][0]);
    }
  });

  it('total count reflects only files matching pathFilter', async () => {
    // Tree has 5 files; only 2 are under 'skills/'.
    // 'skills-extra/c.md' must NOT match (regression: old code used startsWith('skills'))
    const filePaths = [
      'skills/a.md',
      'skills/b.md',
      'skills-extra/c.md',
      'docs/guide.md',
      'README.md',
    ];
    const fetchSpy = mockGitHubTreesAndFiles(filePaths);

    const calls: [number, number][] = [];
    const client = createFetchHttpClient();
    await client.fetchFiles!('https://github.com/owner/repo', 'abc123', 'skills', (done, total) =>
      calls.push([done, total])
    );

    fetchSpy.mockRestore();

    // All totals must be exactly 2 — 'skills-extra/c.md' must not be counted
    const totals = calls.map(([, total]) => total);
    expect(totals.every(t => t === 2)).toBe(true);
    expect(calls[calls.length - 1][0]).toBe(2);
  });

  it('does not call onProgress when onProgress is undefined', async () => {
    const filePaths = ['skills/a.md'];
    const fetchSpy = mockGitHubTreesAndFiles(filePaths);

    const client = createFetchHttpClient();
    // Should not throw when onProgress is omitted
    await expect(
      client.fetchFiles!('https://github.com/owner/repo', 'abc123', 'skills')
    ).resolves.toBeDefined();

    fetchSpy.mockRestore();
  });
});

// ── fetchZip streaming with progress ─────────────────────────────────────────

describe('createFetchHttpClient — fetchZip streaming with progress', () => {
  beforeEach(() => vi.restoreAllMocks());

  function makeStreamingFetch(chunks: Uint8Array[], contentLength = 0) {
    let index = 0;
    const reader = {
      read: async () => {
        if (index >= chunks.length) return { done: true, value: undefined };
        return { done: false, value: chunks[index++] };
      },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (h: string) => (h === 'Content-Length' ? String(contentLength) : null),
      },
      body: { getReader: () => reader },
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as Response);
  }

  it('calls onProgress with cumulative byte count per chunk', async () => {
    const chunks = [new Uint8Array(100), new Uint8Array(200), new Uint8Array(50)];
    makeStreamingFetch(chunks, 350);

    const calls: [number, number][] = [];
    const client = createArchiveHttpClient();
    await client.fetchZip!('https://example.com/repo.zip', (bytes, total) =>
      calls.push([bytes, total])
    );

    // Three chunks → three progress calls
    expect(calls).toHaveLength(3);
    expect(calls[0][0]).toBe(100);
    expect(calls[1][0]).toBe(300);
    expect(calls[2][0]).toBe(350);
    // Total is the Content-Length header value
    expect(calls.every(([, t]) => t === 350)).toBe(true);
  });

  it('assembles chunks into a single ArrayBuffer', async () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([4, 5]);
    makeStreamingFetch([a, b], 5);

    const client = createArchiveHttpClient();
    const buf = await client.fetchZip!('https://example.com/repo.zip', () => {});
    const view = new Uint8Array(buf);
    expect(Array.from(view)).toEqual([1, 2, 3, 4, 5]);
  });

  it('falls back to arrayBuffer() when response.body is null', async () => {
    const expected = new ArrayBuffer(42);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      body: null, // no streaming body
      arrayBuffer: async () => expected,
    } as unknown as Response);

    const client = createArchiveHttpClient();
    // onProgress is provided but body is null → falls back to arrayBuffer()
    const buf = await client.fetchZip!('https://example.com/repo.zip', () => {});
    expect(buf).toBe(expected);
  });

  it('falls back to arrayBuffer() when onProgress is undefined', async () => {
    const expected = new ArrayBuffer(7);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      body: { getReader: vi.fn() }, // should NOT be called
      arrayBuffer: async () => expected,
    } as unknown as Response);

    const client = createArchiveHttpClient();
    const buf = await client.fetchZip!('https://example.com/repo.zip');
    expect(buf).toBe(expected);
  });
});

// ── fetchGitHubFilesViaTreesApi edge cases ────────────────────────────────────

describe('createFetchHttpClient — fetchFiles edge cases', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('warns when GitHub tree response is truncated', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ truncated: true, tree: [] }),
    } as unknown as Response);
    const client = createFetchHttpClient();
    await client.fetchFiles!('https://github.com/owner/repo', 'main');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('truncated'));
  });

  it('rejects oversized declared Git blobs before downloading raw files', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        truncated: false,
        tree: [{ type: 'blob', path: 'SKILL.md', size: MAX_ZIP_EXTRACTED_BYTES + 1 }],
      }),
    } as unknown as Response);
    const client = createFetchHttpClient();
    await expect(client.fetchFiles!('https://github.com/owner/repo', 'main')).rejects.toThrow(
      'Exceeded max total size'
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a raw response whose bytes exceed the remaining budget', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ truncated: false, tree: [{ type: 'blob', path: 'SKILL.md' }] }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        arrayBuffer: async () => new ArrayBuffer(MAX_ZIP_EXTRACTED_BYTES + 1),
      } as unknown as Response);
    const client = createFetchHttpClient();
    await expect(client.fetchFiles!('https://github.com/owner/repo', 'main')).rejects.toThrow(
      'Exceeded max total size'
    );
  });

  it('throws when file download returns HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          truncated: false,
          tree: [{ type: 'blob', path: 'SKILL.md' }],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

    const client = createFetchHttpClient();
    await expect(client.fetchFiles!('https://github.com/owner/repo', 'main')).rejects.toThrow(
      'HTTP 404'
    );
  });

  it('skips non-blob tree entries (directories)', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          truncated: false,
          tree: [
            { type: 'tree', path: 'skills' }, // directory — must be skipped
            { type: 'blob', path: 'skills/SKILL.md' },
          ],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode('# content').buffer,
      } as unknown as Response);

    const client = createFetchHttpClient();
    const result = await client.fetchFiles!('https://github.com/owner/repo', 'main', 'skills');
    expect(result.size).toBe(1);
    expect(result.has('SKILL.md')).toBe(true);
  });

  it('skips entries whose path does not match pathFilter/ prefix', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          truncated: false,
          tree: [
            { type: 'blob', path: 'skills-extra/other.md' }, // 'skills-extra/' ≠ 'skills/'
            { type: 'blob', path: 'skills/ok.md' },
          ],
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode('# ok').buffer,
      } as unknown as Response);

    const client = createFetchHttpClient();
    const result = await client.fetchFiles!('https://github.com/owner/repo', 'main', 'skills');
    expect(result.size).toBe(1);
    expect(result.has('ok.md')).toBe(true);
  });

  it('returns all .md files when no pathFilter is given', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          truncated: false,
          tree: [
            { type: 'blob', path: 'a/SKILL.md' },
            { type: 'blob', path: 'b/guide.md' },
          ],
        }),
      } as unknown as Response)
      .mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode('# content').buffer,
      } as unknown as Response);

    const client = createFetchHttpClient();
    const result = await client.fetchFiles!('https://github.com/owner/repo', 'main');
    expect(result.size).toBe(2);
  });
});

// ── BrowserSkillCache — mock IndexedDB ───────────────────────────────────────

/** Minimal in-memory IndexedDB mock sufficient for BrowserSkillCache tests. */
function createMockIndexedDB() {
  interface CacheEntry {
    key: string;
    skills: string;
    cachedAt: number;
  }

  interface MockRequest<T> {
    result: T;
    error: unknown;
    onsuccess?: () => void;
    onerror?: () => void;
    onupgradeneeded?: () => void;
  }

  const store = new Map<string, CacheEntry>();

  const makeRequest = <T>(resultFn: () => T): MockRequest<T | undefined> => {
    const req: MockRequest<T | undefined> = { result: undefined, error: null };
    // Use queueMicrotask so the callback fires before the next await
    queueMicrotask(() => {
      try {
        req.result = resultFn();
        req.onsuccess?.();
      } catch (e) {
        req.error = e;
        req.onerror?.();
      }
    });
    return req;
  };

  const makeStore = () => ({
    get: (key: string) => makeRequest(() => store.get(key)),
    put: (entry: CacheEntry) =>
      makeRequest(() => {
        store.set(entry.key, entry);
      }),
    clear: () =>
      makeRequest(() => {
        store.clear();
      }),
  });

  const makeTx = () => ({ objectStore: () => makeStore() });

  const db = {
    transaction: () => makeTx(),
    objectStoreNames: { contains: () => true },
    createObjectStore: () => {},
  };

  const mockIndexedDB = {
    open: () => {
      // Create a fresh request per open() call so handlers can be set after open() returns
      const req: MockRequest<typeof db | null> = { result: null, error: null };
      queueMicrotask(() => {
        req.result = db;
        req.onsuccess?.();
      });
      return req;
    },
    _store: store,
  };

  return mockIndexedDB;
}

describe('BrowserSkillCache', () => {
  let originalIndexedDB: unknown;
  let mockIndexedDB: ReturnType<typeof createMockIndexedDB>;

  beforeEach(() => {
    originalIndexedDB = Reflect.get(globalThis, 'indexedDB') as unknown;
    mockIndexedDB = createMockIndexedDB();
    Reflect.set(globalThis, 'indexedDB', mockIndexedDB);
  });

  afterEach(() => {
    Reflect.set(globalThis, 'indexedDB', originalIndexedDB);
  });

  it('returns null for a key that has never been set', async () => {
    const cache = new BrowserSkillCache();
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('stores and retrieves skills', async () => {
    const cache = new BrowserSkillCache();
    const skills = [makeParsedSkill('test-skill', '# Test')];
    await cache.set('key1', skills);
    const result = await cache.get('key1');
    expect(result).toEqual(skills);
  });

  it('returns null for an expired entry', async () => {
    const cache = new BrowserSkillCache(1000); // 1 second TTL
    const skills = [makeParsedSkill('old-skill')];
    await cache.set('key1', skills);

    // Manually expire the entry by backdating cachedAt
    const entry = mockIndexedDB._store.get('key1');
    expect(entry).toBeDefined();
    mockIndexedDB._store.set('key1', { ...entry!, cachedAt: Date.now() - 2000 });

    const result = await cache.get('key1');
    expect(result).toBeNull();
  });

  it('returns null when the stored skills JSON is corrupt', async () => {
    mockIndexedDB._store.set('bad-key', {
      key: 'bad-key',
      skills: 'not valid json {{{',
      cachedAt: Date.now(),
    });
    const cache = new BrowserSkillCache();
    const result = await cache.get('bad-key');
    expect(result).toBeNull();
  });

  it('clears all entries', async () => {
    const cache = new BrowserSkillCache();
    await cache.set('a', []);
    await cache.set('b', []);
    await cache.clear();

    expect(mockIndexedDB._store.size).toBe(0);
  });

  it('get returns null when IndexedDB is unavailable', async () => {
    Reflect.set(globalThis, 'indexedDB', undefined);
    const cache = new BrowserSkillCache();
    const result = await cache.get('any-key');
    expect(result).toBeNull();
  });

  it('set resolves silently when IndexedDB is unavailable', async () => {
    Reflect.set(globalThis, 'indexedDB', undefined);
    const cache = new BrowserSkillCache();
    await expect(cache.set('key', [])).resolves.toBeUndefined();
  });

  it('clear resolves silently when IndexedDB is unavailable', async () => {
    Reflect.set(globalThis, 'indexedDB', undefined);
    const cache = new BrowserSkillCache();
    await expect(cache.clear()).resolves.toBeUndefined();
  });

  it('uses the TTL passed to the constructor', async () => {
    const shortTtl = new BrowserSkillCache(500);
    const longTtl = new BrowserSkillCache(3_600_000);
    const skills = [makeParsedSkill('sk')];

    // Store under same key via different cache instances (same IDB)
    await shortTtl.set('ttl-key', skills);
    const entry = mockIndexedDB._store.get('ttl-key');
    expect(entry).toBeDefined();
    // Backdate by 600ms — expired for shortTtl, fresh for longTtl
    mockIndexedDB._store.set('ttl-key', { ...entry!, cachedAt: Date.now() - 600 });

    expect(await shortTtl.get('ttl-key')).toBeNull(); // expired
    expect(await longTtl.get('ttl-key')).toEqual(skills); // still fresh
  });
});
