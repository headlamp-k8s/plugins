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
  createArchiveHttpClient,
  createJSZipExtractor,
} from '@headlamp-k8s/ai-common/skills/adapters/browser';
import type { SkillsConfig } from '@headlamp-k8s/ai-common/skills/config';
import { DEFAULT_SKILLS_CONFIG } from '@headlamp-k8s/ai-common/skills/config';
import type { SkillFileSystem, SkillSource } from '@headlamp-k8s/ai-common/skills/SkillLoader';
import { isValidGitUrl } from '@headlamp-k8s/ai-common/skills/SkillLoader';
import { type SkillLoadError, SkillManager } from '@headlamp-k8s/ai-common/skills/SkillManager';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Node.js filesystem adapter for the skills loader.
 *
 * Uses `fs.lstat` instead of `fs.stat` to avoid following symlinks,
 * which prevents symlink-based path traversal attacks.
 */
export function createNodeFileSystem(): SkillFileSystem {
  return {
    exists: async (p: string) => {
      try {
        await fs.access(p);
        return true;
      } catch {
        return false;
      }
    },
    readdir: async (p: string) => {
      const entries = await fs.readdir(p);
      return entries;
    },
    readFile: async (p: string) => {
      // Guard against reading excessively large files into memory.
      // The per-skill content limit is enforced downstream in parseSkillFile,
      // but we also cap at 1 MB here to prevent OOM from rogue files.
      const stat = await fs.lstat(p);
      if (!stat.isFile()) {
        throw new Error(`Not a regular file: ${p}`);
      }
      if (stat.size > 1024 * 1024) {
        throw new Error(`File too large (${stat.size} bytes): ${p}`);
      }
      return fs.readFile(p, 'utf-8');
    },
    isDirectory: async (p: string) => {
      // Use lstat to avoid following symlinks
      const stat = await fs.lstat(p);
      return stat.isDirectory();
    },
    joinPath: (...segments: string[]) => path.join(...segments),
  };
}

/**
 * Parses a Git URL string into a SkillSource.
 *
 * Validates the URL against the allowed-hosts list before returning.
 *
 * Supports formats:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo#ref
 *   https://github.com/owner/repo#ref:path
 *
 * @param url - Git repository URL, optionally with ref and path fragments.
 * @returns A configured SkillSource for the Git repo.
 * @throws If the URL is not a valid HTTPS URL to an allowed Git host.
 */
export function parseSkillSourceUrl(url: string): SkillSource {
  let repoUrl = url;
  let ref = 'main';
  let subPath: string | undefined;

  const hashIdx = url.indexOf('#');
  if (hashIdx !== -1) {
    repoUrl = url.slice(0, hashIdx);
    const fragment = url.slice(hashIdx + 1);
    const colonIdx = fragment.indexOf(':');
    if (colonIdx !== -1) {
      ref = fragment.slice(0, colonIdx);
      subPath = fragment.slice(colonIdx + 1);
    } else {
      ref = fragment;
    }
  }

  // Validate early at the CLI trust boundary — don't defer to downstream checks
  if (!isValidGitUrl(repoUrl)) {
    throw new Error(
      `Invalid skill source URL: ${repoUrl}. Only canonical HTTPS GitHub repository URLs are allowed.`
    );
  }

  return {
    type: 'git',
    url: repoUrl,
    ref,
    path: subPath,
    enabled: true,
  };
}

/**
 * Creates a SkillManager and loads skills from the given Git URLs.
 *
 * Reuses the universal fetch-based HTTP client and JSZip extractor
 * from ai-common (no Node-specific reimplementation needed since
 * Node 18+ supports global fetch and JSZip is pure JavaScript).
 *
 * @param skillSourceUrls - Array of Git repo URLs (with optional #ref:path).
 * @returns Object with the SkillManager, loaded config, and any load errors.
 */
export async function loadSkillsFromUrls(skillSourceUrls: string[]): Promise<{
  manager: SkillManager;
  config: SkillsConfig;
  errors: SkillLoadError[];
  skillCount: number;
}> {
  const sources: SkillSource[] = skillSourceUrls.map(parseSkillSourceUrl);

  const config: SkillsConfig = {
    ...DEFAULT_SKILLS_CONFIG,
    sources,
  };

  const manager = new SkillManager(
    createNodeFileSystem(),
    createArchiveHttpClient(),
    createJSZipExtractor()
  );

  const { skills, errors } = await manager.loadAllSkillsWithErrors(config);

  return { manager, config, errors, skillCount: skills.length };
}
