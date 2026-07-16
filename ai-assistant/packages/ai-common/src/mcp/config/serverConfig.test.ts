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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MCPSettings } from '../types';
import {
  expandEnvAndResolvePaths,
  hasClusterDependentServers,
  makeMcpServers,
  settingsChanges,
  summarizeMcpToolStateChanges,
  validateToolArgs,
} from './serverConfig';

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
    const result = expandEnvAndResolvePaths(
      ['C:\\path\\to\\file', 'nochange/needed'],
      null,
      'win32'
    );
    expect(result).toEqual(['C:/path/to/file', 'nochange/needed']);
  });

  it('handles docker bind src path conversion on Windows', () => {
    const arg = 'type=bind,src=C:\\path\\to\\dir,dst=/data';
    const result = expandEnvAndResolvePaths([arg], null, 'win32');
    // allow a possible current-working-directory prefix (seen on some environments),
    // but ensure the drive letter path was converted to /c/path/to/dir or kept as C:/path/to/dir
    expect(result[0]).toMatch(
      /type=bind,src=(?:.*(?:\/c\/path\/to\/dir|\/[A-Za-z]:\/path\/to\/dir)),dst=\/data/
    );
  });

  it('does not alter docker bind src path on non-Windows', () => {
    const arg = 'type=bind,src=/home/user/dir,dst=/data';
    const result = expandEnvAndResolvePaths([arg], null, 'linux');
    expect(result).toEqual([arg]);
  });

  it('uses empty environment values when process is polyfilled without env', () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal('process', { platform: 'linux', cwd: () => '/tmp' });
    try {
      expect(expandEnvAndResolvePaths(['%USERPROFILE%/%APPDATA%/%LOCALAPPDATA%'])).toEqual(['//']);
    } finally {
      vi.stubGlobal('process', originalProcess);
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

  it('builds an empty merged environment when process is polyfilled without env', () => {
    const originalProcess = globalThis.process;
    vi.stubGlobal('process', { platform: 'linux', cwd: () => '/tmp' });
    try {
      const result = makeMcpServers(
        {
          enabled: true,
          servers: [{ name: 'server', command: 'cmd', args: [], enabled: true }],
        },
        []
      );
      expect(result.server.env).toEqual({});
    } finally {
      vi.stubGlobal('process', originalProcess);
    }
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

    const entry = result['valid'];
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
    const entry = result['withCluster'];
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

    const result = settingsChanges(null, nextSettings);
    expect(result).toContain('• MCP will be ENABLED');
    expect(result).toContain('• ADD server: "s1" (cmd1)');
  });

  it('returns empty array when both current and next settings are null', () => {
    const result = settingsChanges(null, null);
    expect(result).toEqual([]);
  });

  it('reports disabling and removed servers when next is null', () => {
    const current: MCPSettings = {
      enabled: true,
      servers: [
        { name: 's1', command: 'cmd1', args: [], enabled: true },
        { name: 's2', command: 'cmd2', args: [], enabled: true },
      ],
    };

    const result = settingsChanges(current, null);
    expect(result).toContain('• MCP will be DISABLED');
    expect(result).toContain('• REMOVE server: "s1"');
    expect(result).toContain('• REMOVE server: "s2"');
  });

  it('reports disabling when enabled -> disabled and no servers', () => {
    const current = { enabled: true, servers: [] };
    const next = { enabled: false, servers: [] };

    const result = settingsChanges(current, next);
    expect(result).toEqual(['• MCP will be DISABLED']);
  });

  it('detects added, removed and modified servers including command/args/env/enable changes', () => {
    const current: MCPSettings = {
      enabled: true,
      servers: [
        { name: 'keep', command: 'cmd', args: ['a'], enabled: true, env: { X: '1' } },
        { name: 'removed', command: 'rm', args: [], enabled: true },
        { name: 'modified', command: 'old', args: ['one'], enabled: true, env: { A: 'a' } },
      ],
    };

    const next: MCPSettings = {
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

    const result = settingsChanges(current, next);

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

    const result = settingsChanges(s, s);
    expect(result).toEqual([]);
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

  it('counts added tools once and shows them in ADD summary', () => {
    const current = {};
    const nw = {
      srv1: {
        'tool-a': { enabled: true },
      },
    };
    const res = summarizeMcpToolStateChanges(current, nw);
    // Each added tool is counted exactly once (not also in enabledTools)
    expect(res.totalChanges).toBe(1);
    expect(res.summaryText).toContain('+ ADD (1)');
    expect(res.summaryText).toContain('tool-a (srv1)');
    expect(res.summaryText).not.toContain('✓ ENABLE');
    expect(res.summaryText).not.toContain('✗ DISABLE');
  });

  it('counts removed tools and shows them in REMOVE summary', () => {
    const current = {
      srv1: {
        'tool-x': { enabled: true },
      },
    };
    const nw = {};
    const res = summarizeMcpToolStateChanges(current, nw);
    // removedTools (1) => total 1
    expect(res.totalChanges).toBe(1);
    expect(res.summaryText).toContain('- REMOVE (1): tool-x (srv1)');
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
      s1: { a: { enabled: false }, b: { enabled: true } }, // a->disabled, b added
      s2: {
        /* x removed */
      },
      s3: { y: { enabled: false } }, // new tool, disabled
    };
    const res = summarizeMcpToolStateChanges(current, nw);
    // Each tool is counted once: a (disabled), b (added), x (removed), y (added) => 4
    expect(res.totalChanges).toBe(4);
    expect(res.summaryText).toContain('✗ DISABLE (1)');
    expect(res.summaryText).toContain('+ ADD (2)');
    expect(res.summaryText).toContain('- REMOVE (1)');
    expect(res.summaryText).toContain('b (s1)');
    expect(res.summaryText).toContain('a (s1)');
    expect(res.summaryText).toContain('y (s3)');
    // Added tools must NOT also appear in ENABLE/DISABLE sections
    expect(res.summaryText).not.toContain('✓ ENABLE');
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

  it('treats missing enabled field as equivalent to true (default-enabled semantics)', () => {
    // Regression: `enabled !== newTool.enabled` would fire when one side has
    // `undefined` and the other has `true`, producing a phantom ENABLE entry.
    const current = {
      srv: {
        // Legacy/older config entry — no enabled field
        'legacy-tool': { usageCount: 0 },
      },
    };
    const nw = {
      srv: {
        // Newer entry with explicit enabled: true — semantically identical
        'legacy-tool': { enabled: true, usageCount: 0 },
      },
    };
    const res = summarizeMcpToolStateChanges(current, nw);
    // undefined and true are both "enabled"; no enable/disable change to report
    expect(res.totalChanges).toBe(0);
    expect(res.summaryText).toBe('');
  });

  it('correctly reports enable when tool goes from explicitly disabled to missing (default-enabled)', () => {
    const current = { srv: { tool: { enabled: false } } };
    const nw = { srv: { tool: { usageCount: 1 } } }; // missing enabled → true
    const res = summarizeMcpToolStateChanges(current, nw);
    expect(res.totalChanges).toBe(1);
    expect(res.summaryText).toContain('✓ ENABLE');
  });
});
