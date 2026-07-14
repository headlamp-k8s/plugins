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
import { DEFAULT_SKILLS_CONFIG, SkillsConfig } from './config';
import { getSkillIdentity } from './config';
import type { EmbeddingSkillRouter } from './routing/EmbeddingSkillRouter';
import { DEFAULT_ROUTER_CONFIG } from './routing/KeywordSkillRouter';
import { SkillFileSystem } from './SkillLoader';
import { SkillManager } from './SkillManager';

/** Creates a mock filesystem for testing. */
function createMockFs(files: Record<string, string | 'DIR'>): SkillFileSystem {
  return {
    exists: async (path: string) => path in files,
    readdir: async (path: string) => {
      const prefix = path.endsWith('/') ? path : path + '/';
      const entries = new Set<string>();
      for (const key of Object.keys(files)) {
        if (key.startsWith(prefix)) {
          const rest = key.slice(prefix.length);
          const firstPart = rest.split('/')[0];
          if (firstPart) entries.add(firstPart);
        }
      }
      return [...entries];
    },
    readFile: async (path: string) => {
      const content = files[path];
      if (typeof content !== 'string' || content === 'DIR') {
        throw new Error(`Cannot read: ${path}`);
      }
      return content;
    },
    isDirectory: async (path: string) => files[path] === 'DIR',
    joinPath: (...segments: string[]) => segments.join('/'),
  };
}

const SKILL_1 = `---
name: skill-one
description: First skill
tags: [testing]
---
Content for skill one`;

const SKILL_2 = `---
name: skill-two
description: Second skill
---
Content for skill two`;

describe('SkillManager', () => {
  let manager: SkillManager;
  let config: SkillsConfig;

  beforeEach(() => {
    const fs = createMockFs({
      '/skills': 'DIR',
      '/skills/SKILL.md': SKILL_1,
      '/other-skills': 'DIR',
      '/other-skills/SKILL.md': SKILL_2,
    });

    manager = new SkillManager(fs);
    config = {
      ...DEFAULT_SKILLS_CONFIG,
      sources: [
        { type: 'local', url: '/skills', enabled: true },
        { type: 'local', url: '/other-skills', enabled: true },
      ],
    };
  });

  describe('loadAllSkills', () => {
    it('should load skills from all enabled sources', async () => {
      const skills = await manager.loadAllSkills(config);
      expect(skills).toHaveLength(2);
      const names = skills.map(s => s.metadata.name);
      expect(names).toContain('skill-one');
      expect(names).toContain('skill-two');
    });

    it('should skip disabled sources', async () => {
      config.sources[1].enabled = false;
      const skills = await manager.loadAllSkills(config);
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('skill-one');
    });

    it('should cache results', async () => {
      const skills1 = await manager.loadAllSkills(config);
      const skills2 = await manager.loadAllSkills(config);
      expect(skills1).toEqual(skills2);
    });
  });

  describe('getEnabledSkills', () => {
    it('should return all skills when none disabled', async () => {
      await manager.loadAllSkills(config);
      const enabled = manager.getEnabledSkills(config);
      expect(enabled).toHaveLength(2);
    });

    it('should filter disabled skills', async () => {
      const loaded = await manager.loadAllSkills(config);
      const skillTwo = loaded.find(skill => skill.metadata.name === 'skill-two');
      if (!skillTwo) throw new Error('skill-two was not loaded');
      config.disabledSkills = [getSkillIdentity(skillTwo)];
      const enabled = manager.getEnabledSkills(config);
      expect(enabled).toHaveLength(1);
      expect(enabled[0].metadata.name).toBe('skill-one');
    });
  });

  describe('getSkillsPromptText', () => {
    it('should generate prompt text for enabled skills', async () => {
      await manager.loadAllSkills(config);
      const text = manager.getSkillsPromptText(config);
      expect(text).toContain('SKILLS:');
      expect(text).toContain('<skill name="skill-one"');
      expect(text).toContain('<skill name="skill-two"');
      expect(text).toContain('Content for skill one');
    });

    it('should return empty string when no skills', () => {
      const text = manager.getSkillsPromptText(config);
      expect(text).toBe('');
    });

    it('should exclude disabled skills', async () => {
      const loaded = await manager.loadAllSkills(config);
      const skillOne = loaded.find(skill => skill.metadata.name === 'skill-one');
      if (!skillOne) throw new Error('skill-one was not loaded');
      config.disabledSkills = [getSkillIdentity(skillOne)];
      const text = manager.getSkillsPromptText(config);
      expect(text).toContain('skill-two');
      expect(text).not.toContain('skill-one');
    });
  });

  describe('getEnabledSkillsSize', () => {
    it('should return total size of enabled skills', async () => {
      await manager.loadAllSkills(config);
      const size = manager.getEnabledSkillsSize(config);
      expect(size).toBeGreaterThan(0);
    });

    it('should return 0 when no skills loaded', () => {
      expect(manager.getEnabledSkillsSize(config)).toBe(0);
    });
  });

  describe('getSkillsSummary', () => {
    it('should return correct summary', async () => {
      const loaded = await manager.loadAllSkills(config);
      const skillTwo = loaded.find(skill => skill.metadata.name === 'skill-two');
      if (!skillTwo) throw new Error('skill-two was not loaded');
      config.disabledSkills = [getSkillIdentity(skillTwo)];
      const summary = manager.getSkillsSummary(config);
      expect(summary.totalSkills).toBe(2);
      expect(summary.enabledSkills).toBe(1);
      expect(summary.totalSizeBytes).toBeGreaterThan(0);
      expect(summary.maxTotalSizeBytes).toBe(config.maxTotalSkillSizeBytes);
    });
  });

  describe('invalidateCache', () => {
    it('should force reload on next call', async () => {
      await manager.loadAllSkills(config);
      manager.invalidateCache();

      // After invalidation, skills should still load correctly
      const skills = await manager.loadAllSkills(config);
      expect(skills).toHaveLength(2);
    });
  });

  describe('security-sensitive cache invalidation', () => {
    it('reloads when the integrity hash changes', async () => {
      const fetchFiles = vi.fn(
        async () => new Map([['SKILL.md', '---\nname: remote\ndescription: Remote\n---\nContent']])
      );
      const mgr = new SkillManager(createMockFs({}), { fetchFiles });
      const remoteConfig: SkillsConfig = {
        ...DEFAULT_SKILLS_CONFIG,
        sources: [
          {
            type: 'git',
            url: 'https://github.com/owner/repo',
            ref: 'v1.0.0',
            enabled: true,
          },
        ],
      };
      await mgr.loadAllSkills(remoteConfig);
      remoteConfig.sources[0].sha256 = '0'.repeat(64);
      await expect(mgr.loadAllSkills(remoteConfig)).resolves.toEqual([]);
      expect(fetchFiles).toHaveBeenCalledTimes(2);
    });

    it('retries failed sources even when another source was cached', async () => {
      let badPathFails = true;
      const fs = createMockFs({
        '/good': 'DIR',
        '/good/SKILL.md': SKILL_1,
        '/bad': 'DIR',
        '/bad/SKILL.md': SKILL_2,
      });
      const retryFs: SkillFileSystem = {
        ...fs,
        readdir: async path => {
          if (path === '/bad' && badPathFails) throw new Error('temporary');
          return fs.readdir(path);
        },
      };
      const mgr = new SkillManager(retryFs);
      const retryConfig: SkillsConfig = {
        ...DEFAULT_SKILLS_CONFIG,
        sources: [
          { type: 'local', url: '/good', enabled: true },
          { type: 'local', url: '/bad', enabled: true },
        ],
      };
      const first = await mgr.loadAllSkillsWithErrors(retryConfig);
      expect(first.errors).toHaveLength(1);
      badPathFails = false;
      const second = await mgr.loadAllSkillsWithErrors(retryConfig);
      expect(second.errors).toEqual([]);
      expect(second.skills).toHaveLength(2);
    });
  });

  describe('loadAllSkillsWithErrors', () => {
    it('should return skills and empty errors on success', async () => {
      const { skills, errors } = await manager.loadAllSkillsWithErrors(config);
      expect(skills).toHaveLength(2);
      expect(errors).toHaveLength(0);
      const names = skills.map(s => s.metadata.name);
      expect(names).toContain('skill-one');
      expect(names).toContain('skill-two');
    });

    it('should report per-source errors without losing successful sources', async () => {
      // Add a bad local source that doesn't exist alongside a good one
      const fs = createMockFs({
        '/good-skills': 'DIR',
        '/good-skills/SKILL.md': SKILL_1,
      });
      // Create a filesystem that throws on the bad path
      const errorFs: SkillFileSystem = {
        ...fs,
        exists: async (path: string) => {
          if (path === '/bad-skills') throw new Error('Disk read error');
          return fs.exists(path);
        },
        readdir: fs.readdir,
        readFile: fs.readFile,
        isDirectory: fs.isDirectory,
        joinPath: fs.joinPath,
      };
      const mgr = new SkillManager(errorFs);
      const testConfig: SkillsConfig = {
        ...DEFAULT_SKILLS_CONFIG,
        sources: [
          { type: 'local', url: '/good-skills', enabled: true },
          { type: 'local', url: '/bad-skills', enabled: true },
        ],
      };

      const { skills, errors } = await mgr.loadAllSkillsWithErrors(testConfig);
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('skill-one');
      expect(errors).toHaveLength(1);
      expect(errors[0].sourceUrl).toBe('/bad-skills');
      expect(errors[0].sourceType).toBe('local');
      expect(errors[0].error).toContain('Disk read error');
    });

    it('should report errors for git sources without httpClient', async () => {
      const fs = createMockFs({});
      const mgr = new SkillManager(fs); // no httpClient / zipExtractor
      const testConfig: SkillsConfig = {
        ...DEFAULT_SKILLS_CONFIG,
        sources: [
          {
            type: 'git',
            url: 'https://github.com/example/repo',
            ref: 'main',
            path: 'skills',
            enabled: true,
          },
        ],
      };

      const { skills, errors } = await mgr.loadAllSkillsWithErrors(testConfig);
      expect(skills).toHaveLength(0);
      expect(errors).toHaveLength(1);
      expect(errors[0].sourceUrl).toBe('https://github.com/example/repo');
      expect(errors[0].sourceType).toBe('git');
      expect(errors[0].error).toContain('HTTP client');
    });

    it('should skip disabled sources and report no errors for them', async () => {
      config.sources[1].enabled = false;
      const { skills, errors } = await manager.loadAllSkillsWithErrors(config);
      expect(skills).toHaveLength(1);
      expect(errors).toHaveLength(0);
    });

    it('should use cache on second call within TTL', async () => {
      const result1 = await manager.loadAllSkillsWithErrors(config);
      const result2 = await manager.loadAllSkillsWithErrors(config);
      expect(result1.skills).toEqual(result2.skills);
      expect(result2.errors).toHaveLength(0); // Cached — no loading, no errors
    });

    it('should reload after invalidateCache', async () => {
      await manager.loadAllSkillsWithErrors(config);
      manager.invalidateCache();
      const { skills, errors } = await manager.loadAllSkillsWithErrors(config);
      expect(skills).toHaveLength(2);
      expect(errors).toHaveLength(0);
    });
  });

  describe('loadFromWellKnownDirs', () => {
    it('should scan well-known directories', async () => {
      const fs = createMockFs({
        '/project/.github/skills': 'DIR',
        '/project/.github/skills/SKILL.md': SKILL_1,
      });

      const mgr = new SkillManager(fs);
      const skills = await mgr.loadFromWellKnownDirs('/project');
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('skill-one');
    });
  });

  describe('getRoutedSkillsPromptText', () => {
    it('should return empty string when no skills loaded', async () => {
      const text = await manager.getRoutedSkillsPromptText('anything', config);
      expect(text).toBe('');
    });

    it('should return all skills when count is within maxSkills', async () => {
      await manager.loadAllSkills(config);
      // 2 skills, default maxSkills is 5 — should include all
      const text = await manager.getRoutedSkillsPromptText('anything', config);
      expect(text).toContain('skill-one');
      expect(text).toContain('skill-two');
    });

    it('should use keyword routing for many skills', async () => {
      // Create config with many skills so routing is triggered
      const manySkillsFs = createMockFs({
        '/s1': 'DIR',
        '/s1/SKILL.md':
          '---\nname: alpha\ndescription: Alpha install guide\ntags: [install]\n---\nAlpha content',
        '/s2': 'DIR',
        '/s2/SKILL.md':
          '---\nname: beta\ndescription: Beta network analysis\ntags: [network]\n---\nBeta content',
        '/s3': 'DIR',
        '/s3/SKILL.md':
          '---\nname: gamma\ndescription: Gamma security audit\ntags: [security]\n---\nGamma content',
        '/s4': 'DIR',
        '/s4/SKILL.md':
          '---\nname: delta\ndescription: Delta deployment guide\ntags: [deployment]\n---\nDelta content',
        '/s5': 'DIR',
        '/s5/SKILL.md':
          '---\nname: epsilon\ndescription: Epsilon troubleshooting\ntags: [troubleshooting]\n---\nEpsilon content',
        '/s6': 'DIR',
        '/s6/SKILL.md':
          '---\nname: zeta\ndescription: Zeta monitoring setup\ntags: [monitoring]\n---\nZeta content',
      });

      const mgr = new SkillManager(manySkillsFs);
      const manyConfig: SkillsConfig = {
        ...DEFAULT_SKILLS_CONFIG,
        sources: [
          { type: 'local', url: '/s1', enabled: true },
          { type: 'local', url: '/s2', enabled: true },
          { type: 'local', url: '/s3', enabled: true },
          { type: 'local', url: '/s4', enabled: true },
          { type: 'local', url: '/s5', enabled: true },
          { type: 'local', url: '/s6', enabled: true },
        ],
      };

      await mgr.loadAllSkills(manyConfig);

      // Route with maxSkills=2 to force selection
      const routerConfig = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const text = await mgr.getRoutedSkillsPromptText('install guide', manyConfig, routerConfig);
      expect(text).toContain('SKILLS:');
      expect(text).toContain('alpha'); // "install" keyword should match
    });

    it('should exclude disabled skills from routing', async () => {
      const loaded = await manager.loadAllSkills(config);
      const skillOne = loaded.find(skill => skill.metadata.name === 'skill-one');
      if (!skillOne) throw new Error('skill-one was not loaded');
      config.disabledSkills = [getSkillIdentity(skillOne)];
      const text = await manager.getRoutedSkillsPromptText('anything', config);
      expect(text).not.toContain('skill-one');
      expect(text).toContain('skill-two');
    });
  });

  describe('setEmbeddingRouter', () => {
    /** Creates a minimal mock embedding router for testing. */
    function createMockRouter(opts?: { hasIndex?: boolean }) {
      let indexCleared = false;
      return {
        router: {
          hasIndex: () => opts?.hasIndex ?? false,
          clearIndex: () => {
            indexCleared = true;
          },
        } as unknown as EmbeddingSkillRouter,
        get indexCleared() {
          return indexCleared;
        },
      };
    }

    it('should accept and return an embedding router', () => {
      expect(manager.getEmbeddingSkillRouter()).toBeNull();

      const { router } = createMockRouter();
      manager.setEmbeddingSkillRouter(router);
      expect(manager.getEmbeddingSkillRouter()).toBe(router);
    });

    it('should allow clearing the embedding router', () => {
      const { router } = createMockRouter();
      manager.setEmbeddingSkillRouter(router);
      manager.setEmbeddingSkillRouter(null);
      expect(manager.getEmbeddingSkillRouter()).toBeNull();
    });

    it('should clear the embedding index on cache invalidation', async () => {
      const mock = createMockRouter({ hasIndex: true });
      manager.setEmbeddingSkillRouter(mock.router);
      manager.invalidateCache();
      expect(mock.indexCleared).toBe(true);
    });
  });
});
