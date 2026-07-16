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

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { ConversationMessage as Prompt } from '../../conversation/types';
import type { ToolExecutionResult } from '../ToolRuntime';
import { LangChainTool, type ToolConfig } from './LangChainTool';

class EchoTool extends LangChainTool {
  config: ToolConfig = {
    name: 'echo',
    shortDescription: 'Echo',
    description: 'Returns the input text',
    schema: z.object({ text: z.string() }),
  };

  handler = async (args: Record<string, unknown>): Promise<ToolExecutionResult> => ({
    content: args.text as string,
    shouldAddToHistory: true,
    shouldProcessFollowUp: false,
  });
}

class FailingTool extends LangChainTool {
  config: ToolConfig = {
    name: 'fail',
    shortDescription: 'Fail',
    description: 'Always throws',
    schema: z.object({}),
  };

  handler = async (): Promise<ToolExecutionResult> => {
    throw new Error('boom');
  };
}

/** Tool that records the toolCallId and pendingPrompt it receives. */
class SpyTool extends LangChainTool {
  config: ToolConfig = {
    name: 'spy',
    shortDescription: 'Spy',
    description: 'Records handler arguments',
    schema: z.object({}),
  };

  lastToolCallId: string | undefined = 'sentinel';
  lastPendingPrompt: Prompt | undefined = {} as Prompt;

  handler = async (
    _args: Record<string, unknown>,
    toolCallId?: string,
    pendingPrompt?: Prompt
  ): Promise<ToolExecutionResult> => {
    this.lastToolCallId = toolCallId;
    this.lastPendingPrompt = pendingPrompt;
    return { content: 'ok', shouldAddToHistory: false, shouldProcessFollowUp: false };
  };
}

describe('ToolBase', () => {
  it('does not depend on later tool-result formatter modules', () => {
    const source = readFileSync(resolve(__dirname, 'LangChainTool.ts'), 'utf8');
    expect(source).not.toContain('../toolResultFormatter');
  });
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

  it('createLangChainTool passes undefined for toolCallId and pendingPrompt', async () => {
    // toolCallId and pendingPrompt are LangChain-message-level concepts not
    // available inside the LangChain tool callback. Handlers that need them
    // (e.g. KubernetesTool) must be invoked via ToolManager directly.
    const spy = new SpyTool();
    const spyFn = vi.spyOn(spy, 'handler');
    const langchainTool = spy.createLangChainTool();

    await langchainTool.invoke({});

    expect(spyFn).toHaveBeenCalledWith({}, undefined, undefined);
    expect(spy.lastToolCallId).toBeUndefined();
    expect(spy.lastPendingPrompt).toBeUndefined();
  });
});
