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

import { describe, expect, it } from 'vitest';
import { MCPClientAdapter, NullMCPClientAdapter } from './MCPClientAdapter';
import { ToolManager } from './ToolManager';

describe('NullMCPClientAdapter', () => {
  const adapter = new NullMCPClientAdapter();

  it('isAvailable returns false', () => {
    expect(adapter.isAvailable()).toBe(false);
  });

  it('getConfig returns success: false', async () => {
    const result = await adapter.getConfig();
    expect(result.success).toBe(false);
  });

  it('getToolsConfig returns success: false', async () => {
    const result = await adapter.getToolsConfig();
    expect(result.success).toBe(false);
  });

  it('executeTool returns null', async () => {
    expect(await adapter.executeTool()).toBeNull();
  });

  it('isToolEnabled returns false', async () => {
    expect(await adapter.isToolEnabled()).toBe(false);
  });

  it('setToolEnabled returns false', async () => {
    expect(await adapter.setToolEnabled()).toBe(false);
  });

  it('getToolStats returns null', async () => {
    expect(await adapter.getToolStats()).toBeNull();
  });

  it('updateToolsConfig returns false', async () => {
    expect(await adapter.updateToolsConfig()).toBe(false);
  });

  it('parseToolName splits on double-underscore', () => {
    expect(adapter.parseToolName('myServer__myTool')).toEqual({
      serverName: 'myServer',
      toolName: 'myTool',
    });
  });

  it('parseToolName falls back to default server when no separator', () => {
    expect(adapter.parseToolName('plainTool')).toEqual({
      serverName: 'default',
      toolName: 'plainTool',
    });
  });
});

describe('ToolManager with injected MCPClientAdapter', () => {
  it('uses NullMCPClientAdapter by default', () => {
    const mgr = new ToolManager();
    expect(mgr.getMCPClient().isAvailable()).toBe(false);
  });

  it('accepts a custom MCPClientAdapter', async () => {
    let wasCalled = false;
    const customAdapter: MCPClientAdapter = {
      isAvailable: () => true,
      getConfig: async () => ({ success: true, config: { servers: [] } }),
      getToolsConfig: async () => ({ success: false }),
      executeTool: async () => null,
      isToolEnabled: async () => true,
      setToolEnabled: async () => true,
      getToolStats: async () => null,
      updateToolsConfig: async () => {
        wasCalled = true;
        return true;
      },
      parseToolName: name => ({ serverName: 'x', toolName: name }),
    };

    const mgr = new ToolManager({ mcpClient: customAdapter });
    expect(mgr.getMCPClient().isAvailable()).toBe(true);
    await mgr.updateMCPToolsConfig({});
    expect(wasCalled).toBe(true);
  });
});
