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
import type { LangChainTool } from '../langchain/LangChainTool';
import { getToolByName } from './builtInTools';

describe('getToolByName', () => {
  const tools = [{ config: { name: 'tool-a' } }, { config: { name: 'tool-b' } }] as LangChainTool[];

  it('finds a matching tool by name', () => {
    expect(getToolByName('tool-b', tools)).toBe(tools[1]);
  });

  it('returns undefined for an unknown tool name', () => {
    expect(getToolByName('missing-tool', tools)).toBeUndefined();
  });

  it('returns undefined for an empty tool list', () => {
    expect(getToolByName('tool-a', [])).toBeUndefined();
  });
});
