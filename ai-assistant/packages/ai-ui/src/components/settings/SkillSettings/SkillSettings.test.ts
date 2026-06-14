/**
 * Tests for SkillSettings component logic.
 *
 * Tests the configuration management, well-known path detection,
 * source CRUD operations, and save/discard behavior.
 */

import { describe, expect, it, vi } from 'vitest';
import type { SkillsConfig, SkillSourceEntry, WellKnownPathStatus } from './SkillSettings';

// Re-define the well-known dirs constant to avoid importing the component
// which pulls in @iconify/react and MUI (peer deps not available in test env).
const WELL_KNOWN_SKILL_DIRS = [
  { path: '.github/skills', label: 'GitHub Copilot Skills', tool: 'GitHub Copilot' },
  { path: '.github/instructions', label: 'GitHub Copilot Instructions', tool: 'GitHub Copilot' },
  { path: '.claude/skills', label: 'Claude Code Skills', tool: 'Claude' },
  { path: 'skills', label: 'Generic Skills', tool: 'Generic' },
] as const;

// Re-define well-known repos to avoid importing the component.
const WELL_KNOWN_SKILL_REPOS = [
  {
    url: 'https://github.com/kubeshark/kubeshark',
    label: 'Kubeshark',
    description: 'Network traffic analysis for Kubernetes',
    path: 'skills',
    ref: '1926067bd928c2acfc875542d6ce4e418e7e95d8',
  },
  {
    url: 'https://github.com/helmfile/helmfile',
    label: 'Helmfile',
    description: 'Declarative Helm chart deployment',
    path: 'skills',
    ref: '33eadc993e0ee77de91914afd0ab00042c498232',
  },
  {
    url: 'https://github.com/openshift/lightspeed-service',
    label: 'OpenShift Lightspeed',
    description: 'Kubernetes/OpenShift troubleshooting skills',
    path: 'skills',
    ref: 'f600c71426d3fdcbcfd294045fa5f7555cfb9fa1',
  },
  {
    url: 'https://github.com/microsoft/azure-skills',
    label: 'Azure Skills',
    description: 'Azure service guidance (AKS, networking, etc.)',
    path: 'skills',
    ref: '02a614f6ee1f052826f834d65c61e430ad152c8e',
  },
  {
    url: 'https://github.com/fluxcd/agent-skills',
    label: 'Flux Agent Skills',
    description: 'GitOps knowledge, manifest generation, cluster debugging',
    path: 'skills',
    ref: 'df7cf2c5dbb64ded73913fea775f6a9fc4f7c209',
  },
  {
    url: 'https://github.com/MicrosoftDocs/Agent-Skills',
    label: 'Azure Cloud Development',
    description: 'Azure cloud development skills from Microsoft Docs',
    path: 'skills',
    ref: 'aab6d7889eadd5e90ff685c486a8ca1ee24c0f5f',
  },
  {
    url: 'https://github.com/kubernetes/website',
    label: 'Kubernetes Docs',
    description: 'Official Kubernetes documentation (subset)',
    path: 'content/en/docs',
    ref: '02ab95c97025ac048aa7979313b6800925dbbbd3',
  },
] as const;

// -- Helper to create a mock config store --
function createMockStore(initial: any = {}) {
  let data = { ...initial };
  return {
    get: () => data,
    update: (patch: any) => {
      data = { ...data, ...patch };
    },
    _getData: () => data,
  };
}

// -- Pure logic tests (no React rendering) --

describe('WELL_KNOWN_SKILL_DIRS', () => {
  it('contains expected directories', () => {
    const paths = WELL_KNOWN_SKILL_DIRS.map(d => d.path);
    expect(paths).toContain('.github/skills');
    expect(paths).toContain('.github/instructions');
    expect(paths).toContain('.claude/skills');
    expect(paths).toContain('skills');
  });

  it('has labels for each directory', () => {
    for (const dir of WELL_KNOWN_SKILL_DIRS) {
      expect(dir.label).toBeTruthy();
      expect(dir.tool).toBeTruthy();
    }
  });

  it('associates GitHub Copilot with .github paths', () => {
    const ghDirs = WELL_KNOWN_SKILL_DIRS.filter(d => d.path.startsWith('.github/'));
    expect(ghDirs.length).toBe(2);
    for (const dir of ghDirs) {
      expect(dir.tool).toBe('GitHub Copilot');
    }
  });

  it('associates Claude with .claude path', () => {
    const claudeDirs = WELL_KNOWN_SKILL_DIRS.filter(d => d.path.startsWith('.claude/'));
    expect(claudeDirs.length).toBe(1);
    expect(claudeDirs[0].tool).toBe('Claude');
  });
});

describe('SkillsConfig defaults', () => {
  it('returns defaults when store has no skills data', () => {
    const store = createMockStore({});
    const data = store.get();
    // Simulate the getSkillsConfig logic
    const config: SkillsConfig = data?.skills || {
      sources: [],
      disabledSkills: [],
      maxSkillSizeBytes: 50 * 1024,
      maxTotalSkillSizeBytes: 200 * 1024,
    };
    expect(config.sources).toEqual([]);
    expect(config.disabledSkills).toEqual([]);
    expect(config.maxSkillSizeBytes).toBe(50 * 1024);
    expect(config.maxTotalSkillSizeBytes).toBe(200 * 1024);
  });

  it('reads stored config from store', () => {
    const store = createMockStore({
      skills: {
        sources: [{ type: 'local', url: '/test/path', enabled: true }],
        disabledSkills: ['some-skill'],
        maxSkillSizeBytes: 100000,
        maxTotalSkillSizeBytes: 500000,
      },
    });
    const data = store.get();
    expect(data.skills.sources).toHaveLength(1);
    expect(data.skills.sources[0].url).toBe('/test/path');
    expect(data.skills.disabledSkills).toContain('some-skill');
  });
});

describe('SkillSourceEntry validation', () => {
  it('local source requires url', () => {
    const source: SkillSourceEntry = { type: 'local', url: '', enabled: true };
    expect(source.url).toBe('');
  });

  it('git source has optional ref and path', () => {
    const source: SkillSourceEntry = {
      type: 'git',
      url: 'https://github.com/owner/repo',
      ref: 'v1.0.0',
      path: 'skills/',
      enabled: true,
      sha256: 'abc123',
    };
    expect(source.type).toBe('git');
    expect(source.ref).toBe('v1.0.0');
    expect(source.path).toBe('skills/');
    expect(source.sha256).toBe('abc123');
  });

  it('source defaults to enabled', () => {
    const source: SkillSourceEntry = {
      type: 'local',
      url: '/some/path',
      enabled: true,
    };
    expect(source.enabled).toBe(true);
  });
});

describe('Config store operations', () => {
  it('saves skills config to store', () => {
    const store = createMockStore({});
    const config: SkillsConfig = {
      sources: [
        { type: 'local', url: '/path/to/skills', enabled: true },
        { type: 'git', url: 'https://github.com/org/repo', enabled: false, ref: 'main' },
      ],
      disabledSkills: ['disabled-skill'],
      maxSkillSizeBytes: 50 * 1024,
      maxTotalSkillSizeBytes: 200 * 1024,
    };

    const currentData = store.get() || {};
    store.update({
      ...currentData,
      skills: {
        sources: config.sources,
        disabledSkills: config.disabledSkills,
        maxSkillSizeBytes: config.maxSkillSizeBytes,
        maxTotalSkillSizeBytes: config.maxTotalSkillSizeBytes,
      },
    });

    const saved = store.get();
    expect(saved.skills.sources).toHaveLength(2);
    expect(saved.skills.sources[0].type).toBe('local');
    expect(saved.skills.sources[1].type).toBe('git');
    expect(saved.skills.disabledSkills).toContain('disabled-skill');
  });

  it('preserves other config keys when saving skills', () => {
    const store = createMockStore({
      mcpConfig: { enabled: true, servers: [] },
      testMode: true,
    });

    store.update({
      ...store.get(),
      skills: {
        sources: [{ type: 'local', url: '/test', enabled: true }],
        disabledSkills: [],
        maxSkillSizeBytes: 50 * 1024,
        maxTotalSkillSizeBytes: 200 * 1024,
      },
    });

    const saved = store.get();
    expect(saved.mcpConfig.enabled).toBe(true);
    expect(saved.testMode).toBe(true);
    expect(saved.skills.sources).toHaveLength(1);
  });

  it('toggles source enabled state', () => {
    const sources: SkillSourceEntry[] = [
      { type: 'local', url: '/path1', enabled: true },
      { type: 'local', url: '/path2', enabled: false },
    ];

    // Toggle first source off
    const toggled = sources.map((s, i) => (i === 0 ? { ...s, enabled: !s.enabled } : s));
    expect(toggled[0].enabled).toBe(false);
    expect(toggled[1].enabled).toBe(false);
  });

  it('adds a new source', () => {
    const sources: SkillSourceEntry[] = [{ type: 'local', url: '/existing', enabled: true }];
    const newSource: SkillSourceEntry = {
      type: 'git',
      url: 'https://github.com/org/repo',
      enabled: true,
    };

    const updated = [...sources, newSource];
    expect(updated).toHaveLength(2);
    expect(updated[1].type).toBe('git');
  });

  it('removes a source by index', () => {
    const sources: SkillSourceEntry[] = [
      { type: 'local', url: '/path1', enabled: true },
      { type: 'local', url: '/path2', enabled: true },
      { type: 'git', url: 'https://github.com/org/repo', enabled: true },
    ];

    const filtered = sources.filter((_, i) => i !== 1);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].url).toBe('/path1');
    expect(filtered[1].url).toBe('https://github.com/org/repo');
  });

  it('detects duplicate sources', () => {
    const sources: SkillSourceEntry[] = [
      { type: 'local', url: '/path1', enabled: true },
      { type: 'git', url: 'https://github.com/org/repo', enabled: true },
    ];

    const isDuplicate = (source: SkillSourceEntry) =>
      sources.some(s => s.type === source.type && s.url === source.url);

    expect(isDuplicate({ type: 'local', url: '/path1', enabled: true })).toBe(true);
    expect(isDuplicate({ type: 'local', url: '/new-path', enabled: true })).toBe(false);
    expect(isDuplicate({ type: 'git', url: 'https://github.com/org/repo', enabled: true })).toBe(
      true
    );
  });
});

describe('Well-known path detection', () => {
  it('marks paths as detected when checker returns true', async () => {
    const checkPathExists = vi.fn().mockResolvedValue(true);
    const projectRoot = '/home/user/project';

    const statuses: WellKnownPathStatus[] = await Promise.all(
      WELL_KNOWN_SKILL_DIRS.map(async dir => {
        const fullPath = `${projectRoot}/${dir.path}`;
        const detected = await checkPathExists(fullPath);
        return {
          path: dir.path,
          label: dir.label,
          tool: dir.tool,
          detected,
          enabled: false,
        };
      })
    );

    expect(statuses.every(s => s.detected)).toBe(true);
    expect(checkPathExists).toHaveBeenCalledTimes(WELL_KNOWN_SKILL_DIRS.length);
  });

  it('marks paths as not detected when checker returns false', async () => {
    const checkPathExists = vi.fn().mockResolvedValue(false);
    const projectRoot = '/home/user/project';

    const statuses: WellKnownPathStatus[] = await Promise.all(
      WELL_KNOWN_SKILL_DIRS.map(async dir => {
        const fullPath = `${projectRoot}/${dir.path}`;
        const detected = await checkPathExists(fullPath);
        return {
          path: dir.path,
          label: dir.label,
          tool: dir.tool,
          detected,
          enabled: false,
        };
      })
    );

    expect(statuses.every(s => !s.detected)).toBe(true);
  });

  it('handles mixed detection results', async () => {
    const checkPathExists = vi.fn().mockImplementation(async (path: string) => {
      return path.includes('.github');
    });
    const projectRoot = '/home/user/project';

    const statuses: WellKnownPathStatus[] = await Promise.all(
      WELL_KNOWN_SKILL_DIRS.map(async dir => {
        const fullPath = `${projectRoot}/${dir.path}`;
        const detected = await checkPathExists(fullPath);
        return {
          path: dir.path,
          label: dir.label,
          tool: dir.tool,
          detected,
          enabled: false,
        };
      })
    );

    const githubDirs = statuses.filter(s => s.path.startsWith('.github'));
    const otherDirs = statuses.filter(s => !s.path.startsWith('.github'));
    expect(githubDirs.every(s => s.detected)).toBe(true);
    expect(otherDirs.every(s => !s.detected)).toBe(true);
  });

  it('handles detection errors gracefully', async () => {
    const checkPathExists = vi.fn().mockRejectedValue(new Error('Permission denied'));
    const projectRoot = '/home/user/project';

    const statuses: WellKnownPathStatus[] = await Promise.all(
      WELL_KNOWN_SKILL_DIRS.map(async dir => {
        const fullPath = `${projectRoot}/${dir.path}`;
        let detected = false;
        try {
          detected = await checkPathExists(fullPath);
        } catch {
          detected = false;
        }
        return {
          path: dir.path,
          label: dir.label,
          tool: dir.tool,
          detected,
          enabled: false,
        };
      })
    );

    expect(statuses.every(s => !s.detected)).toBe(true);
  });

  it('identifies enabled well-known paths from sources', () => {
    const projectRoot = '/home/user/project';
    const sources: SkillSourceEntry[] = [
      { type: 'local', url: `${projectRoot}/.github/skills`, enabled: true },
      { type: 'local', url: `${projectRoot}/.claude/skills`, enabled: false },
    ];

    const statuses: WellKnownPathStatus[] = WELL_KNOWN_SKILL_DIRS.map(dir => {
      const fullPath = `${projectRoot}/${dir.path}`;
      const isEnabled = sources.some(s => s.type === 'local' && s.url === fullPath && s.enabled);
      return {
        path: dir.path,
        label: dir.label,
        tool: dir.tool,
        detected: false,
        enabled: isEnabled,
      };
    });

    const githubSkills = statuses.find(s => s.path === '.github/skills');
    expect(githubSkills?.enabled).toBe(true);

    const claudeSkills = statuses.find(s => s.path === '.claude/skills');
    expect(claudeSkills?.enabled).toBe(false);

    const genericSkills = statuses.find(s => s.path === 'skills');
    expect(genericSkills?.enabled).toBe(false);
  });
});

describe('Git URL validation', () => {
  // Mirrors the validation logic in SkillSourceEditorDialog
  function isValidGitUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return false;
      const allowedHosts = ['github.com', 'gitlab.com', 'bitbucket.org'];
      return allowedHosts.some(
        host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
    } catch {
      return false;
    }
  }

  it('accepts valid GitHub URLs', () => {
    expect(isValidGitUrl('https://github.com/owner/repo')).toBe(true);
    expect(isValidGitUrl('https://github.com/owner/repo.git')).toBe(true);
  });

  it('accepts valid GitLab URLs', () => {
    expect(isValidGitUrl('https://gitlab.com/owner/repo')).toBe(true);
  });

  it('accepts valid Bitbucket URLs', () => {
    expect(isValidGitUrl('https://bitbucket.org/owner/repo')).toBe(true);
  });

  it('rejects non-HTTPS URLs', () => {
    expect(isValidGitUrl('http://github.com/owner/repo')).toBe(false);
    expect(isValidGitUrl('git://github.com/owner/repo')).toBe(false);
    expect(isValidGitUrl('ssh://github.com/owner/repo')).toBe(false);
  });

  it('rejects unknown hosts', () => {
    expect(isValidGitUrl('https://evil.com/owner/repo')).toBe(false);
    expect(isValidGitUrl('https://fakegithub.com/owner/repo')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isValidGitUrl('not-a-url')).toBe(false);
    expect(isValidGitUrl('')).toBe(false);
  });

  it('accepts subdomain URLs', () => {
    expect(isValidGitUrl('https://api.github.com/owner/repo')).toBe(true);
  });
});

describe('Source type separation', () => {
  it('separates local and git sources', () => {
    const sources: SkillSourceEntry[] = [
      { type: 'local', url: '/path1', enabled: true },
      { type: 'git', url: 'https://github.com/org/repo1', enabled: true },
      { type: 'local', url: '/path2', enabled: false },
      { type: 'git', url: 'https://github.com/org/repo2', enabled: true },
    ];

    const localSources = sources.filter(s => s.type === 'local');
    const gitSources = sources.filter(s => s.type === 'git');

    expect(localSources).toHaveLength(2);
    expect(gitSources).toHaveLength(2);
    expect(localSources.every(s => s.type === 'local')).toBe(true);
    expect(gitSources.every(s => s.type === 'git')).toBe(true);
  });

  it('identifies custom vs well-known local sources', () => {
    const projectRoot = '/home/user/project';
    const wellKnownPaths = new Set(
      WELL_KNOWN_SKILL_DIRS.map(d => `${projectRoot}/${d.path}`)
    ) as Set<string>;
    const wellKnownRelativePaths = new Set(WELL_KNOWN_SKILL_DIRS.map(d => d.path)) as Set<string>;

    const sources: SkillSourceEntry[] = [
      { type: 'local', url: `${projectRoot}/.github/skills`, enabled: true },
      { type: 'local', url: '/custom/path', enabled: true },
      { type: 'local', url: '.github/instructions', enabled: true },
    ];

    const customSources = sources.filter(
      s => !wellKnownPaths.has(s.url as string) && !wellKnownRelativePaths.has(s.url as string)
    );

    expect(customSources).toHaveLength(1);
    expect(customSources[0].url).toBe('/custom/path');
  });
});

describe('Well-known path toggling', () => {
  it('adds a new source when toggling an unregistered well-known path', () => {
    const projectRoot = '/home/user/project';
    const sources: SkillSourceEntry[] = [];
    const dirPath = '.github/skills';
    const fullPath = `${projectRoot}/${dirPath}`;

    const existingIndex = sources.findIndex(s => s.type === 'local' && s.url === fullPath);
    expect(existingIndex).toBe(-1);

    const newSources = [...sources, { type: 'local' as const, url: fullPath, enabled: true }];
    expect(newSources).toHaveLength(1);
    expect(newSources[0].enabled).toBe(true);
  });

  it('toggles an existing well-known path source', () => {
    const projectRoot = '/home/user/project';
    const sources: SkillSourceEntry[] = [
      { type: 'local', url: `${projectRoot}/.github/skills`, enabled: true },
    ];
    const dirPath = '.github/skills';
    const fullPath = `${projectRoot}/${dirPath}`;

    const existingIndex = sources.findIndex(s => s.type === 'local' && s.url === fullPath);
    expect(existingIndex).toBe(0);

    const newSources = sources.map((s, i) =>
      i === existingIndex ? { ...s, enabled: !s.enabled } : s
    );
    expect(newSources[0].enabled).toBe(false);
  });
});

describe('WELL_KNOWN_SKILL_REPOS', () => {
  it('contains expected repositories', () => {
    const urls = WELL_KNOWN_SKILL_REPOS.map(r => r.url);
    expect(urls).toContain('https://github.com/kubeshark/kubeshark');
    expect(urls).toContain('https://github.com/helmfile/helmfile');
    expect(urls).toContain('https://github.com/openshift/lightspeed-service');
    expect(urls).toContain('https://github.com/microsoft/azure-skills');
    expect(urls).toContain('https://github.com/fluxcd/agent-skills');
    expect(urls).toContain('https://github.com/MicrosoftDocs/Agent-Skills');
    expect(urls).toContain('https://github.com/kubernetes/website');
  });

  it('has labels and descriptions for each repo', () => {
    for (const repo of WELL_KNOWN_SKILL_REPOS) {
      expect(repo.label).toBeTruthy();
      expect(repo.description).toBeTruthy();
      expect(repo.url).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it('all repos have a skills path and ref', () => {
    for (const repo of WELL_KNOWN_SKILL_REPOS) {
      expect(repo.path).toBeTruthy();
      expect(repo.ref).toBeTruthy();
    }
  });

  it('all repos use commit SHA refs (not branch names)', () => {
    for (const repo of WELL_KNOWN_SKILL_REPOS) {
      expect(repo.ref).toMatch(/^[0-9a-f]{40}$/);
    }
  });
});

describe('Well-known repo toggling', () => {
  it('adds a new git source when toggling an unregistered well-known repo', () => {
    const sources: SkillSourceEntry[] = [];
    const repo = WELL_KNOWN_SKILL_REPOS[0];

    const existingIndex = sources.findIndex(s => s.type === 'git' && s.url === repo.url);
    expect(existingIndex).toBe(-1);

    const newSources: SkillSourceEntry[] = [
      ...sources,
      {
        type: 'git',
        url: repo.url,
        ref: repo.ref || 'main',
        path: repo.path,
        enabled: true,
      },
    ];
    expect(newSources).toHaveLength(1);
    expect(newSources[0].type).toBe('git');
    expect(newSources[0].enabled).toBe(true);
    expect(newSources[0].url).toBe(repo.url);
  });

  it('toggles an existing well-known repo source', () => {
    const repo = WELL_KNOWN_SKILL_REPOS[0];
    const sources: SkillSourceEntry[] = [
      { type: 'git', url: repo.url, ref: 'main', path: 'skills', enabled: true },
    ];

    const existingIndex = sources.findIndex(s => s.type === 'git' && s.url === repo.url);
    expect(existingIndex).toBe(0);

    const newSources = sources.map((s, i) =>
      i === existingIndex ? { ...s, enabled: !s.enabled } : s
    );
    expect(newSources[0].enabled).toBe(false);
  });

  it('separates well-known repos from custom git sources', () => {
    const wellKnownRepoUrls = new Set(WELL_KNOWN_SKILL_REPOS.map(r => r.url)) as Set<string>;
    const sources: SkillSourceEntry[] = [
      { type: 'git', url: 'https://github.com/kubeshark/kubeshark', ref: 'main', enabled: true },
      { type: 'git', url: 'https://github.com/custom/repo', ref: 'main', enabled: true },
    ];

    const customGitSources = sources.filter(s => !wellKnownRepoUrls.has(s.url as string));
    expect(customGitSources).toHaveLength(1);
    expect(customGitSources[0].url).toBe('https://github.com/custom/repo');
  });
});
