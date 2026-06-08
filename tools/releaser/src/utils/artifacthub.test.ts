import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as yaml from 'js-yaml';
import { 
  hasArtifactHubFile, 
  getArtifactHubPath, 
  readArtifactHubConfig, 
  updateArtifactHubConfig, 
  createArtifactHubTemplate 
} from './artifacthub.js';
import * as pluginUtils from './plugin.js';
import * as githubUtils from './github.js';

vi.mock('fs');
vi.mock('crypto');
vi.mock('js-yaml');
vi.mock('./plugin.js');
vi.mock('./github.js');

describe('artifacthub utilities', () => {
  const mockPluginPath = '/mock/plugin/path';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pluginUtils.getPluginPath).mockReturnValue(mockPluginPath);
    vi.mocked(pluginUtils.getPluginInfo).mockReturnValue({ name: 'Mock Plugin', version: '1.2.3' });
    vi.mocked(githubUtils.getOwnerAndRepo).mockReturnValue({ owner: 'owner', repo: 'repo' });
  });

  describe('hasArtifactHubFile', () => {
    it('should return true if file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      expect(hasArtifactHubFile('my-plugin')).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(path.join(mockPluginPath, 'artifacthub-pkg.yml'));
    });
  });

  describe('getArtifactHubPath', () => {
    it('should return correct path', () => {
      expect(getArtifactHubPath('my-plugin')).toBe(path.join(mockPluginPath, 'artifacthub-pkg.yml'));
    });
  });

  describe('readArtifactHubConfig', () => {
    it('should read and parse yaml content', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('yaml content');
      vi.mocked(yaml.load).mockReturnValue({ version: '1.0.0' });

      const config = readArtifactHubConfig('my-plugin');
      expect(config).toEqual({ version: '1.0.0' });
      expect(yaml.load).toHaveBeenCalledWith('yaml content');
    });

    it('should return null if file missing', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      expect(readArtifactHubConfig('my-plugin')).toBeNull();
    });
  });

  describe('updateArtifactHubConfig', () => {
    it('should create new config if none exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('mock buffer'));
      const mockHash = { update: vi.fn().mockReturnThis(), digest: vi.fn().mockReturnValue('checksum123') };
      vi.mocked(crypto.createHash).mockReturnValue(mockHash as any);
      vi.mocked(yaml.dump).mockReturnValue('new yaml content');

      updateArtifactHubConfig('my-plugin', '1.2.3', '/path/to/tarball.tgz');

      expect(fs.writeFileSync).toHaveBeenCalledWith(expect.anything(), 'new yaml content');
      expect(yaml.dump).toHaveBeenCalledWith(expect.objectContaining({
        version: '1.2.3',
        name: 'headlamp_my_plugin'
      }), expect.anything());
    });

    it('should update existing config if it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('existing content');
      vi.mocked(yaml.load).mockReturnValue({ 
        version: '1.0.0', 
        annotations: { 'headlamp/plugin/archive-url': 'old' } 
      });
      vi.mocked(yaml.dump).mockReturnValue('updated yaml content');
      
      const mockHash = { update: vi.fn().mockReturnThis(), digest: vi.fn().mockReturnValue('checksum456') };
      vi.mocked(crypto.createHash).mockReturnValue(mockHash as any);

      updateArtifactHubConfig('my-plugin', '1.2.3', '/path/to/tarball.tgz');

      expect(yaml.dump).toHaveBeenCalledWith(expect.objectContaining({
        version: '1.2.3',
        annotations: expect.objectContaining({
          'headlamp/plugin/archive-url': expect.stringContaining('my-plugin-1.2.3')
        })
      }), expect.anything());
    });
  });

  describe('createArtifactHubTemplate', () => {
    it('should create a template file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(yaml.dump).mockReturnValue('template yaml');

      createArtifactHubTemplate('my-plugin');

      expect(fs.writeFileSync).toHaveBeenCalledWith(expect.anything(), 'template yaml');
    });

    it('should throw if file already exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      expect(() => createArtifactHubTemplate('my-plugin')).toThrow('artifacthub-pkg.yml already exists');
    });
  });
});
