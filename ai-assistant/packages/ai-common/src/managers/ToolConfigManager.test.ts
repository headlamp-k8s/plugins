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
import {
  getAllAvailableTools,
  getEnabledToolIds,
  isBuiltInTool,
  isToolEnabled,
  parseMCPToolName,
  setEnabledTools,
  toggleTool,
} from './ToolConfigManager';

describe('ToolConfigManager', () => {
  const builtInTool = getAllAvailableTools()[0];

  it('getAllAvailableTools returns the built-in tools array', () => {
    expect(getAllAvailableTools()).toEqual([
      {
        id: 'kubernetes_api_request',
        name: 'Kubernetes API Request',
        description:
          'Make requests to the Kubernetes API server to fetch, create, update or delete resources.',
        source: 'built-in',
      },
    ]);
  });

  describe('isToolEnabled', () => {
    it('returns true when plugin settings are null', () => {
      expect(isToolEnabled(null, builtInTool.id)).toBe(true);
    });

    it('returns true when enabledTools is missing', () => {
      expect(isToolEnabled({}, builtInTool.id)).toBe(true);
    });

    it('returns true when a tool is explicitly enabled', () => {
      expect(isToolEnabled({ enabledTools: { [builtInTool.id]: true } }, builtInTool.id)).toBe(
        true
      );
    });

    it('returns false when a tool is explicitly disabled', () => {
      expect(isToolEnabled({ enabledTools: { [builtInTool.id]: false } }, builtInTool.id)).toBe(
        false
      );
    });

    it('returns true for unknown tools by default', () => {
      expect(isToolEnabled({ enabledTools: { other: false } }, 'unknown-tool')).toBe(true);
    });
  });

  it('toggleTool toggles a tool enabled state', () => {
    const enabled = toggleTool({}, builtInTool.id);
    const disabled = toggleTool(enabled, builtInTool.id);

    expect(enabled.enabledTools).toEqual({ [builtInTool.id]: true });
    expect(disabled.enabledTools).toEqual({ [builtInTool.id]: false });
  });

  it('getEnabledToolIds returns enabled built-in tool IDs', () => {
    expect(getEnabledToolIds({ enabledTools: { [builtInTool.id]: false } })).toEqual([]);
    expect(getEnabledToolIds({ enabledTools: { [builtInTool.id]: true } })).toEqual([
      builtInTool.id,
    ]);
  });

  it('setEnabledTools sets enabled tools for built-in tools', () => {
    expect(setEnabledTools({}, [builtInTool.id])).toEqual({
      enabledTools: { [builtInTool.id]: true },
    });
    expect(setEnabledTools({}, [])).toEqual({
      enabledTools: { [builtInTool.id]: false },
    });
  });

  it('isBuiltInTool checks the built-in tool registry', () => {
    expect(isBuiltInTool(builtInTool.id)).toBe(true);
    expect(isBuiltInTool('github__search')).toBe(false);
  });

  describe('parseMCPToolName', () => {
    it('splits names with the MCP separator', () => {
      expect(parseMCPToolName('github__search_code')).toEqual({
        serverName: 'github',
        toolName: 'search_code',
      });
    });

    it('returns the default server when there is no separator', () => {
      expect(parseMCPToolName('search_code')).toEqual({
        serverName: 'default',
        toolName: 'search_code',
      });
    });
  });
});
