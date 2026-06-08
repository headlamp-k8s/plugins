import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getPluginPath, getAllPlugins, getPluginInfo, findTarball } from './plugin.js';
import * as gitUtils from './git.js';

vi.mock('fs');
vi.mock('./git.js');

describe('plugin utilities', () => {
  const mockRepoRoot = '/mock/repo/root';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(gitUtils.getRepoRoot).mockReturnValue(mockRepoRoot);
  });

  describe('getPluginPath', () => {
    it('should return plugin path if it exists and has package.json', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const result = getPluginPath('test-plugin');
      expect(result).toBe(path.join(mockRepoRoot, 'test-plugin'));
    });

    it('should exit if plugin directory does not exist', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(() => getPluginPath('non-existent')).toThrow('exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit if package.json does not exist', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      vi.mocked(fs.existsSync).mockImplementation((p: any) => {
        if (typeof p === 'string' && p.endsWith('package.json')) return false;
        return true;
      });

      expect(() => getPluginPath('no-pkg-json')).toThrow('exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('getAllPlugins', () => {
    it('should return sorted list of valid plugins', () => {
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'plugin-a', isDirectory: () => true },
        { name: 'plugin-b', isDirectory: () => true },
        { name: '.git', isDirectory: () => true },
        { name: 'node_modules', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ] as any);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
        if (p.includes('plugin-a')) {
          return JSON.stringify({ scripts: { build: 'tsc' } });
        }
        if (p.includes('plugin-b')) {
          return JSON.stringify({ scripts: {}, keywords: ['headlamp-plugin'] });
        }
        return '{}';
      });

      const plugins = getAllPlugins();
      expect(plugins).toEqual(['plugin-a', 'plugin-b']);
    });

    it('should skip directories without package.json or correct keywords/scripts', () => {
        vi.mocked(fs.readdirSync).mockReturnValue([
          { name: 'not-a-plugin', isDirectory: () => true },
        ] as any);
  
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'just-a-dir' }));
  
        const plugins = getAllPlugins();
        expect(plugins).toEqual([]);
      });
  });

  describe('getPluginInfo', () => {
    it('should return name and version from package.json', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: 'my-plugin', version: '1.2.3' }));
      const info = getPluginInfo('/path/to/plugin');
      expect(info).toEqual({ name: 'my-plugin', version: '1.2.3' });
    });

    it('should fallback to basename if name is missing', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));
      const info = getPluginInfo('/path/to/my-plugin');
      expect(info).toEqual({ name: 'my-plugin', version: '1.2.3' });
    });

    it('should exit on read error', () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      vi.mocked(fs.readFileSync).mockImplementation(() => { throw new Error('read error'); });

      expect(() => getPluginInfo('/invalid/path')).toThrow('exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('findTarball', () => {
    it('should return exact version match if version provided', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['plugin-1.0.0.tgz', 'plugin-1.1.0.tgz'] as any);
      const result = findTarball('/path', 'plugin', '1.0.0');
      expect(result).toBe(path.join('/path', 'plugin-1.0.0.tgz'));
    });

    it('should return latest version match if no version provided', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['plugin-1.0.0.tgz', 'plugin-1.1.0.tgz'] as any);
      const result = findTarball('/path', 'plugin');
      expect(result).toBe(path.join('/path', 'plugin-1.1.0.tgz'));
    });

    it('should return null if no tarball found', () => {
      vi.mocked(fs.readdirSync).mockReturnValue(['not-a-tarball.txt'] as any);
      const result = findTarball('/path', 'plugin');
      expect(result).toBeNull();
    });
  });
});
