import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as child_process from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { 
  getRepoRoot, 
  getPluginVersion, 
  commitPluginVersionChange, 
  getVersionBumpCommit,
  validateCommitSha,
  isCommitPushedToRemote,
  createReleaseTag,
  pushTag,
  checkGitStatus,
  getLatestTagForPlugin,
  hasChangesInPluginSinceTag,
  getCommitsSinceTag,
  getChangelogForPlugin,
  tagExists
} from './git.js';

vi.mock('node:child_process');
vi.mock('node:fs');

describe('git utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepoRoot', () => {
    it('should return repo root from git command', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('/repo/root\n');
      expect(getRepoRoot()).toBe('/repo/root');
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['rev-parse', '--show-toplevel'], expect.anything());
    });

    it('should exit if not in a git repo', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      vi.mocked(child_process.execFileSync).mockImplementation(() => { throw new Error('not a git repo'); });
      expect(() => getRepoRoot()).toThrow('exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('getPluginVersion', () => {
    it('should read version from package.json', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));
      expect(getPluginVersion('/plugin/path')).toBe('1.2.3');
    });

    it('should exit on error', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      vi.mocked(fs.readFileSync).mockImplementation(() => { throw new Error('read error'); });
      expect(() => getPluginVersion('/plugin/path')).toThrow('exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('commitPluginVersionChange', () => {
    it('should add files and commit', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      vi.mocked(fs.existsSync).mockReturnValue(true); // package-lock.json exists
      
      commitPluginVersionChange('my-plugin', '1.2.3');
      
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['add', expect.stringContaining('package.json')], expect.anything());
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['add', expect.stringContaining('package-lock.json')], expect.anything());
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['commit', '--signoff', '-m', 'my-plugin: Bump version to 1.2.3'], expect.anything());
    });
  });

  describe('getVersionBumpCommit', () => {
    it('should find commit SHA for version bump', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('abc123commitsha\n');
      const sha = getVersionBumpCommit('my-plugin', '1.2.3');
      expect(sha).toBe('abc123commitsha');
      expect(child_process.execFileSync).toHaveBeenCalledWith(
        'git',
        ['log', '--format=%H', '-S', '"version": "1.2.3"', '--', path.join('my-plugin', 'package.json')],
        expect.anything()
      );
    });

    it('should fallback to latest package.json change if exact match not found', () => {
      vi.mocked(child_process.execFileSync)
        .mockReturnValueOnce('') // No -S match
        .mockReturnValueOnce('fallbacksha\n'); // Latest change
        
      const sha = getVersionBumpCommit('my-plugin', '1.2.3');
      expect(sha).toBe('fallbacksha');
    });

    it('should return null if no commit found', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(getVersionBumpCommit('my-plugin', '1.2.3')).toBeNull();
    });
  });

  describe('validateCommitSha', () => {
    it('should return true for valid SHA', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(validateCommitSha('abc123sha')).toBe(true);
    });

    it('should return false for invalid SHA', () => {
      vi.mocked(child_process.execFileSync).mockImplementation(() => { throw new Error('invalid sha'); });
      expect(validateCommitSha('invalid')).toBe(false);
    });
  });

  describe('isCommitPushedToRemote', () => {
    it('should return true if commit is ancestor of remote HEAD', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(isCommitPushedToRemote('sha')).toBe(true);
    });

    it('should return false if merge-base fails', () => {
      vi.mocked(child_process.execFileSync)
        .mockReturnValueOnce('') // cat-file success
        .mockImplementationOnce(() => { throw new Error('not an ancestor'); });
      expect(isCommitPushedToRemote('sha')).toBe(false);
    });
  });

  describe('createReleaseTag', () => {
    it('should create an annotated tag', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      const tag = createReleaseTag('my-plugin', '1.2.3');
      expect(tag).toBe('my-plugin-1.2.3');
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['tag', '-a', 'my-plugin-1.2.3', '-m', 'my-plugin 1.2.3'], expect.anything());
    });
  });

  describe('pushTag', () => {
    it('should push tag to origin', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      pushTag('my-plugin-1.2.3');
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['push', 'origin', 'my-plugin-1.2.3'], expect.anything());
    });
  });

  describe('checkGitStatus', () => {
    it('should return true if status is empty', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(checkGitStatus()).toBe(true);
    });

    it('should return false if status is not empty', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('M file.txt');
      expect(checkGitStatus()).toBe(false);
    });
  });

  describe('getLatestTagForPlugin', () => {
    it('should return the newest tag', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('my-plugin-1.1.0\nmy-plugin-1.0.0\n');
      expect(getLatestTagForPlugin('my-plugin')).toBe('my-plugin-1.1.0');
    });

    it('should return null if no tags found', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(getLatestTagForPlugin('my-plugin')).toBeNull();
    });
  });

  describe('hasChangesInPluginSinceTag', () => {
    it('should return true if diff has entries', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('modified-file.ts\n');
      expect(hasChangesInPluginSinceTag('my-plugin', 'v1.0.0')).toBe(true);
    });

    it('should return false if diff is empty', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(hasChangesInPluginSinceTag('my-plugin', 'v1.0.0')).toBe(false);
    });
  });

  describe('getCommitsSinceTag', () => {
    it('should return array of commit lines', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('hash1 commit message 1\nhash2 commit message 2\n');
      const commits = getCommitsSinceTag('my-plugin', 'v1.0.0');
      expect(commits).toHaveLength(2);
      expect(commits[0]).toBe('hash1 commit message 1');
    });

    it('should return empty array if no commits', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(getCommitsSinceTag('my-plugin', 'v1.0.0')).toEqual([]);
    });
  });

  describe('getChangelogForPlugin', () => {
    it('should generate changelog based on commits since tag', () => {
      vi.mocked(child_process.execFileSync)
        .mockReturnValueOnce('/repo/root\n') // rev-parse for latest tag
        .mockReturnValueOnce('my-plugin-1.0.0\n') // latest tag
        .mockReturnValueOnce('/repo/root\n') // rev-parse for commits since tag
        .mockReturnValueOnce('hash1 message\n'); // commits since tag
      
      const changelog = getChangelogForPlugin('my-plugin');
      expect(changelog).toBe('hash1 message');
    });

    it('should handle case with no previous tag', () => {
      vi.mocked(child_process.execFileSync)
        .mockReturnValueOnce('/repo/root\n') // rev-parse for latest tag
        .mockReturnValueOnce('') // no latest tag
        .mockReturnValueOnce('/repo/root\n') // rev-parse for all commits
        .mockReturnValueOnce('all commits message\n'); // all commits
      
      const changelog = getChangelogForPlugin('my-plugin');
      expect(changelog).toBe('all commits message');
    });
  });

  describe('tagExists', () => {
    it('should check local tag existence', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(tagExists('my-tag')).toBe(true);
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['rev-parse', '--verify', 'my-tag'], expect.anything());
    });

    it('should check remote tag existence', () => {
      vi.mocked(child_process.execFileSync).mockReturnValue('');
      expect(tagExists('my-tag', true)).toBe(true);
      expect(child_process.execFileSync).toHaveBeenCalledWith('git', ['ls-remote', '--tags', 'origin', 'my-tag'], expect.anything());
    });

    it('should return false if command fails', () => {
      vi.mocked(child_process.execFileSync).mockImplementation(() => { throw new Error('not found'); });
      expect(tagExists('non-existent')).toBe(false);
    });
  });
});
