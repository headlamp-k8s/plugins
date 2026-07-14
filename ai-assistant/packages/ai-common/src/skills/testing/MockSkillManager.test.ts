import { describe, expect, it } from 'vitest';
import { DEFAULT_SKILLS_CONFIG } from '../config';
import { createMockSkillManager } from './MockSkillManager';

const cfg = DEFAULT_SKILLS_CONFIG;

describe('MockSkillManager', () => {
  describe('loadAllSkills', () => {
    it('resolves with an empty array by default', async () => {
      const mgr = createMockSkillManager();
      expect(await mgr.loadAllSkills(cfg)).toEqual([]);
    });

    it('throws when throwOnLoad is true', async () => {
      const mgr = createMockSkillManager({ throwOnLoad: true });
      await expect(mgr.loadAllSkills(cfg)).rejects.toThrow('MockSkillManager: load failed');
    });
  });

  describe('getRoutedSkillsPromptText', () => {
    it('returns empty string by default', async () => {
      const mgr = createMockSkillManager();
      expect(await mgr.getRoutedSkillsPromptText('show pods', cfg)).toBe('');
    });

    it('returns the configured skillPrompt for any query', async () => {
      const mgr = createMockSkillManager({ skillPrompt: '\n## Skill: debug\n...' });
      expect(await mgr.getRoutedSkillsPromptText('debug pods', cfg)).toBe('\n## Skill: debug\n...');
    });

    it('throws when throwOnRoute is true', async () => {
      const mgr = createMockSkillManager({ throwOnRoute: true });
      await expect(mgr.getRoutedSkillsPromptText('q', cfg)).rejects.toThrow(
        'MockSkillManager: route failed'
      );
    });

    it('calls onRoute spy with the query string', async () => {
      const queries: string[] = [];
      const mgr = createMockSkillManager({ onRoute: q => queries.push(q) });
      await mgr.getRoutedSkillsPromptText('show deployments', cfg);
      await mgr.getRoutedSkillsPromptText('list pods', cfg);
      expect(queries).toEqual(['show deployments', 'list pods']);
    });

    it('onRoute is optional — no spy does not throw', async () => {
      const mgr = createMockSkillManager();
      await expect(mgr.getRoutedSkillsPromptText('q', cfg)).resolves.not.toThrow();
    });
  });
});
