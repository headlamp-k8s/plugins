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
  baseSystemPromptTemplate,
  createCustomPromptTemplate,
  resourceAnalysisPromptTemplate,
  troubleshootingPromptTemplate,
} from './PromptTemplates';

describe('PromptTemplates', () => {
  it('baseSystemPromptTemplate is defined', () => {
    expect(baseSystemPromptTemplate).toBeDefined();
  });

  it('troubleshootingPromptTemplate is a ChatPromptTemplate', () => {
    expect(troubleshootingPromptTemplate).toBeDefined();
    expect(typeof troubleshootingPromptTemplate.formatMessages).toBe('function');
  });

  it('resourceAnalysisPromptTemplate is a ChatPromptTemplate', () => {
    expect(resourceAnalysisPromptTemplate).toBeDefined();
    expect(typeof resourceAnalysisPromptTemplate.formatMessages).toBe('function');
  });

  it('createCustomPromptTemplate returns a ChatPromptTemplate', () => {
    const tmpl = createCustomPromptTemplate('You are {role}', 'Hello {name}');
    expect(tmpl).toBeDefined();
    expect(typeof tmpl.formatMessages).toBe('function');
  });

  it('createCustomPromptTemplate formats messages with provided variables', async () => {
    const tmpl = createCustomPromptTemplate('System: {sys}', 'Human: {human}');
    const messages = await tmpl.formatMessages({ sys: 'assistant', human: 'hi' });
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain('assistant');
    expect(messages[1].content).toContain('hi');
  });
});
