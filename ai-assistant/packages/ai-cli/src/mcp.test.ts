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
import { initMCPTools } from './mcp.js';

describe('initMCPTools', () => {
  it('returns the original model unchanged when settings is undefined', async () => {
    const fakeModel: any = { id: 'fake-model' };
    const result = await initMCPTools(fakeModel, undefined);
    expect(result.model).toBe(fakeModel);
    expect(typeof result.cleanup).toBe('function');
    await result.cleanup();
  });

  it('returns the original model unchanged when settings has no servers', async () => {
    const fakeModel: any = { id: 'fake-model' };
    const result = await initMCPTools(fakeModel, { enabled: true, servers: [] });
    expect(result.model).toBe(fakeModel);
  });

  it('returns the original model unchanged when MCP is not enabled', async () => {
    const fakeModel: any = { id: 'fake-model' };
    const result = await initMCPTools(fakeModel, {
      enabled: false,
      servers: [{ name: 'srv', command: 'echo', args: [], enabled: true }],
    });
    expect(result.model).toBe(fakeModel);
  });
});
