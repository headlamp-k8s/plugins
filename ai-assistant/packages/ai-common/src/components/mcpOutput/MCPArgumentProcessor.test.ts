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

import { beforeEach, describe, expect, it } from 'vitest';
import { MCPArgumentProcessor } from './MCPArgumentProcessor';

describe('MCPArgumentProcessor', () => {
  beforeEach(() => {
    // Reset static state between tests
    MCPArgumentProcessor['schemasLoaded'] = false;
    MCPArgumentProcessor['toolSchemas'] = new Map();
    MCPArgumentProcessor.getToolsConfig = null;
  });

  it('loadSchemas does nothing when getToolsConfig is not injected', async () => {
    await MCPArgumentProcessor.loadSchemas();
    expect(MCPArgumentProcessor['schemasLoaded']).toBe(false);
  });

  it('loadSchemas populates toolSchemas from injected getToolsConfig', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({
      success: true,
      config: {
        myServer: {
          myTool: {
            description: 'A test tool',
            inputSchema: {
              type: 'object',
              properties: { query: { type: 'string' } },
              required: ['query'],
            },
          },
        },
      },
    });

    await MCPArgumentProcessor.loadSchemas();

    expect(MCPArgumentProcessor['schemasLoaded']).toBe(true);
    const schema = MCPArgumentProcessor['toolSchemas'].get('myServer__myTool');
    expect(schema?.name).toBe('myServer__myTool');
    expect(schema?.description).toBe('A test tool');
  });

  it('processArguments returns errors when no schema is found', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({ success: true, config: {} });
    const result = await MCPArgumentProcessor.processArguments('unknown__tool', { foo: 'bar' });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.schema).toBeNull();
  });

  it('processArguments fills required fields with defaults when missing', async () => {
    MCPArgumentProcessor.getToolsConfig = async () => ({
      success: true,
      config: {
        srv: {
          tool: {
            inputSchema: {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          },
        },
      },
    });

    const result = await MCPArgumentProcessor.processArguments('srv__tool', {});
    expect(result.processed).toHaveProperty('name');
  });
});
