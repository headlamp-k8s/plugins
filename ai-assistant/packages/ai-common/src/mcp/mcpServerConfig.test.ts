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

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  expandEnvAndResolvePaths,
  hasClusterDependentServers,
  makeMcpServers,
  parseServerNameToolName,
  settingsChanges,
  summarizeMcpToolStateChanges,
  validateToolArgs,
} from './mcpServerConfig';

describe('expandEnvAndResolvePaths', () => {
  beforeEach(() => {
    // Ensure predictable environment vars
    process.env.APPDATA = process.env.APPDATA || '';
    process.env.LOCALAPPDATA = process.env.LOCALAPPDATA || '';
  });

  it('replaces HEADLAMP_CURRENT_CLUSTER with cluster', () => {
    const result = expandEnvAndResolvePaths(['connect HEADLAMP_CURRENT_CLUSTER'], 'my-current');
    expect(result).toEqual(['connect my-current']);
  });

  it('replaces %APPDATA% and %LOCALAPPDATA% with environment values', () => {
    process.env.APPDATA = '/some/appdata';
    process.env.LOCALAPPDATA = '/some/localappdata';

    const result = expandEnvAndResolvePaths(['%APPDATA%/file', '%LOCALAPPDATA%\\other']);

    if (process.platform === 'win32') {
      expect(result).toEqual(['/some/appdata/file', '/some/localappdata/other']);
    } else {
      // on non-windows we expect backslashes to be preserved here
      expect(result).toEqual(['/some/appdata/file', '/some/localappdata\\other']);
    }
  });

  it('converts backslashes to forward slashes on win32', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    try {
      const result = expandEnvAndResolvePaths(['C:\\path\\to\\file', 'nochange/needed']);
      expect(result).toEqual(['C:/path/to/file', 'nochange/needed']);
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    }
  });

  it('handles docker bind src path conversion on Windows', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    try {
      const arg = 'type=bind,src=C:\\path\\to\\dir,dst=/data';
      const result = expandEnvAndResolvePaths([arg]);
      // allow a possible current-working-directory prefix (seen on some environments),
      // but ensure the drive letter path was converted to /c/path/to/dir or kept as C:/path/to/dir
      expect(result[0]).toMatch(
        /type=bind,src=(?:.*(?:\/c\/path\/to\/dir|\/[A-Za-z]:\/path\/to\/dir)),dst=\/data/
      );
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    }
  });

  it('does not alter docker bind src path on non-Windows', () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });
    try {
      const arg = 'type=bind,src=/home/user/dir,dst=/data';
      const result = expandEnvAndResolvePaths([arg]);
      expect(result).toEqual([arg]);
    } finally {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    }
  });
});

describe('makeMcpServers', () => {
  beforeEach(() => {
    // ensure predictable env for merging tests
    process.env.TEST_ORIG_ENV = 'orig';
  });

  afterEach(() => {
    delete process.env.TEST_ORIG_ENV;
  });

  it('returns empty when settings are null', () => {
    const result = makeMcpServers(null, ['cluster1']);
    expect(result).toEqual({});
  });

  it('returns empty when mcp is disabled or has no servers', () => {
    expect(makeMcpServers({ enabled: false, servers: [] }, ['c'])).toEqual({});
    expect(makeMcpServers({ enabled: true, servers: [] }, ['c'])).toEqual({});
  });

  it('filters out disabled or invalid servers and builds server entries', () => {
    const mcpSettings = {
      enabled: true,
      servers: [
        {
          name: 'valid',
          command: 'cmd',
          args: ['arg1'],
          enabled: true,
          env: { MCP_VAR: 'mcp' },
        },
        {
          name: 'disabled',
          command: 'cmd',
          args: [],
          enabled: false,
        },
        {
          // missing command
          name: 'nocmd',
          command: '',
          args: [],
          enabled: true,
        },
        {
          // missing name
          name: '',
          command: 'cmd',
          args: [],
          enabled: true,
        },
      ],
    };

    const result = makeMcpServers(mcpSettings, ['clusterA']);

    expect(result).toHaveProperty('valid');
    expect(Object.keys(result)).toEqual(['valid']);

    const entry = result['valid'] as any;
    expect(entry.transport).toBe('stdio');
    expect(entry.command).toBe('cmd');
    expect(entry.args).toEqual(['arg1']);
    // env should include process.env and server.env overrides
    expect(entry.env.MCP_VAR).toBe('mcp');
    expect(entry.env.TEST_ORIG_ENV).toBe('orig');
    // restart settings
    expect(entry.restart).toBeDefined();
    expect(entry.restart.enabled).toBe(true);
    expect(entry.restart.maxAttempts).toBe(3);
    expect(entry.restart.delayMs).toBe(2000);
  });

  it('expands HEADLAMP_CURRENT_CLUSTER placeholder using provided clusters[0]', () => {
    const mcpSettings = {
      enabled: true,
      servers: [
        {
          name: 'withCluster',
          command: 'cmd',
          args: ['connect', 'HEADLAMP_CURRENT_CLUSTER'],
          enabled: true,
        },
      ],
    };

    const result = makeMcpServers(mcpSettings, ['my-current-cluster']);

    expect(result).toHaveProperty('withCluster');
    const entry = result['withCluster'] as any;
    expect(entry.args).toEqual(['connect', 'my-current-cluster']);
  });
});

describe('hasClusterDependentServers', () => {
  it('returns false for null settings', () => {
    expect(hasClusterDependentServers(null)).toBe(false);
  });

  it('returns false when no servers use HEADLAMP_CURRENT_CLUSTER', () => {
    const settings = {
      enabled: true,
      servers: [{ name: 's', command: 'cmd', args: ['--foo'], enabled: true }],
    };
    expect(hasClusterDependentServers(settings)).toBe(false);
  });

  it('returns true when an enabled server uses HEADLAMP_CURRENT_CLUSTER', () => {
    const settings = {
      enabled: true,
      servers: [
        {
          name: 's',
          command: 'cmd',
          args: ['--cluster', 'HEADLAMP_CURRENT_CLUSTER'],
          enabled: true,
        },
      ],
    };
    expect(hasClusterDependentServers(settings)).toBe(true);
  });

  it('returns false when only disabled servers use HEADLAMP_CURRENT_CLUSTER', () => {
    const settings = {
      enabled: true,
      servers: [{ name: 's', command: 'cmd', args: ['HEADLAMP_CURRENT_CLUSTER'], enabled: false }],
    };
    expect(hasClusterDependentServers(settings)).toBe(false);
  });
});

describe('settingsChanges', () => {
  it('reports enabling and added servers when current is null', () => {
    const nextSettings = {
      enabled: true,
      servers: [{ name: 's1', command: 'cmd1', args: [], enabled: true }],
    };

    const result = settingsChanges(null, nextSettings as any);
    expect(result).toContain('• MCP will be ENABLED');
    expect(result).toContain('• ADD server: "s1" (cmd1)');
  });

  it('returns empty array when both current and next settings are null', () => {
    const result = settingsChanges(null, null as any);
    expect(result).toEqual([]);
  });

  it('reports disabling and removed servers when next is null', () => {
    const current = {
      enabled: true,
      servers: [
        { name: 's1', command: 'cmd1', args: [], enabled: true },
        { name: 's2', command: 'cmd2', args: [], enabled: true },
      ],
    };

    const result = settingsChanges(current as any, null as any);
    expect(result).toContain('• MCP will be DISABLED');
    expect(result).toContain('• REMOVE server: "s1"');
    expect(result).toContain('• REMOVE server: "s2"');
  });

  it('reports disabling when enabled -> disabled and no servers', () => {
    const current = { enabled: true, servers: [] };
    const next = { enabled: false, servers: [] };

    const result = settingsChanges(current as any, next as any);
    expect(result).toEqual(['• MCP will be DISABLED']);
  });

  it('detects added, removed and modified servers including command/args/env/enable changes', () => {
    const current = {
      enabled: true,
      servers: [
        { name: 'keep', command: 'cmd', args: ['a'], enabled: true, env: { X: '1' } },
        { name: 'removed', command: 'rm', args: [], enabled: true },
        { name: 'modified', command: 'old', args: ['one'], enabled: true, env: { A: 'a' } },
      ],
    };

    const next = {
      enabled: true,
      servers: [
        { name: 'keep', command: 'cmd', args: ['a'], enabled: true, env: { X: '1' } }, // unchanged
        { name: 'added', command: 'new', args: [], enabled: true }, // new
        {
          name: 'modified',
          command: 'newcmd',
          args: ['one', 'two'],
          enabled: false, // toggled
          env: { A: 'b' }, // changed
        },
      ],
    };

    const result = settingsChanges(current as any, next as any);

    expect(result).toEqual(
      expect.arrayContaining(['• ADD server: "added" (new)', '• REMOVE server: "removed"'])
    );

    // find the modify message for 'modified' server
    const modifyMsg = result.find(r => r.startsWith('• MODIFY server "modified"'));
    expect(modifyMsg).toBeDefined();
    // should mention enable/disable, command change, args change, and env change
    expect(modifyMsg).toMatch(/enable|disable/);
    expect(modifyMsg).toMatch(/change command: "old" → "newcmd"/);
    expect(modifyMsg).toMatch(/change arguments: \["one"\] → \["one","two"\]/);
    expect(modifyMsg).toMatch(/change environment variables/);
  });

  it('returns empty array when there are no changes', () => {
    const s = {
      enabled: true,
      servers: [{ name: 's', command: 'c', args: ['x'], enabled: true, env: { K: 'v' } }],
    };

    const result = settingsChanges(s as any, s as any);
    expect(result).toEqual([]);
  });
});

describe('parseServerNameToolName', () => {
  it('returns default serverName when no separator is present', () => {
    const res = parseServerNameToolName('kubectl');
    expect(res.serverName).toBe('default');
    expect(res.toolName).toBe('kubectl');
  });

  it('splits server and tool when a single separator is present', () => {
    const res = parseServerNameToolName('myserver__helm');

    expect(res.serverName).toBe('myserver');
    expect(res.toolName).toBe('helm');
  });

  it('preserves additional separators in the toolName when multiple separators are present', () => {
    const res = parseServerNameToolName('myserver__helm__test');
    expect(res.serverName).toBe('myserver');
    expect(res.toolName).toBe('helm__test');
  });
});

describe('validateToolArgs', () => {
  it('returns valid when schema is null', () => {
    const res = validateToolArgs(null, { any: 1 });
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('fails when a required property is missing', () => {
    const schema = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    };
    const res = validateToolArgs(schema, {});
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Required parameter 'name'");
  });

  it('fails when property type does not match (number expected)', () => {
    const schema = {
      type: 'object',
      properties: {
        age: { type: 'number' },
      },
    };
    const res = validateToolArgs(schema, { age: 'not-a-number' });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('should be a number');
  });

  it('validates array types correctly', () => {
    const schema = {
      type: 'object',
      properties: {
        items: { type: 'array' },
      },
    };
    const ok = validateToolArgs(schema, { items: [1, 2, 3] });
    expect(ok.valid).toBe(true);

    const notOk = validateToolArgs(schema, { items: 'not-an-array' });
    expect(notOk.valid).toBe(false);
    expect(notOk.error).toContain('should be an array');
  });

  it('validates object types and rejects arrays/null for object type', () => {
    const schema = {
      type: 'object',
      properties: {
        cfg: { type: 'object' },
      },
    };
    expect(validateToolArgs(schema, { cfg: { a: 1 } }).valid).toBe(true);
    const asArray = validateToolArgs(schema, { cfg: [1, 2] });
    expect(asArray.valid).toBe(false);
    expect(asArray.error).toContain('should be an object');
    const asNull = validateToolArgs(schema, { cfg: null });
    expect(asNull.valid).toBe(false);
    expect(asNull.error).toContain('should be an object');
  });

  it('treats unsupported property types as non-fatal and returns valid', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'integer' }, // unsupported type in validator
      },
    };
    const res = validateToolArgs(schema, { count: 42 });
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });
});

describe('summarizeMcpToolStateChanges', () => {
  it('returns zero changes for identical empty configs', () => {
    const res = summarizeMcpToolStateChanges({}, {});
    expect(res.totalChanges).toBe(0);
    expect(res.summaryText).toBe('');
  });

  it('counts added enabled tools and includes them in ENABLE summary', () => {
    const current = {};
    const nw = {
      srv1: {
        'tool-a': { enabled: true },
      },
    };
    const res = summarizeMcpToolStateChanges(current, nw);
    // addedTools (1) + enabledTools (1) => total 2
    expect(res.totalChanges).toBe(2);
    expect(res.summaryText).toContain('✓ ENABLE (1)');
    expect(res.summaryText).toContain('tool-a (srv1)');
    expect(res.summaryText).not.toContain('✗ DISABLE');
  });

  it('counts removed tools even when no summary lines are produced', () => {
    const current = {
      srv1: {
        'tool-x': { enabled: true },
      },
    };
    const nw = {};
    const res = summarizeMcpToolStateChanges(current, nw);
    // removedTools (1) => total 1
    expect(res.totalChanges).toBe(1);
    // removed tools are not printed in summaryText, so should be empty
    expect(res.summaryText).toBe('');
  });

  it('detects enable/disable changes between configs', () => {
    const current = {
      srvA: {
        'tool-1': { enabled: true },
        'tool-2': { enabled: false },
      },
    };
    const nw = {
      srvA: {
        'tool-1': { enabled: false }, // changed to disabled
        'tool-2': { enabled: true }, // changed to enabled
      },
    };
    const res = summarizeMcpToolStateChanges(current, nw);
    // two changes (one disabled, one enabled)
    expect(res.totalChanges).toBe(2);
    expect(res.summaryText).toContain('✓ ENABLE (1): tool-2 (srvA)');
    expect(res.summaryText).toContain('✗ DISABLE (1): tool-1 (srvA)');
    // Ensure ENABLE and DISABLE sections are separated by a blank line
    expect(res.summaryText.split('\n\n').length).toBeGreaterThanOrEqual(2);
  });

  it('aggregates changes across multiple servers', () => {
    const current = {
      s1: { a: { enabled: true } },
      s2: { x: { enabled: false } },
    };
    const nw = {
      s1: { a: { enabled: false }, b: { enabled: true } }, // a->disabled, b added+enabled
      s2: {
        /* x removed */
      },
      s3: { y: { enabled: false } }, // new disabled
    };
    const res = summarizeMcpToolStateChanges(current, nw);
    // Changes: a (changed), b (added), x (removed), y (added)
    // enabledTools: b (added enabled) => 1
    // disabledTools: a (changed), y (added disabled) => 2
    // addedTools: b,y => 2
    // removedTools: x => 1
    // total = 1+2+2+1 = 6
    expect(res.totalChanges).toBe(6);
    expect(res.summaryText).toContain('✓ ENABLE (1)');
    expect(res.summaryText).toContain('✗ DISABLE (2)');
    expect(res.summaryText).toContain('b (s1)');
    expect(res.summaryText).toContain('a (s1)');
    expect(res.summaryText).toContain('y (s3)');
  });

  it('ignores non-enabled metadata-only changes (description/inputSchema)', () => {
    const current = {
      srvM: {
        'tool-meta': { enabled: true, description: 'old', inputSchema: { type: 'string' } },
      },
    };
    const nw = {
      srvM: {
        'tool-meta': { enabled: true, description: 'new', inputSchema: { type: 'string' } },
      },
    };
    const res = summarizeMcpToolStateChanges(current, nw);
    // Only metadata changed; enabled state unchanged => no counted changes
    expect(res.totalChanges).toBe(0);
    expect(res.summaryText).toBe('');
  });
});
