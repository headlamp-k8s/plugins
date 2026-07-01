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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSourceCacheKey,
  createFetchHttpClient,
  createJSZipExtractor,
  createNoopFileSystem,
} from './BrowserSkillAdapters';

describe('BrowserSkillAdapters', () => {
  describe('createFetchHttpClient', () => {
    it('creates an HTTP client with fetchZip method', () => {
      const client = createFetchHttpClient();
      expect(client).toBeDefined();
      expect(typeof client.fetchZip).toBe('function');
    });

    it('calls fetch with correct headers', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: () => Promise.resolve(mockArrayBuffer),
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse as Response);

      const client = createFetchHttpClient();
      const result = await client.fetchZip('https://api.github.com/repos/owner/repo/zipball/main');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.github.com/repos/owner/repo/zipball/main',
        {
          headers: { Accept: 'application/vnd.github+json' },
          redirect: 'follow',
        }
      );
      expect(result).toBe(mockArrayBuffer);
      fetchSpy.mockRestore();
    });

    it('throws on HTTP error', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const client = createFetchHttpClient();
      await expect(
        client.fetchZip('https://api.github.com/repos/owner/repo/zipball/main')
      ).rejects.toThrow('HTTP 404: Not Found');
      fetchSpy.mockRestore();
    });
  });

  describe('createJSZipExtractor', () => {
    it('creates a ZIP extractor with extractTextFiles method', () => {
      const extractor = createJSZipExtractor();
      expect(extractor).toBeDefined();
      expect(typeof extractor.extractTextFiles).toBe('function');
    });

    it('extracts .md files from a ZIP archive', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      // Simulate GitHub's top-level directory prefix
      zip.file('owner-repo-abc123/skills/SKILL.md', '# Test Skill\nContent here');
      zip.file('owner-repo-abc123/skills/helper.ts', 'export const x = 1;');
      zip.file('owner-repo-abc123/README.md', '# Repo README');

      const data = await zip.generateAsync({ type: 'arraybuffer' });
      const extractor = createJSZipExtractor();
      const result = await extractor.extractTextFiles(data);

      // Should include .md files but not .ts files
      expect(result.has('skills/SKILL.md')).toBe(true);
      expect(result.has('README.md')).toBe(true);
      expect(result.has('skills/helper.ts')).toBe(false);
      expect(result.get('skills/SKILL.md')).toBe('# Test Skill\nContent here');
    });

    it('applies path filter correctly', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      zip.file('owner-repo-abc123/skills/SKILL.md', '# Skill A');
      zip.file('owner-repo-abc123/docs/guide.md', '# Guide');

      const data = await zip.generateAsync({ type: 'arraybuffer' });
      const extractor = createJSZipExtractor();
      const result = await extractor.extractTextFiles(data, 'skills');

      expect(result.size).toBe(1);
      expect(result.has('SKILL.md')).toBe(true);
    });

    it('enforces max file count limit', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (let i = 0; i < 10; i++) {
        zip.file(`root/file${i}.md`, `content ${i}`);
      }

      const data = await zip.generateAsync({ type: 'arraybuffer' });
      const extractor = createJSZipExtractor();
      await expect(
        extractor.extractTextFiles(data, undefined, 10 * 1024 * 1024, 5)
      ).rejects.toThrow('Exceeded max file count');
    });

    it('enforces max extracted size limit', async () => {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      // Create a file larger than the limit
      zip.file('root/big.md', 'x'.repeat(1000));

      const data = await zip.generateAsync({ type: 'arraybuffer' });
      const extractor = createJSZipExtractor();
      await expect(extractor.extractTextFiles(data, undefined, 100, 500)).rejects.toThrow(
        'Exceeded max extracted size'
      );
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

  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
    const urlStr = String(url);
    if (urlStr.includes('api.github.com')) {
      return treeResponse as any;
    }
    // Individual file fetch
    const filename = urlStr.split('/').pop() ?? 'file.md';
    return {
      ok: true,
      text: async () => `# ${filename}`,
    } as any;
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
