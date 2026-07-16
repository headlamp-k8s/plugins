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

import { describe, expect, it, vi } from 'vitest';
import {
  computeContentHash,
  isPathWithinBase,
  isPinnedRef,
  isValidGitUrl,
  SkillFileSystem,
  SkillLoader,
  WELL_KNOWN_SKILL_DIRS,
} from './SkillLoader';

describe('isValidGitUrl', () => {
  it('should accept valid GitHub HTTPS URLs', () => {
    expect(isValidGitUrl('https://github.com/owner/repo')).toBe(true);
    expect(isValidGitUrl('https://github.com/microsoft/azure-skills')).toBe(true);
  });

  it('should reject unsupported hosts and noncanonical GitHub URLs', () => {
    expect(isValidGitUrl('https://gitlab.com/owner/repo')).toBe(false);
    expect(isValidGitUrl('https://bitbucket.org/owner/repo')).toBe(false);
    expect(isValidGitUrl('https://github.com')).toBe(false);
    expect(isValidGitUrl('https://github.com/owner/repo?ref=main')).toBe(false);
    expect(isValidGitUrl('https://github.com/owner/repo#readme')).toBe(false);
    expect(isValidGitUrl('https://user:password@github.com/owner/repo')).toBe(false);
    expect(isValidGitUrl('https://github.com:8443/owner/repo')).toBe(false);
  });

  it('should reject HTTP URLs', () => {
    expect(isValidGitUrl('http://github.com/owner/repo')).toBe(false);
  });

  it('should reject non-Git hosts', () => {
    expect(isValidGitUrl('https://evil.com/owner/repo')).toBe(false);
    expect(isValidGitUrl('https://notgithub.com/owner/repo')).toBe(false);
  });

  it('should reject git:// protocol', () => {
    expect(isValidGitUrl('git://github.com/owner/repo')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isValidGitUrl('not a url')).toBe(false);
    expect(isValidGitUrl('')).toBe(false);
  });
});

describe('WELL_KNOWN_SKILL_DIRS', () => {
  it('should contain expected directories', () => {
    expect(WELL_KNOWN_SKILL_DIRS).toContain('.github/skills');
    expect(WELL_KNOWN_SKILL_DIRS).toContain('.github/instructions');
    expect(WELL_KNOWN_SKILL_DIRS).toContain('.claude/skills');
    expect(WELL_KNOWN_SKILL_DIRS).toContain('skills');
  });
});

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

describe('SkillLoader', () => {
  describe('loadFromDirectory', () => {
    it('should load SKILL.md from a directory', async () => {
      const fs = createMockFs({
        '/skills': 'DIR',
        '/skills/SKILL.md': `---
name: test
description: Test skill
---
Test content`,
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/skills');
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('test');
      expect(skills[0].content).toBe('Test content');
    });

    it('should load SKILL.md from subdirectories', async () => {
      const fs = createMockFs({
        '/skills': 'DIR',
        '/skills/my-skill': 'DIR',
        '/skills/my-skill/SKILL.md': `---
name: sub-skill
description: From subdirectory
---
Sub content`,
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/skills');
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('sub-skill');
    });

    it('should load .instructions.md files', async () => {
      const fs = createMockFs({
        '/instructions': 'DIR',
        '/instructions/coding.instructions.md': 'Use TypeScript strict mode.',
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/instructions');
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('coding');
    });

    it('should skip README.md and CONTRIBUTING.md', async () => {
      const fs = createMockFs({
        '/dir': 'DIR',
        '/dir/README.md': '# Readme',
        '/dir/CONTRIBUTING.md': '# Contributing',
        '/dir/SKILL.md': `---
name: real-skill
description: Real
---
Content`,
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/dir');
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('real-skill');
    });

    it('should return empty array for non-existent directory', async () => {
      const fs = createMockFs({});
      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/nonexistent');
      expect(skills).toEqual([]);
    });

    it('should handle subPath parameter', async () => {
      const fs = createMockFs({
        '/root/sub': 'DIR',
        '/root/sub/SKILL.md': `---
name: sub
description: Sub skill
---
Content`,
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/root', 'sub');
      expect(skills).toHaveLength(1);
      expect(skills[0].metadata.name).toBe('sub');
    });

    it('should skip .md files without valid front-matter silently', async () => {
      const fs = createMockFs({
        '/dir': 'DIR',
        '/dir/notes.md': '# Just plain notes\nNo front-matter here.',
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/dir');
      expect(skills).toEqual([]);
    });
  });

  describe('loadFromWellKnownDirs', () => {
    it('should scan all well-known directories', async () => {
      const fs = createMockFs({
        '/project/.github/skills': 'DIR',
        '/project/.github/skills/SKILL.md': `---
name: github-skill
description: From .github/skills
---
GH content`,
        '/project/.claude/skills': 'DIR',
        '/project/.claude/skills/SKILL.md': `---
name: claude-skill
description: From .claude/skills
---
Claude content`,
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromWellKnownDirs('/project');
      expect(skills).toHaveLength(2);
      const names = skills.map(s => s.metadata.name);
      expect(names).toContain('github-skill');
      expect(names).toContain('claude-skill');
    });
  });

  describe('loadFromSource', () => {
    it('should skip disabled sources', async () => {
      const fs = createMockFs({});
      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromSource({
        type: 'local',
        url: '/some/path',
        enabled: false,
      });
      expect(skills).toEqual([]);
    });

    it('should load from local source', async () => {
      const fs = createMockFs({
        '/skills': 'DIR',
        '/skills/SKILL.md': `---
name: local
description: Local skill
---
Content`,
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromSource({
        type: 'local',
        url: '/skills',
        enabled: true,
      });
      expect(skills).toHaveLength(1);
    });

    it('should load a Git source through the integrity path', async () => {
      const fs = createMockFs({});
      const mockHttp = {
        fetchFiles: vi.fn(
          async () =>
            new Map([['SKILL.md', '---\nname: git-source\ndescription: Git source\n---\nContent']])
        ),
      };
      const loader = new SkillLoader(fs, mockHttp);
      const skills = await loader.loadFromSource({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        enabled: true,
      });
      expect(skills.map(skill => skill.metadata.name)).toEqual(['git-source']);
    });
  });

  describe('single-file loading', () => {
    it('loads instruction and skill files directly', async () => {
      const fs = createMockFs({
        '/one.instructions.md': '---\ndescription: Instructions\n---\nUse strict types.',
        '/SKILL.md': '---\nname: direct\ndescription: Direct\n---\nContent',
      });
      const loader = new SkillLoader(fs);
      expect((await loader.loadFromDirectory('/one.instructions.md'))[0].metadata.name).toBe('one');
      expect((await loader.loadFromDirectory('/SKILL.md'))[0].metadata.name).toBe('direct');
    });

    it('returns no skill for an invalid direct file', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const loader = new SkillLoader(createMockFs({ '/bad.md': 'No front matter' }));
      expect(await loader.loadFromDirectory('/bad.md')).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('path traversal protection', () => {
    it('should block subPath with path traversal', async () => {
      const fs = createMockFs({
        '/root': 'DIR',
        '/etc/passwd': 'secret',
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/root', '../../etc');
      expect(skills).toEqual([]);
    });

    it('should allow valid subPath', async () => {
      const fs = createMockFs({
        '/root/sub': 'DIR',
        '/root/sub/SKILL.md': `---
name: valid
description: Valid skill
---
Content`,
      });

      const loader = new SkillLoader(fs);
      const skills = await loader.loadFromDirectory('/root', 'sub');
      expect(skills).toHaveLength(1);
    });
  });

  describe('loadFromGitRepoWithIntegrity', () => {
    const emptyFiles = { fetchFiles: async () => new Map<string, string>() };

    it('should warn on mutable branch ref', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const loader = new SkillLoader(createMockFs({}), emptyFiles);
      await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'main',
        enabled: true,
      });

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('mutable ref'));
      warnSpy.mockRestore();
    });

    it('should not warn on pinned SHA ref', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const loader = new SkillLoader(createMockFs({}), emptyFiles);
      await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'abc1234567890abc1234567890abc1234567890a',
        enabled: true,
      });

      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('mutable ref'));
      warnSpy.mockRestore();
    });

    it('should allow filenames containing ".." as a substring', async () => {
      const mockHttp = {
        fetchFiles: async () => {
          const files = new Map<string, string>();
          files.set('file..name.md', '---\nname: dotdot\ndescription: Has dots\n---\nContent');
          return files;
        },
      };
      const loader = new SkillLoader(createMockFs({}), mockHttp);
      const result = await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        enabled: true,
      });

      expect(result.skills).toHaveLength(1);
      expect(result.skills[0].metadata.name).toBe('dotdot');
    });

    it('should reject source when SHA-256 does not match', async () => {
      const mockHttp = {
        fetchFiles: async () => {
          const files = new Map<string, string>();
          files.set('SKILL.md', '---\nname: test\ndescription: Test\n---\nContent');
          return files;
        },
      };
      const loader = new SkillLoader(createMockFs({}), mockHttp);
      await expect(
        loader.loadFromGitRepoWithIntegrity({
          type: 'git',
          url: 'https://github.com/owner/repo',
          ref: 'v1.0.0',
          enabled: true,
          sha256: 'badhash0000000000000000000000000000000000000000000000000000000000',
        })
      ).rejects.toThrow('integrity check failed');
    });

    it('should pass when SHA-256 matches', async () => {
      const skillContent = '---\nname: test\ndescription: Test\n---\nContent';
      const mockHttp = {
        fetchFiles: async () => {
          const files = new Map<string, string>();
          files.set('SKILL.md', skillContent);
          return files;
        },
      };

      // Compute the expected hash first
      const expectedFiles = new Map<string, string>();
      expectedFiles.set('SKILL.md', skillContent);
      const expectedHash = await computeContentHash(expectedFiles);

      const loader = new SkillLoader(createMockFs({}), mockHttp);
      const result = await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        enabled: true,
        sha256: expectedHash,
      });

      expect(result.skills).toHaveLength(1);
      expect(result.contentHash).toBe(expectedHash);
    });

    it('should return contentHash for pinning', async () => {
      const mockHttp = {
        fetchFiles: async () => {
          const files = new Map<string, string>();
          files.set('SKILL.md', '---\nname: test\ndescription: Test\n---\nContent');
          return files;
        },
      };
      const loader = new SkillLoader(createMockFs({}), mockHttp);
      const result = await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        enabled: true,
      });

      expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('reports fetchFiles progress', async () => {
      const progress = vi.fn();
      const fetchFiles = vi.fn(
        async (
          _url: string,
          _ref: string,
          _path: string | undefined,
          onProgress?: (done: number, total: number) => void
        ) => {
          onProgress?.(1, 1);
          return new Map([
            [
              'skill.instructions.md',
              '---\ndescription: Archive instructions\n---\nFollow archive guidance.',
            ],
            ['plain.md', '---\nname: plain\ndescription: Plain\n---\nPlain content'],
          ]);
        }
      );
      const loader = new SkillLoader(createMockFs({}), { fetchFiles });
      const result = await loader.loadFromGitRepoWithIntegrity(
        {
          type: 'git',
          url: 'https://github.com/owner/repo',
          ref: 'v1.0.0',
          path: 'skills',
          enabled: true,
        },
        progress
      );
      expect(fetchFiles).toHaveBeenCalledWith(
        'https://github.com/owner/repo',
        'v1.0.0',
        'skills',
        expect.any(Function)
      );
      expect(progress).toHaveBeenCalledWith(
        expect.objectContaining({ phase: 'downloading', filesFound: 1, totalFiles: 1 })
      );
      expect(result.skills.map(skill => skill.metadata.name)).toEqual(['skill', 'plain']);
    });

    it('loads through fetchFiles when no zip extractor is configured', async () => {
      const fetchFiles = vi.fn(
        async () =>
          new Map([['SKILL.md', '---\nname: fetched\ndescription: Fetched\n---\nContent']])
      );
      const loader = new SkillLoader(createMockFs({}), {
        fetchFiles,
      });
      const result = await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        enabled: true,
      });
      expect(result.skills[0].metadata.name).toBe('fetched');
      expect(fetchFiles).toHaveBeenCalledOnce();
    });

    it('uses browser fetchFiles directly even when a ZIP extractor is supplied', async () => {
      const fetchFiles = vi.fn(
        async () =>
          new Map([['SKILL.md', '---\nname: browser\ndescription: Browser\n---\nContent']])
      );
      const zipExtractor = { extractTextFiles: vi.fn() };
      const loader = new SkillLoader(createMockFs({}), { fetchFiles }, zipExtractor);
      const result = await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        enabled: true,
      });
      expect(result.skills[0].metadata.name).toBe('browser');
      expect(fetchFiles).toHaveBeenCalledOnce();
      expect(zipExtractor.extractTextFiles).not.toHaveBeenCalled();
    });

    it('includes the configured subdirectory in same-name skill identities', async () => {
      const fetchFiles = vi.fn(
        async () =>
          new Map([['SKILL.md', '---\nname: duplicate\ndescription: Duplicate\n---\nContent']])
      );
      const loader = new SkillLoader(createMockFs({}), { fetchFiles });
      const first = await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        path: 'first',
        enabled: true,
      });
      const second = await loader.loadFromGitRepoWithIntegrity({
        type: 'git',
        url: 'https://github.com/owner/repo',
        ref: 'v1.0.0',
        path: 'second',
        enabled: true,
      });
      expect(first.skills[0].source).toContain('@v1.0.0/first/SKILL.md');
      expect(second.skills[0].source).toContain('@v1.0.0/second/SKILL.md');
      expect(first.skills[0].source).not.toBe(second.skills[0].source);
    });
  });
});

describe('isPinnedRef', () => {
  it('should recognize full SHA-1 hashes', () => {
    expect(isPinnedRef('abc1234567890abc1234567890abc1234567890a')).toBe(true);
  });

  it('should recognize semver tags', () => {
    expect(isPinnedRef('v1.0.0')).toBe(true);
    expect(isPinnedRef('1.2.3')).toBe(true);
    expect(isPinnedRef('v2.0')).toBe(true);
  });

  it('should reject branch names', () => {
    expect(isPinnedRef('main')).toBe(false);
    expect(isPinnedRef('develop')).toBe(false);
    expect(isPinnedRef('feature/my-branch')).toBe(false);
  });
});

describe('isPathWithinBase', () => {
  it('should allow paths within base', () => {
    expect(isPathWithinBase('/root', '/root/sub')).toBe(true);
    expect(isPathWithinBase('/root', '/root/sub/deep')).toBe(true);
  });

  it('should reject paths outside base', () => {
    expect(isPathWithinBase('/root', '/etc/passwd')).toBe(false);
    expect(isPathWithinBase('/root', '/root/../etc/passwd')).toBe(false);
  });

  it('should handle exact match', () => {
    expect(isPathWithinBase('/root', '/root')).toBe(true);
  });

  it('should prevent prefix spoofing', () => {
    expect(isPathWithinBase('/root', '/root-evil/file')).toBe(false);
  });
});

describe('computeContentHash', () => {
  it('should produce consistent hashes for the same content', async () => {
    const files = new Map<string, string>();
    files.set('a.md', 'hello');
    files.set('b.md', 'world');

    const hash1 = await computeContentHash(files);
    const hash2 = await computeContentHash(files);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different content', async () => {
    const files1 = new Map<string, string>();
    files1.set('a.md', 'hello');

    const files2 = new Map<string, string>();
    files2.set('a.md', 'world');

    const hash1 = await computeContentHash(files1);
    const hash2 = await computeContentHash(files2);
    expect(hash1).not.toBe(hash2);
  });

  it('should produce hex-encoded SHA-256', async () => {
    const files = new Map<string, string>();
    files.set('test.md', 'content');
    const hash = await computeContentHash(files);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should sort files by path for deterministic hashing', async () => {
    const files1 = new Map<string, string>();
    files1.set('b.md', 'beta');
    files1.set('a.md', 'alpha');

    const files2 = new Map<string, string>();
    files2.set('a.md', 'alpha');
    files2.set('b.md', 'beta');

    expect(await computeContentHash(files1)).toBe(await computeContentHash(files2));
  });
});
