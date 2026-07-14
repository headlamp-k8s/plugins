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

import {
  DEFAULT_MAX_SKILL_SIZE_BYTES,
  parseCopilotInstructionsFile,
  ParsedSkill,
  parseSkillFile,
} from './parseSkill';

/**
 * Configuration for a skill source that tells the loader where to find skills.
 */
export interface SkillSource {
  /** Type of source: local directory or Git repository. */
  type: 'local' | 'git';
  /**
   * Location of the skill source.
   * - For `local` sources: absolute filesystem path to a directory.
   * - For `git` sources: HTTPS URL to a Git repository.
   */
  url: string;
  /** Git ref (tag, branch, or SHA) to fetch. Only used for Git sources. */
  ref?: string;
  /** Optional subdirectory within the source to scan for skills. */
  path?: string;
  /** Whether this source is active. */
  enabled: boolean;
  /**
   * Expected SHA-256 hash of the downloaded skill content.
   * Used to verify integrity of remote Git sources. If set, the loader will
   * compute a hash of the extracted skill files and reject the source if it
   * doesn't match.
   */
  sha256?: string;
}

/** Well-known directories that may contain skills in a project. */
export const WELL_KNOWN_SKILL_DIRS = [
  /** GitHub Copilot skills. */
  '.github/skills',
  /** GitHub Copilot instructions. */
  '.github/instructions',
  /** Claude Code project skills. */
  '.claude/skills',
  /** Generic skills directory. */
  'skills',
] as const;

/**
 * Validates that a URL is safe for fetching.
 *
 * Only HTTPS URLs to github.com are allowed. This prevents SSRF and
 * ensures all fetches go through authenticated, encrypted channels.
 *
 * @param url - The URL to validate.
 * @returns True if the URL is safe to fetch.
 */
export function isValidGitUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname
      .replace(/\.git$/i, '')
      .split('/')
      .filter(Boolean);
    return (
      parsed.origin === 'https://github.com' &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash &&
      pathParts.length === 2
    );
  } catch {
    return false;
  }
}

/**
 * Constructs the GitHub API zipball URL for a repository.
 *
 * @param repoUrl - Repository URL (e.g. "https://github.com/owner/repo").
 * @param ref - Git ref to download (tag, branch, or SHA). Defaults to "main".
 * @returns The zipball download URL.
 * @throws If the URL is not a valid GitHub repository URL.
 */
export function buildGitHubZipUrl(repoUrl: string, ref: string = 'main'): string {
  const parsed = new URL(repoUrl);
  if (parsed.hostname !== 'github.com') {
    throw new Error(`Only GitHub URLs are supported for zip download: ${repoUrl}`);
  }

  // Extract owner/repo from path like /owner/repo or /owner/repo.git
  const pathParts = parsed.pathname
    .replace(/\.git$/, '')
    .split('/')
    .filter(Boolean);

  if (pathParts.length < 2) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  const owner = pathParts[0];
  const repo = pathParts[1];

  return `https://api.github.com/repos/${owner}/${repo}/zipball/${ref}`;
}

/**
 * Checks whether a Git ref looks like a full commit SHA (40 hex chars)
 * or a tag-like ref (starts with `v` followed by a digit, or contains no `/`
 * other than `refs/tags/`). Branch names like `main` or `develop` are mutable.
 *
 * @param ref - The Git ref string.
 * @returns True if the ref appears to be a pinned (immutable) reference.
 */
export function isPinnedRef(ref: string): boolean {
  // Full SHA-1 (40 hex chars) — standard Git commit hash
  if (/^[0-9a-f]{40}$/.test(ref)) {
    return true;
  }
  // Full SHA-256 (64 hex chars) — future Git hash format (not yet used by GitHub,
  // included for forward compatibility with Git's SHA-256 transition)
  if (/^[0-9a-f]{64}$/.test(ref)) {
    return true;
  }
  // Looks like a semver tag: v1.0.0, 1.2.3, etc.
  if (/^v?\d+\.\d+/.test(ref)) {
    return true;
  }
  return false;
}

/**
 * Validates that a resolved path stays within the expected base directory.
 * Prevents path traversal attacks (e.g., `../../etc/passwd`).
 *
 * @param basePath - The base directory that paths must stay within.
 * @param targetPath - The resolved path to validate.
 * @returns True if targetPath is within basePath.
 */
export function isPathWithinBase(basePath: string, targetPath: string): boolean {
  // Normalize both paths to remove . and .. segments
  const normalizedBase = normalizePath(basePath);
  const normalizedTarget = normalizePath(targetPath);
  return normalizedTarget.startsWith(normalizedBase + '/') || normalizedTarget === normalizedBase;
}

/**
 * Normalizes a path by resolving `.` and `..` segments.
 * Works with both forward slashes and OS-specific separators.
 * Prevents traversal beyond the root by ignoring `..` when at root level.
 *
 * @param p - Relative or absolute path to normalize.
 * @returns Slash-separated path with dot segments resolved.
 */
function normalizePath(p: string): string {
  const parts = p.split(/[/\\]/);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') {
      if (resolved.length > 0) {
        resolved.pop();
      }
      // If resolved is empty, ignore the '..' to prevent escaping root
    } else if (part !== '.' && part !== '') {
      resolved.push(part);
    }
  }
  // Preserve leading slash for absolute paths
  const prefix = p.startsWith('/') ? '/' : '';
  return prefix + resolved.join('/');
}

/**
 * Computes a SHA-256 hash of skill content for integrity verification.
 * Hashes individual skill file contents (sorted by path) rather than the
 * zip archive, since GitHub generates non-deterministic zip bytes.
 *
 * Uses length-prefixed encoding to prevent delimiter confusion:
 * each entry is encoded as `pathLength:path:contentLength:content`.
 *
 * @param files - Map of file paths to their content.
 * @returns Hex-encoded SHA-256 hash string.
 */
export async function computeContentHash(files: Map<string, string>): Promise<string> {
  const sortedEntries = [...files.entries()].sort(([a], [b]) => a.localeCompare(b));
  const parts = sortedEntries.map(
    ([path, content]) => `${path.length}:${path}:${content.length}:${content}`
  );
  const combined = parts.join('');
  const data = new TextEncoder().encode(combined);

  // Use Web Crypto API (available in Node 15+, browsers, Electron)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Maximum total extracted size from a zip archive (10MB). */
export const MAX_ZIP_EXTRACTED_BYTES = 10 * 1024 * 1024;

/** Maximum number of files to extract from a zip archive. */
export const MAX_ZIP_FILE_COUNT = 2000;

/**
 * Filesystem abstraction for loading skill files.
 *
 * This interface allows the SkillLoader to work in different environments
 * (Node.js filesystem, Electron, browser with virtual filesystem, tests).
 */
export interface SkillFileSystem {
  /**
   * Checks if a path exists.
   *
   * @param path - Filesystem path to check.
   * @returns Whether the path exists.
   */
  exists(path: string): Promise<boolean>;
  /**
   * Lists files and directories at a path.
   *
   * @param path - Directory path to enumerate.
   * @returns Child entry names.
   */
  readdir(path: string): Promise<string[]>;
  /**
   * Reads a file as UTF-8 text.
   *
   * @param path - File path to read.
   * @returns UTF-8 file content.
   */
  readFile(path: string): Promise<string>;
  /**
   * Checks if a path is a directory.
   *
   * @param path - Filesystem path to inspect.
   * @returns Whether the path identifies a directory.
   */
  isDirectory(path: string): Promise<boolean>;
  /**
   * Joins path segments using platform-appropriate rules.
   *
   * @param segments - Ordered path segments to join.
   * @returns Combined filesystem path.
   */
  joinPath(...segments: string[]): string;
}

/**
 * Progress information emitted while loading a skill source.
 * Phases:
 *  - 'downloading' — zip is being fetched from the network
 *  - 'extracting'  — zip has been received, files are being extracted
 *  - 'done'        — all files have been parsed
 */
export interface SkillLoadProgress {
  /** Current network, extraction, or completion phase. */
  phase: 'downloading' | 'extracting' | 'done';
  /** Bytes received so far (during 'downloading' phase, zip path only). */
  bytesDownloaded: number;
  /** Total expected bytes (0 if Content-Length is unknown or not using zip). */
  totalBytes: number;
  /** Number of skill files fetched so far (Trees-API path). */
  filesFound: number;
  /** Total files to fetch (Trees-API path; 0 if unknown). */
  totalFiles: number;
}

/**
 * HTTP client abstraction for fetching remote skill sources.
 *
 * Decoupled from `fetch` to allow testing and environment-specific
 * implementations (e.g., Electron net module, proxy support).
 */
export interface SkillHttpClient {
  /**
   * Downloads a URL and returns the response as an ArrayBuffer.
   * If `onProgress` is provided, it is called periodically with bytes
   * received and total expected bytes (0 when Content-Length is absent).
   *
   * @param url - Archive URL to download.
   * @param onProgress - Optional callback receiving downloaded and total bytes.
   * @returns Downloaded archive bytes.
   */
  fetchZip?(url: string, onProgress?: (bytes: number, total: number) => void): Promise<ArrayBuffer>;
  /**
   * Fetches skill files individually via the Git host API.
   *
   * Browser fallback for when zip download is blocked by CORS.
   * Uses the GitHub Trees API + raw.githubusercontent.com which both
   * send `Access-Control-Allow-Origin: *`.
   *
   * `onProgress` is called after each file is fetched with
   * (filesDownloaded, totalFiles).
   *
   * Returns the same `Map<relativePath, content>` format as
   * {@link SkillZipExtractor.extractTextFiles}.
   *
   * @param repoUrl - Git repository URL to query through the host API.
   * @param ref - Git ref whose files should be fetched.
   * @param pathFilter - Optional repository subdirectory to include.
   * @param onProgress - Optional callback receiving completed and total file counts.
   * @returns Relative file paths mapped to UTF-8 content.
   */
  fetchFiles?(
    repoUrl: string,
    ref: string,
    pathFilter?: string,
    onProgress?: (done: number, total: number) => void
  ): Promise<Map<string, string>>;
}

/**
 * ZIP extraction abstraction.
 *
 * Allows swapping in different ZIP implementations for different platforms.
 * Implementations MUST enforce the provided size and file count limits to
 * prevent zip bomb attacks.
 */
export interface SkillZipExtractor {
  /**
   * Extracts text files from a ZIP archive.
   *
   * @param data - ZIP file content as ArrayBuffer.
   * @param pathFilter - Optional filter to only extract files under a specific path prefix.
   * @param maxExtractedBytes - Maximum total extracted size in bytes. Implementations
   *   must abort extraction if this limit is exceeded. Defaults to {@link MAX_ZIP_EXTRACTED_BYTES}.
   * @param maxFileCount - Maximum number of files to extract. Implementations must abort
   *   extraction if this limit is exceeded. Defaults to {@link MAX_ZIP_FILE_COUNT}.
   * @returns Map of relative file paths to their text content.
   * @throws If extraction exceeds size or file count limits.
   */
  extractTextFiles(
    data: ArrayBuffer,
    pathFilter?: string,
    maxExtractedBytes?: number,
    maxFileCount?: number
  ): Promise<Map<string, string>>;
}

/**
 * Loads skills from local directories and remote Git repositories.
 *
 * Scans for SKILL.md files (agentskills.io standard), `.instructions.md`
 * files (GitHub Copilot format), and plain `.md` files in well-known
 * skill directories.
 */
export class SkillLoader {
  private fs: SkillFileSystem;
  private httpClient?: SkillHttpClient;
  private zipExtractor?: SkillZipExtractor;
  private maxSkillSizeBytes: number;

  /**
   * Creates a new SkillLoader.
   *
   * @param fs - Filesystem implementation for reading local files.
   * @param httpClient - HTTP client for fetching remote repos (optional).
   * @param zipExtractor - ZIP extractor for processing downloaded archives (optional).
   * @param maxSkillSizeBytes - Maximum content size per skill in bytes.
   */
  constructor(
    fs: SkillFileSystem,
    httpClient?: SkillHttpClient,
    zipExtractor?: SkillZipExtractor,
    maxSkillSizeBytes: number = DEFAULT_MAX_SKILL_SIZE_BYTES
  ) {
    this.fs = fs;
    this.httpClient = httpClient;
    this.zipExtractor = zipExtractor;
    this.maxSkillSizeBytes = maxSkillSizeBytes;
  }

  /**
   * Loads skills from a configured source.
   *
   * Dispatches to local directory scanning or Git zip download based on
   * the source type.
   *
   * @param source - The skill source configuration.
   * @param onProgress - Optional source-loading progress callback.
   * @returns Array of parsed skills from the source.
   */
  async loadFromSource(
    source: SkillSource,
    onProgress?: (progress: SkillLoadProgress) => void
  ): Promise<ParsedSkill[]> {
    if (!source.enabled) {
      return [];
    }

    switch (source.type) {
      case 'local':
        return this.loadFromDirectory(source.url, source.path);
      case 'git': {
        const result = await this.loadFromGitRepoWithIntegrity(source, onProgress);
        return result.skills;
      }
      default: {
        const unknownSource = source as unknown as {
          /** Unsupported source discriminator supplied at runtime. */
          type?: unknown;
        };
        console.warn(`Unknown skill source type: ${String(unknownSource.type)}`);
        return [];
      }
    }
  }

  /**
   * Loads skills from a local directory.
   *
   * Scans for:
   * 1. `SKILL.md` files (agentskills.io format) — highest priority.
   * 2. Subdirectories containing `SKILL.md` files.
   * 3. `.instructions.md` files (GitHub Copilot format).
   * 4. Plain `.md` files with front-matter.
   *
   * @param dirPath - Absolute path to the directory to scan.
   * @param subPath - Optional subdirectory within dirPath.
   * @returns Array of parsed skills found in the directory.
   */
  async loadFromDirectory(dirPath: string, subPath?: string): Promise<ParsedSkill[]> {
    const scanPath = subPath ? this.fs.joinPath(dirPath, subPath) : dirPath;

    // Path traversal protection: ensure resolved path stays within base directory
    if (subPath && !isPathWithinBase(dirPath, scanPath)) {
      console.warn(`Skill source path traversal blocked: ${subPath} escapes ${dirPath}`);
      return [];
    }

    if (!(await this.fs.exists(scanPath))) {
      return [];
    }

    if (!(await this.fs.isDirectory(scanPath))) {
      // Single file — parse directly
      return this.loadSingleFile(scanPath);
    }

    const skills: ParsedSkill[] = [];
    const entries = await this.fs.readdir(scanPath);

    for (const entry of entries) {
      const fullPath = this.fs.joinPath(scanPath, entry);

      try {
        if (await this.fs.isDirectory(fullPath)) {
          // Check for SKILL.md in subdirectory
          const skillMdPath = this.fs.joinPath(fullPath, 'SKILL.md');
          if (await this.fs.exists(skillMdPath)) {
            const content = await this.fs.readFile(skillMdPath);
            const skill = parseSkillFile(content, skillMdPath, this.maxSkillSizeBytes);
            skills.push(skill);
          }
        } else if (entry === 'SKILL.md') {
          const content = await this.fs.readFile(fullPath);
          const skill = parseSkillFile(content, fullPath, this.maxSkillSizeBytes);
          skills.push(skill);
        } else if (entry.endsWith('.instructions.md')) {
          const content = await this.fs.readFile(fullPath);
          const skill = parseCopilotInstructionsFile(content, entry, fullPath);
          skills.push(skill);
        } else if (entry.endsWith('.md') && entry !== 'README.md' && entry !== 'CONTRIBUTING.md') {
          // Try to parse as a skill file with front-matter
          const content = await this.fs.readFile(fullPath);
          try {
            const skill = parseSkillFile(content, fullPath, this.maxSkillSizeBytes);
            skills.push(skill);
          } catch {
            // Not a valid skill file (missing front-matter) — skip silently
          }
        }
      } catch (error) {
        console.warn(`Error loading skill from ${fullPath}:`, error);
      }
    }

    return skills;
  }

  /**
   * Scans well-known skill directories relative to a project root.
   *
   * Checks `.github/skills/`, `.github/instructions/`, `.claude/skills/`,
   * and `skills/` directories.
   *
   * @param projectRoot - Absolute path to the project root.
   * @returns Array of all skills found in well-known directories.
   */
  async loadFromWellKnownDirs(projectRoot: string): Promise<ParsedSkill[]> {
    const skills: ParsedSkill[] = [];

    for (const dir of WELL_KNOWN_SKILL_DIRS) {
      const fullPath = this.fs.joinPath(projectRoot, dir);
      if (await this.fs.exists(fullPath)) {
        const dirSkills = await this.loadFromDirectory(fullPath);
        skills.push(...dirSkills);
      }
    }

    return skills;
  }

  /**
   * Downloads and extracts skills from a GitHub repository via zip archive.
   *
   * Security controls:
   * - Only HTTPS URLs to github.com are allowed (SSRF prevention).
   * - Warns when using mutable branch refs instead of pinned SHAs/tags.
   * - Enforces zip extraction size and file count limits (zip bomb prevention).
   * - Validates zip entry paths to prevent path traversal.
   * - Verifies SHA-256 content hash when `sha256` is set on the source.
   * - Content size limits are enforced per skill.
   * - The zip is extracted in memory — no files are written to disk.
   *
   * @param source - The skill source configuration. Uses `url`, `ref`, `path`, and `sha256`.
   * @param onProgress - Optional callback receiving download, extraction, and completion state.
   * @returns Object with parsed skills and the computed content hash.
   * @throws If the URL is invalid, HTTP client is not configured, download fails,
   *   or integrity verification fails.
   */
  async loadFromGitRepoWithIntegrity(
    source: SkillSource,
    onProgress?: (progress: SkillLoadProgress) => void
  ): Promise<{
    /** Parsed skills accepted from safe repository files. */
    skills: ParsedSkill[];
    /** SHA-256 hash computed from safe extracted file paths and content. */
    contentHash: string;
  }> {
    const { url: repoUrl, ref = 'main', path: subPath, sha256: expectedHash } = source;

    if (
      !this.httpClient ||
      (!(this.zipExtractor && this.httpClient.fetchZip) && !this.httpClient.fetchFiles)
    ) {
      throw new Error(
        'HTTP client and ZIP extractor (or fetchFiles) are required for Git repository skill loading'
      );
    }

    if (!isValidGitUrl(repoUrl)) {
      throw new Error(
        `Invalid or disallowed Git URL: ${repoUrl}. Only canonical HTTPS GitHub repository URLs are allowed.`
      );
    }

    if (!isPinnedRef(ref)) {
      console.warn(
        `Skill source '${repoUrl}' uses mutable ref '${ref}'. ` +
          'Pin to a commit SHA or version tag for reproducible builds.'
      );
    }

    // Fetch skill files: try zip first (one request), fall back to
    // individual file fetching when zip is blocked (e.g. browser CORS).
    let files: Map<string, string>;
    if (this.zipExtractor && this.httpClient.fetchZip) {
      try {
        const zipUrl = buildGitHubZipUrl(repoUrl, ref);
        const zipData = await this.httpClient.fetchZip(zipUrl, (bytes, total) => {
          onProgress?.({
            phase: 'downloading',
            bytesDownloaded: bytes,
            totalBytes: total,
            filesFound: 0,
            totalFiles: 0,
          });
        });
        onProgress?.({
          phase: 'extracting',
          bytesDownloaded: zipData.byteLength,
          totalBytes: zipData.byteLength,
          filesFound: 0,
          totalFiles: 0,
        });
        files = await this.zipExtractor.extractTextFiles(
          zipData,
          subPath,
          MAX_ZIP_EXTRACTED_BYTES,
          MAX_ZIP_FILE_COUNT
        );
      } catch (zipError) {
        if (this.httpClient.fetchFiles) {
          // fetchFiles itself reports progress; don't reset to zero here
          files = await this.httpClient.fetchFiles(repoUrl, ref, subPath, (done, total) => {
            onProgress?.({
              phase: 'downloading',
              bytesDownloaded: 0,
              totalBytes: 0,
              filesFound: done,
              totalFiles: total,
            });
          });
        } else {
          throw zipError;
        }
      }
    } else if (this.httpClient.fetchFiles) {
      // fetchFiles reports its own progress; don't emit a zero reset here
      files = await this.httpClient.fetchFiles(repoUrl, ref, subPath, (done, total) => {
        onProgress?.({
          phase: 'downloading',
          bytesDownloaded: 0,
          totalBytes: 0,
          filesFound: done,
          totalFiles: total,
        });
      });
    } else {
      throw new Error('No method available to fetch skill files');
    }

    // Filter out entries with path traversal sequences (check path segments, not substrings)
    const safeFiles = new Map<string, string>();
    for (const [filePath, content] of files) {
      const segments = filePath.split('/');
      if (segments.some(seg => seg === '..')) {
        console.warn(`Skipping zip entry with path traversal: ${filePath}`);
        continue;
      }
      safeFiles.set(filePath, content);
    }

    // Compute content hash for integrity verification
    const contentHash = await computeContentHash(safeFiles);

    if (expectedHash && contentHash !== expectedHash) {
      throw new Error(
        `Skill source integrity check failed for ${repoUrl}@${ref}. ` +
          `Expected SHA-256: ${expectedHash}, got: ${contentHash}. ` +
          'The content may have been tampered with or the ref may have changed.'
      );
    }

    const skills: ParsedSkill[] = [];
    const sourcePrefix = `${repoUrl}@${ref}${subPath ? `/${subPath}` : ''}`;

    for (const [filePath, content] of safeFiles) {
      const fileName = filePath.split('/').pop() || filePath;

      try {
        if (fileName === 'SKILL.md') {
          const skill = parseSkillFile(
            content,
            `${sourcePrefix}/${filePath}`,
            this.maxSkillSizeBytes
          );
          skills.push(skill);
        } else if (fileName.endsWith('.instructions.md')) {
          const skill = parseCopilotInstructionsFile(
            content,
            fileName,
            `${sourcePrefix}/${filePath}`
          );
          skills.push(skill);
        } else if (
          fileName.endsWith('.md') &&
          fileName !== 'README.md' &&
          fileName !== 'CONTRIBUTING.md'
        ) {
          try {
            const skill = parseSkillFile(
              content,
              `${sourcePrefix}/${filePath}`,
              this.maxSkillSizeBytes
            );
            skills.push(skill);
          } catch {
            // Not a valid skill file — skip
          }
        }
      } catch (error) {
        console.warn(`Error parsing skill from ${filePath}:`, error);
      }
    }

    return { skills, contentHash };
  }

  /**
   * Loads a single file as a skill.
   *
   * @param filePath - Absolute path to the file.
   * @returns Array containing the parsed skill, or empty if parsing fails.
   */
  private async loadSingleFile(filePath: string): Promise<ParsedSkill[]> {
    const content = await this.fs.readFile(filePath);
    const fileName = filePath.split('/').pop() || filePath;

    try {
      if (fileName.endsWith('.instructions.md')) {
        return [parseCopilotInstructionsFile(content, fileName, filePath)];
      }
      return [parseSkillFile(content, filePath, this.maxSkillSizeBytes)];
    } catch (error) {
      console.warn(`Error loading skill from ${filePath}:`, error);
      return [];
    }
  }
}
