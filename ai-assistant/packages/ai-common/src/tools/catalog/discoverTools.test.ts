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
import { getAllAvailableToolsIncludingMCP } from './discoverTools';
import { getAllAvailableTools } from './toolDefinitions';

describe('getAllAvailableToolsIncludingMCP', () => {
  it('ignores malformed server and tool config entries', async () => {
    await expect(
      getAllAvailableToolsIncludingMCP(async () => ({
        success: true,
        config: { brokenServer: null, validServer: { brokenTool: 'invalid' } },
      }))
    ).resolves.toEqual(getAllAvailableTools());
  });

  it('excludes explicitly disabled MCP tools', async () => {
    const tools = await getAllAvailableToolsIncludingMCP(async () => ({
      success: true,
      config: {
        'test-server': {
          active_tool: { enabled: true, description: 'active' },
          disabled_tool: { enabled: false, description: 'disabled' },
          legacy_tool: { description: 'no enabled field' },
        },
      },
    }));
    const ids = tools.map(tool => tool.id);
    expect(ids).toContain('test-server__active_tool');
    expect(ids).toContain('test-server__legacy_tool');
    expect(ids).not.toContain('test-server__disabled_tool');
  });
});
