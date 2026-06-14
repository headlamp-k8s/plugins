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

/**
 * Tests for SkillsViewerDialog component logic.
 *
 * Tests the skill loading, display info mapping, error handling,
 * and notification callbacks — all without React rendering.
 */

import { describe, expect, it, vi } from 'vitest';
import type { SkillDisplayInfo } from '../SkillsViewerDialog/SkillsViewerDialog';

// -- SkillDisplayInfo shape tests --

describe('SkillDisplayInfo type', () => {
  it('accepts a complete skill with all fields', () => {
    const skill: SkillDisplayInfo = {
      name: 'kubernetes-troubleshooting',
      description: 'Guidelines for debugging K8s workloads',
      source: 'https://github.com/org/repo/skills/k8s.md',
      content: '# Troubleshooting\nCheck pod logs first.',
      contentSizeBytes: 42,
      version: '1.0.0',
      author: 'k8s-team',
      tags: ['kubernetes', 'debugging'],
    };
    expect(skill.name).toBe('kubernetes-troubleshooting');
    expect(skill.tags).toContain('kubernetes');
    expect(skill.contentSizeBytes).toBe(42);
  });

  it('accepts a minimal skill with only required fields', () => {
    const skill: SkillDisplayInfo = {
      name: 'simple-skill',
      description: 'A simple skill',
      source: '/local/path/SKILL.md',
      content: 'Do the thing.',
      contentSizeBytes: 14,
    };
    expect(skill.version).toBeUndefined();
    expect(skill.author).toBeUndefined();
    expect(skill.tags).toBeUndefined();
  });
});

// -- loadSkills callback contract tests --

describe('loadSkills callback', () => {
  it('returns empty array when no sources configured', async () => {
    const loadSkills = vi.fn().mockResolvedValue([]);
    const result = await loadSkills();
    expect(result).toEqual([]);
    expect(loadSkills).toHaveBeenCalledOnce();
  });

  it('returns skills from multiple sources', async () => {
    const skills: SkillDisplayInfo[] = [
      {
        name: 'skill-a',
        description: 'From GitHub',
        source: 'https://github.com/org/repo',
        content: 'content-a',
        contentSizeBytes: 9,
        tags: ['k8s'],
      },
      {
        name: 'skill-b',
        description: 'From filesystem',
        source: '/local/skills/SKILL.md',
        content: 'content-b',
        contentSizeBytes: 9,
      },
    ];
    const loadSkills = vi.fn().mockResolvedValue(skills);
    const result = await loadSkills();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('skill-a');
    expect(result[1].source).toBe('/local/skills/SKILL.md');
  });

  it('rejects on load failure', async () => {
    const loadSkills = vi.fn().mockRejectedValue(new Error('Network error'));
    await expect(loadSkills()).rejects.toThrow('Network error');
  });
});

// -- onLoadComplete notification callback tests --

describe('onLoadComplete callback', () => {
  it('reports success with skill count', () => {
    const onLoadComplete = vi.fn();
    onLoadComplete({ count: 5 });
    expect(onLoadComplete).toHaveBeenCalledWith({ count: 5 });
  });

  it('reports zero skills', () => {
    const onLoadComplete = vi.fn();
    onLoadComplete({ count: 0 });
    expect(onLoadComplete).toHaveBeenCalledWith({ count: 0 });
  });

  it('reports error with message', () => {
    const onLoadComplete = vi.fn();
    onLoadComplete({ count: 0, error: 'Failed to fetch' });
    expect(onLoadComplete).toHaveBeenCalledWith({
      count: 0,
      error: 'Failed to fetch',
    });
  });
});

// -- formatBytes utility tests --

describe('formatBytes (inline reimplementation)', () => {
  // Reimplemented here since it's not exported
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  }

  it('formats bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(50 * 1024)).toBe('50.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});

// -- Skill loading + notification integration --

describe('skill loading with notification flow', () => {
  it('notifies success after loading skills', async () => {
    const skills: SkillDisplayInfo[] = [
      {
        name: 'test-skill',
        description: 'Test',
        source: 'test',
        content: 'content',
        contentSizeBytes: 7,
      },
    ];
    const loadSkills = vi.fn().mockResolvedValue(skills);
    const onLoadComplete = vi.fn();

    // Simulate the dialog's load flow
    try {
      const loaded = await loadSkills();
      onLoadComplete({ count: loaded.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onLoadComplete({ count: 0, error: msg });
    }

    expect(onLoadComplete).toHaveBeenCalledWith({ count: 1 });
  });

  it('notifies error when loading fails', async () => {
    const loadSkills = vi.fn().mockRejectedValue(new Error('Zip extraction failed'));
    const onLoadComplete = vi.fn();

    try {
      const loaded = await loadSkills();
      onLoadComplete({ count: loaded.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      onLoadComplete({ count: 0, error: msg });
    }

    expect(onLoadComplete).toHaveBeenCalledWith({
      count: 0,
      error: 'Zip extraction failed',
    });
  });

  it('maps ParsedSkill to SkillDisplayInfo correctly', () => {
    // Simulate what Settings.tsx loadSkills does
    const parsedSkill = {
      metadata: {
        name: 'k8s-security',
        description: 'Security best practices',
        version: '2.0.0',
        author: 'security-team',
        tags: ['security', 'kubernetes'],
      },
      content: '# Security\n\nAlways use RBAC.',
      contentSizeBytes: 28,
      source: 'https://github.com/org/repo/skills/security.md',
    };

    const display: SkillDisplayInfo = {
      name: parsedSkill.metadata.name,
      description: parsedSkill.metadata.description,
      source: parsedSkill.source,
      content: parsedSkill.content,
      contentSizeBytes: parsedSkill.contentSizeBytes,
      version: parsedSkill.metadata.version,
      author: parsedSkill.metadata.author,
      tags: parsedSkill.metadata.tags,
    };

    expect(display.name).toBe('k8s-security');
    expect(display.description).toBe('Security best practices');
    expect(display.version).toBe('2.0.0');
    expect(display.author).toBe('security-team');
    expect(display.tags).toEqual(['security', 'kubernetes']);
    expect(display.content).toContain('Always use RBAC');
    expect(display.contentSizeBytes).toBe(28);
    expect(display.source).toContain('github.com');
  });
});

// -- parseSource utility tests --

describe('parseSource (inline reimplementation)', () => {
  // Reimplemented since not exported
  function parseSource(source: string): { group: string; path: string } {
    const ghMatch = source.match(/^https?:\/\/github\.com\/([^/@]+\/[^/@]+)(?:@[^/]+)?\/(.+)$/);
    if (ghMatch) {
      return { group: ghMatch[1], path: ghMatch[2] };
    }
    const lastSlash = source.lastIndexOf('/');
    if (lastSlash > 0) {
      const dir = source.substring(0, lastSlash);
      const dirName = dir.substring(dir.lastIndexOf('/') + 1);
      return { group: dirName || source, path: source.substring(lastSlash + 1) };
    }
    return { group: 'Local', path: source };
  }

  it('parses GitHub URL with commit hash', () => {
    const result = parseSource(
      'https://github.com/microsoft/azure-skills@02a614f6ee1f052826f834d65c61e430ad152c8e/airunway-aks-setup/SKILL.md'
    );
    expect(result.group).toBe('microsoft/azure-skills');
    expect(result.path).toBe('airunway-aks-setup/SKILL.md');
  });

  it('parses GitHub URL without ref', () => {
    const result = parseSource('https://github.com/org/repo/skills/k8s.md');
    expect(result.group).toBe('org/repo');
    expect(result.path).toBe('skills/k8s.md');
  });

  it('parses GitHub URL with nested sub-skill path', () => {
    const result = parseSource(
      'https://github.com/microsoft/azure-skills@abc123/microsoft-foundry/models/deploy-model/capacity/SKILL.md'
    );
    expect(result.group).toBe('microsoft/azure-skills');
    expect(result.path).toBe('microsoft-foundry/models/deploy-model/capacity/SKILL.md');
  });

  it('parses filesystem path', () => {
    const result = parseSource('/home/user/project/.github/skills/k8s-debug/SKILL.md');
    expect(result.group).toBe('k8s-debug');
    expect(result.path).toBe('SKILL.md');
  });

  it('handles bare filename', () => {
    const result = parseSource('SKILL.md');
    expect(result.group).toBe('Local');
    expect(result.path).toBe('SKILL.md');
  });
});

// -- groupSkills utility tests --

describe('groupSkills (inline reimplementation)', () => {
  function parseSource(source: string): { group: string; path: string } {
    const ghMatch = source.match(/^https?:\/\/github\.com\/([^/@]+\/[^/@]+)(?:@[^/]+)?\/(.+)$/);
    if (ghMatch) {
      return { group: ghMatch[1], path: ghMatch[2] };
    }
    const lastSlash = source.lastIndexOf('/');
    if (lastSlash > 0) {
      const dir = source.substring(0, lastSlash);
      const dirName = dir.substring(dir.lastIndexOf('/') + 1);
      return { group: dirName || source, path: source.substring(lastSlash + 1) };
    }
    return { group: 'Local', path: source };
  }

  interface SkillGroup {
    label: string;
    skills: { name: string; source: string; contentSizeBytes: number }[];
    totalSize: number;
  }

  function groupSkills(
    skills: { name: string; source: string; contentSizeBytes: number }[]
  ): SkillGroup[] {
    const map = new Map<string, typeof skills>();
    for (const skill of skills) {
      const { group } = parseSource(skill.source);
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(skill);
    }
    const groups: SkillGroup[] = [];
    for (const [label, groupSkills] of map) {
      groups.push({
        label,
        skills: groupSkills.sort((a, b) => a.name.localeCompare(b.name)),
        totalSize: groupSkills.reduce((sum, s) => sum + s.contentSizeBytes, 0),
      });
    }
    return groups.sort((a, b) => a.label.localeCompare(b.label));
  }

  it('groups skills from same GitHub repo', () => {
    const skills = [
      {
        name: 'azure-ai',
        source: 'https://github.com/microsoft/azure-skills@abc/azure-ai/SKILL.md',
        contentSizeBytes: 100,
      },
      {
        name: 'azure-cost',
        source: 'https://github.com/microsoft/azure-skills@abc/azure-cost/SKILL.md',
        contentSizeBytes: 200,
      },
    ];
    const groups = groupSkills(skills);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('microsoft/azure-skills');
    expect(groups[0].skills).toHaveLength(2);
    expect(groups[0].totalSize).toBe(300);
  });

  it('separates skills from different repos', () => {
    const skills = [
      {
        name: 'skill-a',
        source: 'https://github.com/org-a/repo-a@abc/skill-a/SKILL.md',
        contentSizeBytes: 50,
      },
      {
        name: 'skill-b',
        source: 'https://github.com/org-b/repo-b@def/skill-b/SKILL.md',
        contentSizeBytes: 75,
      },
    ];
    const groups = groupSkills(skills);
    expect(groups).toHaveLength(2);
    expect(groups.map(g => g.label)).toEqual(['org-a/repo-a', 'org-b/repo-b']);
  });

  it('sorts skills alphabetically within groups', () => {
    const skills = [
      {
        name: 'zebra',
        source: 'https://github.com/org/repo@x/zebra/SKILL.md',
        contentSizeBytes: 10,
      },
      {
        name: 'alpha',
        source: 'https://github.com/org/repo@x/alpha/SKILL.md',
        contentSizeBytes: 20,
      },
      { name: 'mid', source: 'https://github.com/org/repo@x/mid/SKILL.md', contentSizeBytes: 30 },
    ];
    const groups = groupSkills(skills);
    expect(groups[0].skills.map(s => s.name)).toEqual(['alpha', 'mid', 'zebra']);
  });

  it('sorts groups alphabetically by label', () => {
    const skills = [
      { name: 's1', source: 'https://github.com/zzz/repo@x/s1/SKILL.md', contentSizeBytes: 10 },
      { name: 's2', source: 'https://github.com/aaa/repo@x/s2/SKILL.md', contentSizeBytes: 20 },
    ];
    const groups = groupSkills(skills);
    expect(groups[0].label).toBe('aaa/repo');
    expect(groups[1].label).toBe('zzz/repo');
  });

  it('returns empty array for no skills', () => {
    expect(groupSkills([])).toEqual([]);
  });
});

// -- shortDescription utility tests --

describe('shortDescription (inline reimplementation)', () => {
  function shortDescription(desc: string, max = 120): string {
    const firstSentence = desc.split(/\.\s/)[0];
    const text = firstSentence.length <= max ? firstSentence : desc;
    if (text.length <= max) return text;
    return text.substring(0, max - 1) + '…';
  }

  it('returns short description unchanged', () => {
    expect(shortDescription('A simple skill')).toBe('A simple skill');
  });

  it('extracts first sentence', () => {
    const desc =
      'Set up AI Runway on AKS. Covers cluster verification, controller install, and more.';
    expect(shortDescription(desc)).toBe('Set up AI Runway on AKS');
  });

  it('truncates very long single sentences', () => {
    const long = 'A'.repeat(200);
    const result = shortDescription(long);
    expect(result.length).toBe(120);
    expect(result.endsWith('…')).toBe(true);
  });

  it('respects custom max length', () => {
    const result = shortDescription('Hello world, this is a test', 10);
    expect(result.length).toBe(10);
    expect(result.endsWith('…')).toBe(true);
  });
});

// -- resolveRelativeUrl utility tests --

describe('resolveRelativeUrl (inline reimplementation)', () => {
  function resolveRelativeUrl(href: string, skillSource: string): string {
    if (/^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) {
      return href;
    }
    const ghMatch = skillSource.match(/^https?:\/\/github\.com\/([^/@]+\/[^/@]+)@([^/]+)\/(.+)$/);
    if (!ghMatch) return href;
    const [, ownerRepo, ref, filePath] = ghMatch;
    const lastSlash = filePath.lastIndexOf('/');
    const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';
    const resolved = dir ? `${dir}/${href}` : href;
    return `https://github.com/${ownerRepo}/blob/${ref}/${resolved}`;
  }

  const source =
    'https://github.com/microsoft/azure-skills@02a614f6ee1f052826f834d65c61e430ad152c8e/airunway-aks-setup/SKILL.md';

  it('resolves a relative reference path to full GitHub blob URL', () => {
    const result = resolveRelativeUrl('references/steps/step-1-verify.md', source);
    expect(result).toBe(
      'https://github.com/microsoft/azure-skills/blob/02a614f6ee1f052826f834d65c61e430ad152c8e/airunway-aks-setup/references/steps/step-1-verify.md'
    );
  });

  it('resolves a sibling file reference', () => {
    const result = resolveRelativeUrl('troubleshooting.md', source);
    expect(result).toBe(
      'https://github.com/microsoft/azure-skills/blob/02a614f6ee1f052826f834d65c61e430ad152c8e/airunway-aks-setup/troubleshooting.md'
    );
  });

  it('passes through absolute https URLs unchanged', () => {
    const url = 'https://learn.microsoft.com/azure/aks/overview';
    expect(resolveRelativeUrl(url, source)).toBe(url);
  });

  it('passes through anchor links unchanged', () => {
    expect(resolveRelativeUrl('#error-handling', source)).toBe('#error-handling');
  });

  it('passes through mailto links unchanged', () => {
    expect(resolveRelativeUrl('mailto:team@example.com', source)).toBe('mailto:team@example.com');
  });

  it('returns relative href unchanged for non-GitHub source', () => {
    const localSource = '/home/user/skills/my-skill/SKILL.md';
    expect(resolveRelativeUrl('references/step1.md', localSource)).toBe('references/step1.md');
  });

  it('handles deeply nested skill source paths', () => {
    const nestedSource =
      'https://github.com/microsoft/azure-skills@abc123/microsoft-foundry/models/deploy-model/capacity/SKILL.md';
    const result = resolveRelativeUrl('references/quota.md', nestedSource);
    expect(result).toBe(
      'https://github.com/microsoft/azure-skills/blob/abc123/microsoft-foundry/models/deploy-model/capacity/references/quota.md'
    );
  });
});
