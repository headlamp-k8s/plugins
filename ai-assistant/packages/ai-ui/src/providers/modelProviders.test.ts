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

import type {
  ProviderSettings,
  StoredProviderConfig,
} from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getProviderByIdMock } = vi.hoisted(() => ({
  getProviderByIdMock: vi.fn(),
}));

vi.mock('@headlamp-k8s/ai-common/providers/catalog', () => ({
  getProviderById: getProviderByIdMock,
}));

import {
  getModelDisplayName,
  getProviderModels,
  getProviderModelsForChat,
  markdownToPlainText,
  parseSuggestionsFromResponse,
} from './modelProviders';

function makeProviderConfig(
  overrides: Partial<StoredProviderConfig> = {},
  configOverrides: ProviderSettings = {}
): StoredProviderConfig {
  return {
    providerId: 'openai',
    displayName: 'OpenAI',
    config: {
      model: 'gpt-4o',
      ...configOverrides,
    },
    ...overrides,
  };
}

describe('modelProviders helpers', () => {
  beforeEach(() => {
    getProviderByIdMock.mockReset();
  });

  describe('markdownToPlainText', () => {
    it('strips common markdown formatting while keeping readable text', () => {
      const markdown =
        '## Title\n- **Bold**\n1. *Italic*\n> [Link](https://example.com)\n`inline`\n~~strike~~\n\n```ts\nconst value = 1;\n```';

      expect(markdownToPlainText(markdown)).toBe(
        'Title Bold Italic Link inline strike const value = 1;'
      );
    });

    it('removes surrounding square brackets from suggestion labels', () => {
      expect(markdownToPlainText('[Suggested prompt]')).toBe('Suggested prompt');
    });
  });

  describe('parseSuggestionsFromResponse', () => {
    it('extracts up to three cleaned suggestions and removes the suggestions line', () => {
      const response =
        'Summary of findings.\nSUGGESTIONS: **First** | [Second](https://example.com) | `Third` | Fourth\nNext steps.';

      expect(parseSuggestionsFromResponse(response)).toEqual({
        cleanContent: 'Summary of findings.\nNext steps.',
        suggestions: ['First', 'Second', 'Third'],
      });
    });

    it('extracts text content from structured non-string responses', () => {
      const response = [
        { type: 'text', text: 'Intro\nSUGGESTIONS: [Alpha] | _Beta_ | ~~Gamma~~' },
        { type: 'image', url: 'ignored' },
      ];

      expect(parseSuggestionsFromResponse(response)).toEqual({
        cleanContent: 'Intro',
        suggestions: ['Alpha', 'Beta', 'Gamma'],
      });
    });

    it('normalizes primitive text fields and ignores malformed content blocks', () => {
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(parseSuggestionsFromResponse({ text: 42 })).toEqual({
        cleanContent: '42',
        suggestions: [],
      });
      expect(
        parseSuggestionsFromResponse([
          null,
          { type: 'image', text: 'ignored' },
          { type: 'text', text: false },
          { type: 'text', text: { nested: 'ignored' } },
        ])
      ).toEqual({ cleanContent: 'false', suggestions: [] });
      expect(parseSuggestionsFromResponse({ other: 'ignored' })).toEqual({
        cleanContent: '',
        suggestions: [],
      });
      expect(warning).toHaveBeenCalledTimes(3);
    });

    it('filters blank suggestions', () => {
      expect(parseSuggestionsFromResponse('SUGGESTIONS: | ** ** |')).toEqual({
        cleanContent: '',
        suggestions: [],
      });
    });

    it('stops parsing untrusted candidates after three usable suggestions', () => {
      const ignoredSuggestion = '*'.repeat(100_000);

      expect(
        parseSuggestionsFromResponse(`SUGGESTIONS: | First | Second | Third | ${ignoredSuggestion}`)
      ).toEqual({
        cleanContent: '',
        suggestions: ['First', 'Second', 'Third'],
      });
    });

    it('returns original content when no suggestions line exists', () => {
      expect(parseSuggestionsFromResponse('No inline suggestions here.')).toEqual({
        cleanContent: 'No inline suggestions here.',
        suggestions: [],
      });
    });
  });

  describe('getModelDisplayName', () => {
    it('strips provider prefixes from slash-delimited model IDs', () => {
      expect(getModelDisplayName('openai/gpt-4o')).toBe('gpt-4o');
    });

    it('returns plain model names unchanged', () => {
      expect(getModelDisplayName('claude-sonnet-4')).toBe('claude-sonnet-4');
    });

    it('does not produce a blank label for a trailing slash', () => {
      expect(getModelDisplayName('openai/')).toBe('openai/');
    });
  });

  describe('getProviderModels', () => {
    it('prefers provider models and appends a custom configured model', () => {
      getProviderByIdMock.mockReturnValue({
        models: ['gpt-4o', 'gpt-4.1'],
        fields: [],
      });

      expect(getProviderModels(makeProviderConfig({}, { model: 'custom-model' }))).toEqual([
        'gpt-4o',
        'gpt-4.1',
        'custom-model',
      ]);
    });

    it('falls back to the model field options when curated models are unavailable', () => {
      getProviderByIdMock.mockReturnValue({
        fields: [
          {
            name: 'model',
            options: ['claude-3.5-sonnet', 'claude-sonnet-4'],
          },
        ],
      });

      expect(getProviderModels(makeProviderConfig({ providerId: 'anthropic' }))).toEqual([
        'claude-3.5-sonnet',
        'claude-sonnet-4',
        'gpt-4o',
      ]);
    });

    it('returns a default model when the provider has no model metadata', () => {
      getProviderByIdMock.mockReturnValue(undefined);

      expect(getProviderModels(makeProviderConfig({ providerId: 'unknown' }, {}))).toEqual([
        'default',
        'gpt-4o',
      ]);
    });

    it('does not duplicate a configured catalog model', () => {
      getProviderByIdMock.mockReturnValue({ models: ['gpt-4o'], fields: [] });

      expect(getProviderModels(makeProviderConfig())).toEqual(['gpt-4o']);
    });

    it('falls back when model metadata arrays are empty', () => {
      getProviderByIdMock.mockReturnValue({
        models: [],
        fields: [{ name: 'model', options: [] }],
      });

      expect(getProviderModels(makeProviderConfig({}, { model: undefined }))).toEqual(['default']);
    });
  });

  describe('getProviderModelsForChat', () => {
    it('returns only the pinned model when another config enables showOnlyThisModel', () => {
      getProviderByIdMock.mockReturnValue({
        models: ['gpt-4o', 'gpt-4.1'],
        fields: [],
      });

      const providerConfig = makeProviderConfig({}, { model: 'gpt-4o' });
      const allConfigs = [
        providerConfig,
        makeProviderConfig(
          { displayName: 'Restricted OpenAI' },
          { model: 'gpt-4.1', showOnlyThisModel: true }
        ),
      ];

      expect(getProviderModelsForChat(providerConfig, allConfigs)).toEqual(['gpt-4.1']);
    });

    it('returns all available models when no config restricts chat selection', () => {
      getProviderByIdMock.mockReturnValue({
        models: ['gpt-4o', 'gpt-4.1'],
        fields: [],
      });

      const providerConfig = makeProviderConfig();

      expect(getProviderModelsForChat(providerConfig, [providerConfig])).toEqual([
        'gpt-4o',
        'gpt-4.1',
      ]);
    });

    it('uses the default model when a restricting config has no model', () => {
      const providerConfig = makeProviderConfig({}, { model: undefined });
      const restrictedConfig = makeProviderConfig(
        { displayName: 'Restricted OpenAI' },
        { model: undefined, showOnlyThisModel: true }
      );

      expect(getProviderModelsForChat(providerConfig, [providerConfig, restrictedConfig])).toEqual([
        'default',
      ]);
    });
  });
});
