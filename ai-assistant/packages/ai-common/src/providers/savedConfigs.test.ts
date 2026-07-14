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
  deleteProviderConfig,
  getActiveConfig,
  getSavedConfigurations,
  isSameStoredConfig,
  saveProviderConfig,
  saveTermsAcceptance,
} from './savedConfigs';

describe('ProviderConfigManager', () => {
  describe('getSavedConfigurations', () => {
    it('returns empty providers for null or undefined data', () => {
      expect(getSavedConfigurations(null)).toEqual({ providers: [] });
      expect(getSavedConfigurations(undefined)).toEqual({ providers: [] });
    });

    it('returns providers and metadata when providers array exists', () => {
      const data = {
        providers: [
          {
            providerId: 'openai',
            displayName: 'Primary',
            config: { apiKey: 'key-1', model: 'gpt-4.1' },
          },
        ],
        defaultProviderIndex: 0,
        termsAccepted: true,
      };

      expect(getSavedConfigurations(data)).toEqual(data);
    });

    it('returns empty providers when providers array is missing', () => {
      expect(getSavedConfigurations({ defaultProviderIndex: 1 })).toEqual({
        providers: [],
        termsAccepted: false,
      });
    });
  });

  describe('getActiveConfig', () => {
    it('returns null for null or empty configurations', () => {
      expect(getActiveConfig(null)).toBeNull();
      expect(getActiveConfig({ providers: [] })).toBeNull();
    });

    it('returns the provider at the default index', () => {
      const savedConfigs = {
        providers: [
          { providerId: 'openai', config: { apiKey: 'key-1' } },
          { providerId: 'azure', config: { apiKey: 'key-2' } },
        ],
        defaultProviderIndex: 1,
      };

      expect(getActiveConfig(savedConfigs)).toEqual(savedConfigs.providers[1]);
    });

    it('returns the first provider when no default index exists', () => {
      const savedConfigs = {
        providers: [
          { providerId: 'openai', config: { apiKey: 'key-1' } },
          { providerId: 'azure', config: { apiKey: 'key-2' } },
        ],
      };

      expect(getActiveConfig(savedConfigs)).toEqual(savedConfigs.providers[0]);
    });
  });

  describe('saveProviderConfig', () => {
    it('adds a new provider configuration', () => {
      expect(saveProviderConfig(null, 'openai', { apiKey: 'key-1' })).toEqual({
        providers: [{ providerId: 'openai', displayName: undefined, config: { apiKey: 'key-1' } }],
        defaultProviderIndex: undefined,
        termsAccepted: false,
      });
    });

    it('updates an existing provider configuration when apiKey matches', () => {
      const savedConfigs = {
        providers: [
          {
            providerId: 'openai',
            displayName: 'Original',
            config: { apiKey: 'key-1', model: 'gpt-4.1', temperature: 0.2 },
          },
        ],
        defaultProviderIndex: 0,
        termsAccepted: true,
      };

      expect(
        saveProviderConfig(savedConfigs, 'openai', {
          apiKey: 'key-1',
          model: 'gpt-4.1',
          temperature: 0.7,
        })
      ).toEqual({
        providers: [
          {
            providerId: 'openai',
            displayName: 'Original',
            config: { apiKey: 'key-1', model: 'gpt-4.1', temperature: 0.7 },
          },
        ],
        defaultProviderIndex: 0,
        termsAccepted: true,
      });
    });

    it('sets the saved provider as default when makeDefault is true', () => {
      const savedConfigs = {
        providers: [{ providerId: 'openai', config: { apiKey: 'key-1' } }],
      };

      expect(saveProviderConfig(savedConfigs, 'azure', { apiKey: 'key-2' }, true)).toMatchObject({
        defaultProviderIndex: 1,
      });
    });

    it('stores the provided display name', () => {
      const result = saveProviderConfig(null, 'openai', { apiKey: 'key-1' }, false, 'Work Account');

      expect(result.providers?.[0]).toEqual({
        providerId: 'openai',
        displayName: 'Work Account',
        config: { apiKey: 'key-1' },
      });
    });
  });

  describe('deleteProviderConfig', () => {
    it('removes an existing provider configuration', () => {
      const savedConfigs = {
        providers: [
          { providerId: 'openai', config: { apiKey: 'key-1' } },
          { providerId: 'azure', config: { apiKey: 'key-2' } },
        ],
        defaultProviderIndex: 0,
      };

      expect(deleteProviderConfig(savedConfigs, 'openai', { apiKey: 'key-1' })).toEqual({
        providers: [{ providerId: 'azure', config: { apiKey: 'key-2' } }],
        defaultProviderIndex: 0,
        termsAccepted: false,
      });
    });

    it('adjusts the default provider index after deletion', () => {
      const savedConfigs = {
        providers: [
          { providerId: 'openai', config: { apiKey: 'key-1' } },
          { providerId: 'azure', config: { apiKey: 'key-2' } },
        ],
        defaultProviderIndex: 1,
        termsAccepted: true,
      };

      expect(deleteProviderConfig(savedConfigs, 'azure', { apiKey: 'key-2' })).toEqual({
        providers: [{ providerId: 'openai', config: { apiKey: 'key-1' } }],
        defaultProviderIndex: 0,
        termsAccepted: true,
      });
    });

    it('shifts default index left when a provider earlier than the default is deleted', () => {
      // Three providers; default is the last one (index 2).
      // Deleting the first provider (index 0) should shift the default to index 1,
      // not leave it at index 2 (which would now point at the wrong provider).
      const savedConfigs = {
        providers: [
          { providerId: 'openai', config: { apiKey: 'key-1' } },
          { providerId: 'anthropic', config: { apiKey: 'key-2' } },
          { providerId: 'azure', config: { apiKey: 'key-3' } },
        ],
        defaultProviderIndex: 2, // azure is default
      };

      const result = deleteProviderConfig(savedConfigs, 'openai', { apiKey: 'key-1' });

      expect(result.providers).toHaveLength(2);
      expect(result.providers![0].providerId).toBe('anthropic');
      expect(result.providers![1].providerId).toBe('azure');
      // azure was at index 2 before; after removing index 0 it is at index 1
      expect(result.defaultProviderIndex).toBe(1);
    });

    it('keeps default index unchanged when a provider after the default is deleted', () => {
      const savedConfigs = {
        providers: [
          { providerId: 'openai', config: { apiKey: 'key-1' } },
          { providerId: 'anthropic', config: { apiKey: 'key-2' } },
          { providerId: 'azure', config: { apiKey: 'key-3' } },
        ],
        defaultProviderIndex: 0, // openai is default
      };

      const result = deleteProviderConfig(savedConfigs, 'azure', { apiKey: 'key-3' });

      expect(result.providers).toHaveLength(2);
      expect(result.defaultProviderIndex).toBe(0); // openai is still default
    });
  });

  describe('saveTermsAcceptance', () => {
    it('sets termsAccepted to true', () => {
      expect(saveTermsAcceptance({ providers: [] })).toEqual({
        providers: [],
        termsAccepted: true,
      });
    });
  });

  describe('isSameStoredConfig', () => {
    it('matches configs with same provider and API key', () => {
      const a = { providerId: 'openai', config: { apiKey: 'sk-123', model: 'gpt-4o' } };
      const b = { providerId: 'openai', config: { apiKey: 'sk-123', model: 'gpt-4o' } };
      expect(isSameStoredConfig(a, b)).toBe(true);
    });

    it('does not match configs with different provider IDs', () => {
      const a = { providerId: 'openai', config: { apiKey: 'sk-123' } };
      const b = { providerId: 'anthropic', config: { apiKey: 'sk-123' } };
      expect(isSameStoredConfig(a, b)).toBe(false);
    });

    it('matches Azure configs by azAccountName', () => {
      const a = {
        providerId: 'azure',
        config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'myaccount' },
      };
      const b = {
        providerId: 'azure',
        config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'myaccount' },
      };
      expect(isSameStoredConfig(a, b)).toBe(true);
    });

    it('does not match Azure configs with different azAccountName', () => {
      const a = {
        providerId: 'azure',
        config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'account1' },
      };
      const b = {
        providerId: 'azure',
        config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'account2' },
      };
      expect(isSameStoredConfig(a, b)).toBe(false);
    });

    it('matches configs with same base URL and model', () => {
      const a = {
        providerId: 'local',
        config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
      };
      const b = {
        providerId: 'local',
        config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
      };
      expect(isSameStoredConfig(a, b)).toBe(true);
    });

    it('does not match when no shared identifiers', () => {
      const a = { providerId: 'openai', config: { model: 'gpt-4o' } };
      const b = { providerId: 'openai', config: { model: 'gpt-4o-mini' } };
      expect(isSameStoredConfig(a, b)).toBe(false);
    });

    it('matches Copilot configs with same sentinel API key', () => {
      const a = { providerId: 'copilot', config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' } };
      const b = { providerId: 'copilot', config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' } };
      expect(isSameStoredConfig(a, b)).toBe(true);
    });

    it('does not match Copilot and OpenAI with same sentinel key', () => {
      const a = { providerId: 'copilot', config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' } };
      const b = { providerId: 'openai', config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' } };
      expect(isSameStoredConfig(a, b)).toBe(false);
    });
  });

  describe('saveProviderConfig — Azure sentinel support', () => {
    it('updates existing Azure config matched by azAccountName', () => {
      const existing = {
        providers: [
          {
            providerId: 'azure',
            displayName: 'Azure (myaccount)',
            config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'myaccount', model: 'gpt-4' },
          },
        ],
      };
      const result = saveProviderConfig(existing, 'azure', {
        apiKey: '__AZ_CLI_AUTH__',
        azAccountName: 'myaccount',
        model: 'gpt-4o',
      });
      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].config.model).toBe('gpt-4o');
    });

    it('adds new Azure config when azAccountName differs', () => {
      const existing = {
        providers: [
          {
            providerId: 'azure',
            displayName: 'Azure (account1)',
            config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'account1', model: 'gpt-4' },
          },
        ],
      };
      const result = saveProviderConfig(existing, 'azure', {
        apiKey: '__AZ_CLI_AUTH__',
        azAccountName: 'account2',
        model: 'gpt-4o',
      });
      expect(result.providers).toHaveLength(2);
    });
  });

  describe('deleteProviderConfig — Azure sentinel support', () => {
    it('deletes Azure config matched by azAccountName', () => {
      const existing = {
        providers: [
          {
            providerId: 'azure',
            displayName: 'Azure (myaccount)',
            config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'myaccount', model: 'gpt-4' },
          },
          {
            providerId: 'openai',
            config: { apiKey: 'sk-123', model: 'gpt-4o' },
          },
        ],
      };
      const result = deleteProviderConfig(existing, 'azure', {
        apiKey: '__AZ_CLI_AUTH__',
        azAccountName: 'myaccount',
        model: 'gpt-4',
      });
      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].providerId).toBe('openai');
    });
  });

  describe('deleteProviderConfig — baseUrl+model identity', () => {
    it('deletes only the config whose baseUrl+model matches, leaving the other intact', () => {
      // Two ollama configs sharing the same baseUrl but different models.
      // saveProviderConfig treats them as distinct; deleteProviderConfig must too.
      const savedConfigs = {
        providers: [
          { providerId: 'ollama', config: { baseUrl: 'http://localhost:11434', model: 'llama3' } },
          {
            providerId: 'ollama',
            config: { baseUrl: 'http://localhost:11434', model: 'mistral' },
          },
        ],
        defaultProviderIndex: 0,
      };

      const result = deleteProviderConfig(savedConfigs, 'ollama', {
        baseUrl: 'http://localhost:11434',
        model: 'mistral',
      });

      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].config.model).toBe('llama3');
    });

    it('keeps defaultProviderIndex correct when the deleted baseUrl+model entry precedes the default', () => {
      const savedConfigs = {
        providers: [
          { providerId: 'ollama', config: { baseUrl: 'http://localhost:11434', model: 'llama3' } },
          {
            providerId: 'ollama',
            config: { baseUrl: 'http://localhost:11434', model: 'mistral' },
          },
          { providerId: 'openai', config: { apiKey: 'sk-test' } },
        ],
        defaultProviderIndex: 2, // openai is default
      };

      // Delete llama3 (index 0) — default should shift from 2 → 1
      const result = deleteProviderConfig(savedConfigs, 'ollama', {
        baseUrl: 'http://localhost:11434',
        model: 'llama3',
      });

      expect(result.providers).toHaveLength(2);
      expect(result.providers![0].config.model).toBe('mistral');
      expect(result.defaultProviderIndex).toBe(1);
    });
  });
});
