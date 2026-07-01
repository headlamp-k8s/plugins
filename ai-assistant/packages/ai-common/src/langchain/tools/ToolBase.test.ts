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
import { z } from 'zod';
import { ToolBase, type ToolConfig, type ToolResponse } from './ToolBase';

class EchoTool extends ToolBase {
  config: ToolConfig = {
    name: 'echo',
    shortDescription: 'Echo',
    description: 'Returns the input text',
    schema: z.object({ text: z.string() }),
  };

  handler = async (args: Record<string, any>): Promise<ToolResponse> => ({
    content: args.text as string,
    shouldAddToHistory: true,
    shouldProcessFollowUp: false,
  });
}

class FailingTool extends ToolBase {
  config: ToolConfig = {
    name: 'fail',
    shortDescription: 'Fail',
    description: 'Always throws',
    schema: z.object({}),
  };

  handler = async (): Promise<ToolResponse> => {
    throw new Error('boom');
  };
}

describe('ToolBase', () => {
  it('createLangChainTool returns a callable tool', async () => {
    const tool = new EchoTool().createLangChainTool();
    expect(tool).toBeDefined();
    expect(typeof tool.invoke).toBe('function');
  });

  it('handler result is returned as tool output', async () => {
    const tool = new EchoTool().createLangChainTool();
    const result = await tool.invoke({ text: 'hello' });
    expect(result).toBe('hello');
  });

  it('handler error is caught and returned as JSON error string', async () => {
    const tool = new FailingTool().createLangChainTool();
    const result = await tool.invoke({});
    const parsed = JSON.parse(result as string);
    expect(parsed.error).toBe(true);
    expect(parsed.message).toContain('boom');
  });
});
