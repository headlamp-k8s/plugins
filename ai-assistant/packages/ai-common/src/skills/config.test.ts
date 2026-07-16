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

import { describe, expect, it } from 'vitest';
import {
  addSkillSource,
  DEFAULT_SKILLS_CONFIG,
  getSkillIdentity,
  getSkillsConfig,
  isSkillEnabled,
  removeSkillSource,
  saveSkillsConfig,
  SkillsConfig,
  toggleSkill,
} from './config';
import type { ParsedSkill } from './parseSkill';

function makeSkill(name: string, source: string): ParsedSkill {
  return {
    metadata: { name, description: name },
    content: name,
    contentSizeBytes: name.length,
    source,
  };
}

describe('getSkillsConfig', () => {
  it('should return defaults for null data', () => {
    const config = getSkillsConfig(null);
    expect(config).toEqual(DEFAULT_SKILLS_CONFIG);
  });

  it('should return defaults for undefined data', () => {
    const config = getSkillsConfig(undefined);
    expect(config).toEqual(DEFAULT_SKILLS_CONFIG);
  });

  it('should return defaults when no skills key', () => {
    const config = getSkillsConfig({ otherStuff: true });
    expect(config).toEqual(DEFAULT_SKILLS_CONFIG);
  });

  it('should parse stored config', () => {
    const data = {
      skills: {
        sources: [{ type: 'local', url: '/skills', enabled: true }],
        disabledSkills: ['old-skill'],
        maxSkillSizeBytes: 100000,
        maxTotalSkillSizeBytes: 500000,
      },
    };
    const config = getSkillsConfig(data);
    expect(config.sources).toHaveLength(1);
    expect(config.disabledSkills).toEqual([]);
    expect(config.maxSkillSizeBytes).toBe(100000);
    expect(config.maxTotalSkillSizeBytes).toBe(500000);
  });

  it('should handle partial stored config with defaults', () => {
    const data = {
      skills: {
        sources: [{ type: 'local', url: '/dir', enabled: true }],
      },
    };
    const config = getSkillsConfig(data);
    expect(config.sources).toHaveLength(1);
    expect(config.disabledSkills).toEqual([]);
    expect(config.maxSkillSizeBytes).toBe(DEFAULT_SKILLS_CONFIG.maxSkillSizeBytes);
  });

  it('normalizes safe sources and rejects unsafe, malformed, and duplicate persisted entries', () => {
    const validHash = 'a'.repeat(64);
    const config = getSkillsConfig({
      skills: {
        sources: [
          {
            type: 'git',
            url: ' https://github.com/example/repo.git ',
            path: '/skills/',
            enabled: true,
          },
          { type: 'git', url: 'https://github.com/example/repo', path: 'skills', enabled: false },
          { type: 'git', url: 'http://github.com/example/insecure', enabled: true },
          { type: 'git', url: 'https://github.com/example/bad-hash', sha256: 'bad', enabled: true },
          {
            type: 'git',
            url: 'https://gitlab.com/example/valid',
            sha256: validHash,
            enabled: true,
          },
          { type: 'local', url: 'relative/path', enabled: true },
          { type: 'local', url: ' /absolute/path/ ', enabled: true },
          { type: 'local', url: 'C:/', enabled: true },
          {
            type: 'git',
            url: 'https://github.com/example/upper-hash',
            sha256: validHash.toUpperCase(),
            enabled: true,
          },
        ],
        maxSkillSizeBytes: Number.NaN,
        maxTotalSkillSizeBytes: -1,
      },
    });

    expect(config.sources).toEqual([
      { type: 'git', url: 'https://github.com/example/repo', path: 'skills', enabled: true },
      { type: 'local', url: '/absolute/path', enabled: true },
      { type: 'local', url: 'C:/', enabled: true },
      {
        type: 'git',
        url: 'https://github.com/example/upper-hash',
        sha256: validHash,
        enabled: true,
      },
    ]);
    expect(config.maxSkillSizeBytes).toBe(DEFAULT_SKILLS_CONFIG.maxSkillSizeBytes);
    expect(config.maxTotalSkillSizeBytes).toBe(DEFAULT_SKILLS_CONFIG.maxTotalSkillSizeBytes);
  });
});

describe('saveSkillsConfig', () => {
  it('should merge skills config into data', () => {
    const data = { existingKey: 'value' };
    const config: SkillsConfig = {
      sources: [{ type: 'local', url: '/path', enabled: true }],
      disabledSkills: ['disabled-one'],
      maxSkillSizeBytes: 50000,
      maxTotalSkillSizeBytes: 200000,
    };

    const result = saveSkillsConfig(data, config);
    expect(result.existingKey).toBe('value');
    expect(result.skills.sources).toEqual(config.sources);
    expect(result.skills.disabledSkills).toEqual(['disabled-one']);
  });

  it('should preserve other data fields', () => {
    const data = { providers: [], termsAccepted: true };
    const result = saveSkillsConfig(data, DEFAULT_SKILLS_CONFIG);
    expect(result.providers).toEqual([]);
    expect(result.termsAccepted).toBe(true);
    expect(result.skills).toBeDefined();
  });
});

describe('addSkillSource', () => {
  it('should add a new source', () => {
    const config = { ...DEFAULT_SKILLS_CONFIG };
    const source = { type: 'local' as const, url: '/new/path', enabled: true };
    const updated = addSkillSource(config, source);
    expect(updated.sources).toHaveLength(1);
    expect(updated.sources[0].url).toBe('/new/path');
  });

  it('should throw if source already exists', () => {
    const config: SkillsConfig = {
      ...DEFAULT_SKILLS_CONFIG,
      sources: [{ type: 'local', url: '/existing', enabled: true }],
    };
    expect(() =>
      addSkillSource(config, { type: 'local', url: '/existing', enabled: true })
    ).toThrow('already exists');
  });

  it('should not modify original config', () => {
    const config = { ...DEFAULT_SKILLS_CONFIG, sources: [] };
    addSkillSource(config, { type: 'local', url: '/new', enabled: true });
    expect(config.sources).toHaveLength(0);
  });
});

describe('removeSkillSource', () => {
  it('should remove a source by URL', () => {
    const config: SkillsConfig = {
      ...DEFAULT_SKILLS_CONFIG,
      sources: [
        { type: 'local', url: '/keep', enabled: true },
        { type: 'local', url: '/remove', enabled: true },
      ],
    };
    const updated = removeSkillSource(config, { type: 'local', url: '/remove' });
    expect(updated.sources).toHaveLength(1);
    expect(updated.sources[0].url).toBe('/keep');
  });

  it('should handle removing non-existent source gracefully', () => {
    const config: SkillsConfig = {
      ...DEFAULT_SKILLS_CONFIG,
      sources: [{ type: 'local', url: '/only', enabled: true }],
    };
    const updated = removeSkillSource(config, { type: 'local', url: '/nonexistent' });
    expect(updated.sources).toHaveLength(1);
  });
});

describe('toggleSkill', () => {
  it('should disable an enabled skill', () => {
    const config = { ...DEFAULT_SKILLS_CONFIG, disabledSkills: [] };
    const skill = makeSkill('my-skill', '/one/SKILL.md');
    const updated = toggleSkill(config, skill);
    expect(updated.disabledSkills).toContain(getSkillIdentity(skill));
  });

  it('should enable a disabled skill', () => {
    const skill = makeSkill('my-skill', '/one/SKILL.md');
    const config = { ...DEFAULT_SKILLS_CONFIG, disabledSkills: [getSkillIdentity(skill)] };
    const updated = toggleSkill(config, skill);
    expect(updated.disabledSkills).not.toContain(getSkillIdentity(skill));
  });

  it('should not modify original config', () => {
    const config = { ...DEFAULT_SKILLS_CONFIG, disabledSkills: [] };
    toggleSkill(config, makeSkill('test', '/test/SKILL.md'));
    expect(config.disabledSkills).toHaveLength(0);
  });
});

describe('isSkillEnabled', () => {
  it('should return true for skills not in disabled list', () => {
    const config = { ...DEFAULT_SKILLS_CONFIG, disabledSkills: ['other'] };
    expect(isSkillEnabled(config, makeSkill('my-skill', '/one/SKILL.md'))).toBe(true);
  });

  it('should return false for disabled skills', () => {
    const skill = makeSkill('my-skill', '/one/SKILL.md');
    const config = { ...DEFAULT_SKILLS_CONFIG, disabledSkills: [getSkillIdentity(skill)] };
    expect(isSkillEnabled(config, skill)).toBe(false);
  });

  it('should return true when disabled list is empty', () => {
    const config = { ...DEFAULT_SKILLS_CONFIG, disabledSkills: [] };
    expect(isSkillEnabled(config, makeSkill('anything', '/one/SKILL.md'))).toBe(true);
  });

  it('keeps same-name skills from different sources independent', () => {
    const first = makeSkill('duplicate', '/first/SKILL.md');
    const second = makeSkill('duplicate', '/second/SKILL.md');
    const config = { ...DEFAULT_SKILLS_CONFIG, disabledSkills: [getSkillIdentity(first)] };
    expect(isSkillEnabled(config, first)).toBe(false);
    expect(isSkillEnabled(config, second)).toBe(true);
  });
});
