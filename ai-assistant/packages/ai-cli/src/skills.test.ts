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

import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { createNodeFileSystem, parseSkillSourceUrl } from './skills.js';

describe('parseSkillSourceUrl', () => {
  it('should parse a simple GitHub URL', () => {
    const source = parseSkillSourceUrl('https://github.com/microsoft/azure-skills');
    expect(source.type).toBe('git');
    expect(source.url).toBe('https://github.com/microsoft/azure-skills');
    expect(source.ref).toBe('main');
    expect(source.path).toBeUndefined();
    expect(source.enabled).toBe(true);
  });

  it('should parse URL with ref', () => {
    const source = parseSkillSourceUrl('https://github.com/owner/repo#v2.1.0');
    expect(source.url).toBe('https://github.com/owner/repo');
    expect(source.ref).toBe('v2.1.0');
    expect(source.path).toBeUndefined();
  });

  it('should parse URL with ref and path', () => {
    const source = parseSkillSourceUrl('https://github.com/owner/repo#abc123:skills/k8s');
    expect(source.url).toBe('https://github.com/owner/repo');
    expect(source.ref).toBe('abc123');
    expect(source.path).toBe('skills/k8s');
  });

  it('should parse URL with SHA ref', () => {
    const sha = '02a614f6ee1f052826f834d65c61e430ad152c8e';
    const source = parseSkillSourceUrl(`https://github.com/org/repo#${sha}:skills`);
    expect(source.ref).toBe(sha);
    expect(source.path).toBe('skills');
  });

  // Security: URL validation at the trust boundary
  it('should reject HTTP URLs', () => {
    expect(() => parseSkillSourceUrl('http://github.com/owner/repo')).toThrow(
      'Invalid skill source URL'
    );
  });

  it('should reject non-GitHub URLs', () => {
    expect(() => parseSkillSourceUrl('https://evil.com/owner/repo')).toThrow(
      'Invalid skill source URL'
    );
  });

  it('should reject file:// URLs', () => {
    expect(() => parseSkillSourceUrl('file:///etc/passwd')).toThrow('Invalid skill source URL');
  });

  it('should reject look-alike domains', () => {
    expect(() => parseSkillSourceUrl('https://fakegithub.com/x/y')).toThrow(
      'Invalid skill source URL'
    );
    expect(() => parseSkillSourceUrl('https://github.com.evil.com/x/y')).toThrow(
      'Invalid skill source URL'
    );
  });

  it('should reject FTP URLs', () => {
    expect(() => parseSkillSourceUrl('ftp://github.com/x/y')).toThrow('Invalid skill source URL');
  });

  it('should reject GitLab URLs', () => {
    expect(() => parseSkillSourceUrl('https://gitlab.com/group/project')).toThrow(
      'Invalid skill source URL'
    );
  });

  it('should reject Bitbucket URLs', () => {
    expect(() => parseSkillSourceUrl('https://bitbucket.org/team/repo')).toThrow(
      'Invalid skill source URL'
    );
  });
});

describe('createNodeFileSystem', () => {
  const nodeFs = createNodeFileSystem();

  describe('readFile', () => {
    it('should read a regular file', async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      const filePath = path.join(tmpDir, 'test.md');
      await fs.writeFile(filePath, 'hello world');
      try {
        const content = await nodeFs.readFile(filePath);
        expect(content).toBe('hello world');
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });

    it('should reject files larger than 1MB', async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      const filePath = path.join(tmpDir, 'big.md');
      // Create a 1.1MB file
      await fs.writeFile(filePath, Buffer.alloc(1.1 * 1024 * 1024, 'x'));
      try {
        await expect(nodeFs.readFile(filePath)).rejects.toThrow('File too large');
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });
  });

  describe('isDirectory', () => {
    it('should return true for directories', async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      try {
        expect(await nodeFs.isDirectory(tmpDir)).toBe(true);
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });

    it('should return false for files', async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      const filePath = path.join(tmpDir, 'test.md');
      await fs.writeFile(filePath, 'content');
      try {
        expect(await nodeFs.isDirectory(filePath)).toBe(false);
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });

    it('should not follow symlinks to directories', async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-test-'));
      const realDir = path.join(tmpDir, 'real');
      const link = path.join(tmpDir, 'link');
      await fs.mkdir(realDir);
      await fs.symlink(realDir, link);
      try {
        // lstat sees the symlink itself, not the target
        expect(await nodeFs.isDirectory(link)).toBe(false);
      } finally {
        await fs.rm(tmpDir, { recursive: true });
      }
    });
  });

  describe('joinPath', () => {
    it('should join path segments', () => {
      expect(nodeFs.joinPath('/a', 'b', 'c')).toBe('/a/b/c');
    });
  });
});
