import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import { 
  getOwnerAndRepo, 
  getOctokit, 
  getRelease, 
  getReleaseByName, 
  createDraftRelease, 
  uploadAssetToRelease, 
  publishRelease 
} from './github.js';

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(),
}));
vi.mock('fs');
vi.mock('./git.js');

describe('github utilities', () => {
  const mockOctokit = {
    repos: {
      getReleaseByTag: vi.fn(),
      listReleases: vi.fn(),
      createRelease: vi.fn(),
      uploadReleaseAsset: vi.fn(),
      updateRelease: vi.fn(),
    }
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.mocked(Octokit).mockReturnValue(mockOctokit as any);
    vi.stubEnv('GITHUB_TOKEN', 'mock-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getOwnerAndRepo', () => {
    it('should return correct owner and repo', () => {
      expect(getOwnerAndRepo()).toEqual({ owner: 'headlamp-k8s', repo: 'plugins' });
    });
  });

  describe('getOctokit', () => {
    it('should create octokit instance with token', () => {
      getOctokit();
      expect(Octokit).toHaveBeenCalledWith({ auth: 'mock-token' });
    });

    it('should exit if GITHUB_TOKEN is not set', () => {
      delete process.env.GITHUB_TOKEN;
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      expect(() => getOctokit()).toThrow('exit');
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('getRelease', () => {
    it('should return release data if found', async () => {
      mockOctokit.repos.getReleaseByTag.mockResolvedValue({ data: { id: 123 } });
      const release = await getRelease('v1.0.0');
      expect(release).toEqual({ id: 123 });
    });

    it('should return null if not found (404)', async () => {
      mockOctokit.repos.getReleaseByTag.mockRejectedValue({ status: 404 });
      const release = await getRelease('v1.0.0');
      expect(release).toBeNull();
    });
  });

  describe('getReleaseByName', () => {
    it('should find release by name from list', async () => {
      mockOctokit.repos.listReleases.mockResolvedValue({ 
        data: [{ name: 'release-1', id: 1 }, { name: 'release-2', id: 2 }] 
      });
      const release = await getReleaseByName('release-2');
      expect(release).toEqual({ name: 'release-2', id: 2 });
    });

    it('should return null if name not in list', async () => {
      mockOctokit.repos.listReleases.mockResolvedValue({ data: [] });
      const release = await getReleaseByName('non-existent');
      expect(release).toBeNull();
    });
  });

  describe('createDraftRelease', () => {
    it('should call createRelease with draft=true', async () => {
      mockOctokit.repos.createRelease.mockResolvedValue({ data: { id: 456 } });
      const release = await createDraftRelease('my-plugin', '1.2.3', 'body text', 'target-sha');
      
      expect(release).toEqual({ id: 456 });
      expect(mockOctokit.repos.createRelease).toHaveBeenCalledWith(expect.objectContaining({
        tag_name: 'my-plugin-1.2.3',
        name: 'my-plugin v1.2.3',
        body: 'body text',
        draft: true,
        target_commitish: 'target-sha'
      }));
    });
  });

  describe('uploadAssetToRelease', () => {
    it('should upload file asset', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('asset data'));
      
      await uploadAssetToRelease(123, '/path/to/asset.tgz', 'custom-name.tgz');
      
      expect(mockOctokit.repos.uploadReleaseAsset).toHaveBeenCalledWith(expect.objectContaining({
        release_id: 123,
        name: 'custom-name.tgz',
        data: expect.anything()
      }));
    });

    it('should throw if asset file missing', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      await expect(uploadAssetToRelease(123, '/missing')).rejects.toThrow('Asset file does not exist');
    });
  });

  describe('publishRelease', () => {
    it('should update release to draft=false', async () => {
      await publishRelease(123);
      expect(mockOctokit.repos.updateRelease).toHaveBeenCalledWith(expect.objectContaining({
        release_id: 123,
        draft: false
      }));
    });
  });
});
