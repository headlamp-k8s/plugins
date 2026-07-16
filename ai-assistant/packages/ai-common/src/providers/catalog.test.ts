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
import { getDefaultConfig, getProviderById, getProviderFields, modelProviders } from './catalog';

describe('modelConfig', () => {
  it('includes a copilot provider', () => {
    const copilot = getProviderById('copilot');
    expect(copilot).toBeDefined();
    expect(copilot!.name).toBe('GitHub Copilot');
    expect(copilot!.icon).toBe('ai-providers:copilot');
  });

  it('copilot provider has apiKey and model fields', () => {
    const fields = getProviderFields('copilot');
    const fieldNames = fields.map(f => f.name);
    expect(fieldNames).toContain('apiKey');
    expect(fieldNames).toContain('model');
  });

  it('copilot provider default model is gpt-4o', () => {
    const defaults = getDefaultConfig('copilot');
    expect(defaults.model).toBe('gpt-4o');
  });

  it('all providers have unique IDs', () => {
    const ids = modelProviders.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('copilot is listed before openai in provider order', () => {
    const ids = modelProviders.map(p => p.id);
    const copilotIndex = ids.indexOf('copilot');
    const openaiIndex = ids.indexOf('openai');
    expect(copilotIndex).toBeLessThan(openaiIndex);
  });
});
