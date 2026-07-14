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
import { describe, expect, it } from 'vitest';
import type { ConversationMessage as Prompt } from '../conversation/types';
import type { ToolCall } from '../tools/types';
import AssistantSession from './AssistantSession';

class ConcreteManager extends AssistantSession {
  async userSend(message: string): Promise<Prompt> {
    void message;
    return { role: 'assistant', content: 'ok' };
  }
  async processToolResponses(): Promise<Prompt> {
    return { role: 'tool', content: 'result' };
  }
  abort(): void {}
}

describe('AIManager', () => {
  it('does not depend on later feature modules', () => {
    const source = readFileSync(resolve(__dirname, 'AssistantSession.ts'), 'utf8');
    expect(source).not.toContain('../components/');
    expect(source).not.toContain('../context/');
  });
  it('starts with empty history and context', () => {
    const mgr = new ConcreteManager();
    expect(mgr.history).toEqual([]);
    expect(mgr.currentContext).toBe('');
  });

  it('setContext replaces the current context', () => {
    const mgr = new ConcreteManager();
    mgr.setContext('ctx-a');
    expect(mgr.currentContext).toBe('ctx-a');
    mgr.setContext('ctx-b');
    expect(mgr.currentContext).toBe('ctx-b');
  });

  it('addContextualInfo appends with a newline when context exists', () => {
    const mgr = new ConcreteManager();
    mgr.setContext('first');
    mgr.addContextualInfo('second');
    expect(mgr.currentContext).toBe('first\nsecond');
  });

  it('addContextualInfo sets context directly when empty', () => {
    const mgr = new ConcreteManager();
    mgr.addContextualInfo('only');
    expect(mgr.currentContext).toBe('only');
  });

  it('reset clears history and context', () => {
    const mgr = new ConcreteManager();
    mgr.history.push({ role: 'user', content: 'hello' });
    mgr.setContext('some context');
    mgr.reset();
    expect(mgr.history).toEqual([]);
    expect(mgr.currentContext).toBe('');
  });

  it('getPromptSuggestions returns an empty array by default', () => {
    const mgr = new ConcreteManager();
    expect(mgr.getPromptSuggestions()).toEqual([]);
  });

  it('ToolCall type holds the expected fields', () => {
    const tc: ToolCall = { id: '1', name: 'my-tool', arguments: { key: 'val' }, type: 'mcp' };
    expect(tc.type).toBe('mcp');
  });
});
