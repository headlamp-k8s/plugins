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

import type { ParsedSkill } from '../parseSkill';
import type { SkillFileSystem, SkillHttpClient, SkillZipExtractor } from '../SkillLoader';
import { MAX_ZIP_EXTRACTED_BYTES, MAX_ZIP_FILE_COUNT } from '../SkillLoader';

/**
 * Browser-compatible HTTP client for fetching skill files from GitHub.
 *
 * Uses the GitHub Trees API + raw.githubusercontent.com to fetch individual
 * files. It intentionally does not expose archive downloads because GitHub
 * zipball requests are blocked by browser CORS.
 *
 * @returns Browser-safe HTTP adapter using GitHub Trees API retrieval only.
 */
export function createFetchHttpClient(): SkillHttpClient {
  return {
    /**
     * Fetches markdown files through the GitHub Trees and raw-content APIs.
     *
     * @param repoUrl - GitHub repository URL.
     * @param ref - Git reference passed to both GitHub endpoints.
     * @param pathFilter - Optional repository subdirectory to include and strip.
     * @param onProgress - Optional callback receiving completed and total file counts.
     * @returns Markdown contents keyed by path relative to the filter.
     */
    fetchFiles: (
      repoUrl: string,
      ref: string,
      pathFilter?: string,
      onProgress?: (done: number, total: number) => void
    ) => fetchGitHubFilesViaTreesApi(repoUrl, ref, pathFilter, onProgress),
  };
}

/**
 * Creates an archive HTTP client for non-browser environments such as the CLI.
 *
 * @returns HTTP adapter exposing GitHub zipball downloads with byte progress.
 */
export function createArchiveHttpClient(): SkillHttpClient {
  return {
    fetchZip: async (
      url: string,
      onProgress?: (bytes: number, total: number) => void
    ): Promise<ArrayBuffer> => {
      const response = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' },
        redirect: 'follow',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
      }
      if (onProgress && response.body) {
        const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          onProgress(received, contentLength);
        }
        const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        return result.buffer;
      }
      return response.arrayBuffer();
    },
  };
}

/**
 * Fetches `.md` skill files from a GitHub repository using the Trees API
 * and raw.githubusercontent.com. Both endpoints send
 * `Access-Control-Allow-Origin: *`, so this works from any browser origin.
 *
 * Flow:
 * 1. `GET api.github.com/repos/{owner}/{repo}/git/trees/{ref}?recursive=1`
 * 2. Filter for `.md` files under `pathFilter`
 * 3. Fetch each via `raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}`
 * 4. Return `Map<cleanPath, content>` matching the zip extractor format
 *
 * Enforces the same size and file count limits as the zip extractor.
 *
 * @param repoUrl - GitHub repository URL containing owner and repository path segments.
 * @param ref - Git reference used for tree and raw-content requests.
 * @param pathFilter - Optional subdirectory used to filter and relativize paths.
 * @param onProgress - Optional callback receiving completed and total file counts.
 * @returns Markdown contents keyed by paths relative to the filter.
 */
async function fetchGitHubFilesViaTreesApi(
  repoUrl: string,
  ref: string,
  pathFilter?: string,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, string>> {
  const parsed = new URL(repoUrl);
  if (parsed.hostname !== 'github.com') {
    throw new Error(`fetchFiles only supports github.com: ${repoUrl}`);
  }
  const pathParts = parsed.pathname
    .replace(/\.git$/, '')
    .split('/')
    .filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }
  const owner = pathParts[0];
  const repo = pathParts[1];

  // 1. Fetch the recursive file tree
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  const treeResp = await fetch(treeUrl, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!treeResp.ok) {
    throw new Error(`GitHub Trees API HTTP ${treeResp.status}: ${treeResp.statusText}`);
  }
  const treeData = await treeResp.json();

  if (treeData.truncated) {
    console.warn('GitHub tree response was truncated — some skill files may be missing.');
  }

  // 2. Filter for .md blobs under pathFilter.
  // Use 'pathFilter/' as the prefix so 'skills' doesn't match 'skills-extra/...'.
  const pathPrefix = pathFilter ? `${pathFilter}/` : '';
  const mdEntries: Array<{
    /** Repository-relative markdown file path. */
    path: string;
    /** Git-reported blob size in bytes. */
    size?: number;
  }> = [];
  for (const entry of treeData.tree) {
    if (entry.type !== 'blob') continue;
    if (!entry.path.endsWith('.md')) continue;
    if (pathPrefix && !entry.path.startsWith(pathPrefix)) continue;
    mdEntries.push({
      path: entry.path,
      size: typeof entry.size === 'number' ? entry.size : undefined,
    });
  }

  if (mdEntries.length > MAX_ZIP_FILE_COUNT) {
    throw new Error(`Too many skill files (${mdEntries.length}), max is ${MAX_ZIP_FILE_COUNT}`);
  }
  const declaredBytes = mdEntries.reduce((total, entry) => total + (entry.size ?? 0), 0);
  if (declaredBytes > MAX_ZIP_EXTRACTED_BYTES) {
    throw new Error(`Exceeded max total size: ${MAX_ZIP_EXTRACTED_BYTES} bytes`);
  }

  // Report total count before starting downloads
  onProgress?.(0, mdEntries.length);

  // 3. Fetch contents sequentially so one cumulative byte budget is enforced.
  const result = new Map<string, string>();
  let totalBytes = 0;
  let fetched_count = 0;

  for (const entry of mdEntries) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${entry.path}`;
    const resp = await fetch(rawUrl);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} fetching ${rawUrl}`);
    }
    const remainingBytes = MAX_ZIP_EXTRACTED_BYTES - totalBytes;
    const contentLength = Number(resp.headers?.get?.('Content-Length') ?? 0);
    if (contentLength > remainingBytes) {
      throw new Error(`Exceeded max total size: ${MAX_ZIP_EXTRACTED_BYTES} bytes`);
    }
    const bytes = new Uint8Array(await resp.arrayBuffer());
    if (bytes.byteLength > remainingBytes) {
      throw new Error(`Exceeded max total size: ${MAX_ZIP_EXTRACTED_BYTES} bytes`);
    }
    totalBytes += bytes.byteLength;
    const cleanPath = pathPrefix ? entry.path.slice(pathPrefix.length) : entry.path;
    if (cleanPath) {
      result.set(cleanPath, new TextDecoder().decode(bytes));
    }
    fetched_count++;
    onProgress?.(fetched_count, mdEntries.length);
  }

  return result;
}

/**
 * Browser-compatible ZIP extractor using JSZip.
 *
 * Extracts `.md` files from GitHub-style zip archives (which have a
 * top-level `owner-repo-sha/` directory prefix). Enforces size and
 * file count limits to prevent zip bomb attacks.
 *
 * Works in both browser and Node.js environments since JSZip is
 * a pure JavaScript implementation.
 *
 * @returns ZIP extractor for bounded markdown-file extraction.
 */
export function createJSZipExtractor(): SkillZipExtractor {
  return {
    /**
     * Extracts markdown text from a GitHub-style ZIP archive.
     *
     * @param data - ZIP archive bytes.
     * @param pathFilter - Optional archive subdirectory to include and strip.
     * @param maxExtractedBytes - Maximum cumulative uncompressed UTF-8 bytes.
     * @param maxFileCount - Maximum number of extracted markdown files.
     * @returns Markdown contents keyed by normalized relative path.
     */
    extractTextFiles: async (
      data: ArrayBuffer,
      pathFilter?: string,
      maxExtractedBytes: number = MAX_ZIP_EXTRACTED_BYTES,
      maxFileCount: number = MAX_ZIP_FILE_COUNT
    ): Promise<Map<string, string>> => {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(data);
      const result = new Map<string, string>();
      let totalBytes = 0;
      let fileCount = 0;

      // GitHub zips have a top-level directory like "owner-repo-sha/"
      const entries = Object.keys(zip.files).sort();
      const topLevelPrefix = entries.length > 0 ? entries[0].split('/')[0] + '/' : '';
      const normalizedPathFilter = pathFilter?.replace(/^\/+|\/+$/g, '');

      for (const entryPath of entries) {
        const entry = zip.files[entryPath];
        if (entry.dir) continue;

        // Strip the top-level GitHub directory prefix
        let relativePath = entryPath;
        if (topLevelPrefix && relativePath.startsWith(topLevelPrefix)) {
          relativePath = relativePath.slice(topLevelPrefix.length);
        }

        // Apply path filter if provided
        if (
          normalizedPathFilter &&
          relativePath !== normalizedPathFilter &&
          !relativePath.startsWith(`${normalizedPathFilter}/`)
        ) {
          continue;
        }

        // Only extract .md files
        if (!relativePath.endsWith('.md')) continue;

        const entryMetadata = entry as unknown as {
          _data?: { uncompressedSize?: unknown };
        };
        const declaredSize = entryMetadata._data?.uncompressedSize;
        if (typeof declaredSize === 'number' && totalBytes + declaredSize > maxExtractedBytes) {
          throw new Error(`Exceeded max extracted size: ${maxExtractedBytes} bytes`);
        }
        const content = await entry.async('string');
        totalBytes += new TextEncoder().encode(content).byteLength;
        fileCount++;

        if (totalBytes > maxExtractedBytes) {
          throw new Error(`Exceeded max extracted size: ${maxExtractedBytes} bytes`);
        }
        if (fileCount > maxFileCount) {
          throw new Error(`Exceeded max file count: ${maxFileCount}`);
        }

        // Strip the path filter prefix from the relative path
        const cleanPath = normalizedPathFilter
          ? relativePath.slice(normalizedPathFilter.length).replace(/^\//, '')
          : relativePath;

        if (cleanPath) {
          result.set(cleanPath, content);
        }
      }

      return result;
    },
  };
}

/**
 * No-op filesystem for environments without filesystem access (browser).
 *
 * Query operations return empty results, while file reads throw. Local skill
 * directories are only available in desktop/CLI mode — browser mode only
 * supports GitHub repository sources.
 *
 * @returns Filesystem adapter with empty queries and a throwing read operation.
 */
export function createNoopFileSystem(): SkillFileSystem {
  return {
    /**
     * Reports that no path exists.
     *
     * @returns Always `false`.
     */
    exists: async () => false,
    /**
     * Lists no directory entries.
     *
     * @returns Always an empty array.
     */
    readdir: async () => [],
    /**
     * Rejects file reads in browser-only environments.
     *
     * @param path - Path included in the unsupported-operation error.
     * @returns A promise that always rejects.
     */
    readFile: async (path: string) => {
      throw new Error(`Cannot read file in browser: ${path}`);
    },
    /**
     * Reports that no path is a directory.
     *
     * @returns Always `false`.
     */
    isDirectory: async () => false,
    /**
     * Joins path segments with forward slashes.
     *
     * @param segments - Path segments to concatenate.
     * @returns Slash-delimited path without additional normalization.
     */
    joinPath: (...segments: string[]) => segments.join('/'),
  };
}

/** Cache entry stored in IndexedDB. */
interface SkillCacheEntry {
  /** Cache key (source URL + ref + path). */
  key: string;
  /** Serialized ParsedSkill array. */
  skills: string;
  /** Timestamp when the entry was cached. */
  cachedAt: number;
}

const DB_NAME = 'headlamp-ai-skills';
const DB_VERSION = 1;
const STORE_NAME = 'skills';

/**
 * Opens (or creates) the IndexedDB database for skill caching.
 *
 * @returns Database connection after any required object-store creation.
 */
function openSkillsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB-backed cache for parsed skills.
 *
 * Persists downloaded and parsed skills in the browser so they survive
 * page reloads. Each source is stored separately, keyed by
 * `{type}:{url}:{ref}:{path}`.
 *
 * Falls back gracefully: if IndexedDB is unavailable (e.g. private
 * browsing in some browsers), all operations return null/resolve
 * without error.
 */
export class BrowserSkillCache {
  private cacheTtlMs: number;

  /**
   * Creates an IndexedDB-backed skill cache.
   *
   * @param cacheTtlMs - How long cached skills remain valid (default: 1 hour).
   */
  constructor(cacheTtlMs: number = 60 * 60 * 1000) {
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Retrieves cached skills for a source key.
   *
   * @param key - Source cache key.
   * @returns Parsed skill objects, or null if not cached or expired.
   */
  async get(key: string): Promise<ParsedSkill[] | null> {
    try {
      const db = await openSkillsDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result as SkillCacheEntry | undefined;
          if (!entry) {
            resolve(null);
            return;
          }
          if (Date.now() - entry.cachedAt > this.cacheTtlMs) {
            resolve(null);
            return;
          }
          try {
            resolve(JSON.parse(entry.skills));
          } catch {
            resolve(null);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Stores parsed skills for a source key.
   *
   * @param key - Source cache key.
   * @param skills - Parsed skill objects to cache.
   * @returns No value; IndexedDB failures are ignored.
   */
  async set(key: string, skills: ParsedSkill[]): Promise<void> {
    try {
      const db = await openSkillsDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const entry: SkillCacheEntry = {
          key,
          skills: JSON.stringify(skills),
          cachedAt: Date.now(),
        };
        const request = store.put(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // IndexedDB not available — skip silently
    }
  }

  /**
   * Removes all cached skills.
   *
   * @returns No value; IndexedDB failures are ignored.
   */
  async clear(): Promise<void> {
    try {
      const db = await openSkillsDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // IndexedDB not available — skip silently
    }
  }
}

/**
 * Builds a cache key for a skill source configuration.
 *
 * @param type - Source type ('local' or 'git').
 * @param url - Source URL or path.
 * @param ref - Git ref (optional).
 * @param path - Subdirectory path (optional).
 * @returns A stable string key for cache lookups.
 */
export function buildSourceCacheKey(
  type: string,
  url: string,
  ref?: string,
  path?: string
): string {
  return `${type}:${url}:${ref || ''}:${path || ''}`;
}
