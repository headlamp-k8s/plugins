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
  setDefaultProviderConfig,
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

      expect(getSavedConfigurations(data)).toEqual({
        ...data,
        providers: [{ ...data.providers[0], id: 'legacy-openai-0' }],
      });
    });

    it('omits malformed known setting values while preserving provider-specific fields', () => {
      const result = getSavedConfigurations({
        providers: [
          {
            providerId: 'custom',
            config: { apiKey: 42, model: false, customFlag: true },
          },
        ],
      });
      expect(result.providers?.[0].config).toEqual({ customFlag: true });
    });

    it('filters providers with blank identifiers', () => {
      const result = getSavedConfigurations({
        providers: [
          { providerId: '', config: {} },
          { providerId: '   ', config: {} },
          { providerId: 'openai', config: {} },
        ],
        defaultProviderIndex: 2,
      });
      expect(result.providers).toEqual([
        { id: 'legacy-openai-2', providerId: 'openai', config: {} },
      ]);
      expect(result.defaultProviderIndex).toBe(0);
    });

    it('backfills stable IDs so legacy records can be edited and deleted without duplication', () => {
      const legacy = {
        providers: [
          {
            providerId: 'openai',
            displayName: 'Old Name',
            config: { apiKey: 'old-key', model: 'gpt-4o' },
          },
        ],
        defaultProviderIndex: 0,
      };
      const normalized = getSavedConfigurations(legacy);
      expect(normalized.providers?.[0].id).toBe('legacy-openai-0');

      const edited = saveProviderConfig(
        normalized,
        'openai',
        { apiKey: 'new-key', model: 'gpt-4.1' },
        false,
        'New Name',
        'legacy-openai-0'
      );
      expect(edited.providers).toEqual([
        {
          id: 'legacy-openai-0',
          providerId: 'openai',
          displayName: 'New Name',
          config: { apiKey: 'new-key', model: 'gpt-4.1' },
        },
      ]);
      expect(deleteProviderConfig(edited, 'legacy-openai-0').providers).toEqual([]);
    });

    it('remaps defaults after filtering malformed rows and repairs duplicate IDs', () => {
      const result = getSavedConfigurations({
        providers: [
          null,
          { id: 'duplicate', providerId: 'openai', config: { model: 'first' } },
          { id: 'duplicate', providerId: 'openai', config: { model: 'second' } },
        ],
        defaultProviderIndex: 2,
      });
      expect(result.providers).toEqual([
        { id: 'duplicate', providerId: 'openai', config: { model: 'first' } },
        { id: 'legacy-openai-2', providerId: 'openai', config: { model: 'second' } },
      ]);
      expect(result.defaultProviderIndex).toBe(1);
    });

    it('does not assign a repaired duplicate an ID reserved by a later record', () => {
      const result = getSavedConfigurations({
        providers: [
          { id: 'duplicate', providerId: 'openai', config: { model: 'first' } },
          { id: 'duplicate', providerId: 'openai', config: { model: 'second' } },
          { id: 'legacy-openai-1', providerId: 'openai', config: { model: 'third' } },
        ],
      });
      expect(result.providers?.map(provider => provider.id)).toEqual([
        'duplicate',
        'legacy-openai-1-1',
        'legacy-openai-1',
      ]);
    });

    it('does not let an ID-less row claim a later explicit legacy-shaped ID', () => {
      const result = getSavedConfigurations({
        providers: [
          { providerId: 'openai', config: {} },
          { id: 'legacy-openai-0', providerId: 'anthropic', config: {} },
        ],
      });
      expect(result.providers?.map(provider => provider.id)).toEqual([
        'legacy-openai-0-0',
        'legacy-openai-0',
      ]);
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
      expect(
        saveProviderConfig(null, 'openai', { apiKey: 'key-1' }, false, undefined, 'openai-1')
      ).toEqual({
        providers: [
          {
            id: 'openai-1',
            providerId: 'openai',
            displayName: undefined,
            config: { apiKey: 'key-1' },
          },
        ],
        defaultProviderIndex: undefined,
        termsAccepted: false,
      });
    });

    it('updates an existing provider configuration when apiKey matches', () => {
      const savedConfigs = {
        providers: [
          {
            id: 'openai-1',
            providerId: 'openai',
            displayName: 'Original',
            config: { apiKey: 'key-1', model: 'gpt-4.1', temperature: 0.2 },
          },
        ],
        defaultProviderIndex: 0,
        termsAccepted: true,
      };

      expect(
        saveProviderConfig(
          savedConfigs,
          'openai',
          { apiKey: 'changed-key', model: 'gpt-4.2', temperature: 0.7 },
          false,
          'Renamed',
          'openai-1'
        )
      ).toEqual({
        providers: [
          {
            id: 'openai-1',
            providerId: 'openai',
            displayName: 'Renamed',
            config: { apiKey: 'changed-key', model: 'gpt-4.2', temperature: 0.7 },
          },
        ],
        defaultProviderIndex: 0,
        termsAccepted: true,
      });
    });

    it('sets the saved provider as default when makeDefault is true', () => {
      const savedConfigs = {
        providers: [{ id: 'openai-1', providerId: 'openai', config: { apiKey: 'key-1' } }],
      };

      expect(
        saveProviderConfig(savedConfigs, 'azure', { apiKey: 'key-2' }, true, undefined, 'azure-1')
      ).toMatchObject({
        defaultProviderIndex: 1,
      });
    });

    it('stores the provided display name', () => {
      const result = saveProviderConfig(
        null,
        'openai',
        { apiKey: 'key-1' },
        false,
        'Work Account',
        'openai-1'
      );

      expect(result.providers?.[0]).toEqual({
        id: 'openai-1',
        providerId: 'openai',
        displayName: 'Work Account',
        config: { apiKey: 'key-1' },
      });
    });

    it('clears an existing display name when an empty name is provided', () => {
      const result = saveProviderConfig(
        {
          providers: [
            {
              id: 'openai-1',
              providerId: 'openai',
              displayName: 'Old name',
              config: { apiKey: 'key-1' },
            },
          ],
        },
        'openai',
        { apiKey: 'key-1' },
        false,
        '',
        'openai-1'
      );
      expect(result.providers?.[0].displayName).toBe('');
    });

    it('updates by display name without an explicit ID and preserves the existing ID', () => {
      const result = saveProviderConfig(
        {
          providers: [
            {
              id: 'work-openai',
              providerId: 'openai',
              displayName: 'Work',
              config: { apiKey: 'old-key' },
            },
          ],
        },
        'openai',
        { apiKey: 'new-key' },
        true,
        'Work'
      );
      expect(result.providers).toEqual([
        {
          id: 'work-openai',
          providerId: 'openai',
          displayName: 'Work',
          config: { apiKey: 'new-key' },
        },
      ]);
      expect(result.defaultProviderIndex).toBe(0);
    });

    it('distinguishes API key model variants and matches base URL plus model', () => {
      const variants = saveProviderConfig(
        {
          providers: [
            { id: 'first', providerId: 'openai', config: { apiKey: 'key', model: 'first' } },
          ],
        },
        'openai',
        { apiKey: 'key', model: 'second' },
        false,
        undefined,
        'second'
      );
      expect(variants.providers).toHaveLength(2);

      const baseUrlMatch = saveProviderConfig(
        {
          providers: [
            {
              id: 'local',
              providerId: 'local',
              config: { baseUrl: 'http://localhost', model: 'llama3' },
            },
          ],
        },
        'local',
        { baseUrl: 'http://localhost', model: 'llama3', temperature: 0.5 }
      );
      expect(baseUrlMatch.providers).toHaveLength(1);
      expect(baseUrlMatch.providers?.[0].id).toBe('local');
    });
  });

  describe('deleteProviderConfig', () => {
    it('removes an existing provider configuration', () => {
      const savedConfigs = {
        providers: [
          { id: 'openai-1', providerId: 'openai', config: { apiKey: 'key-1' } },
          { id: 'azure-1', providerId: 'azure', config: { apiKey: 'key-2' } },
        ],
        defaultProviderIndex: 0,
      };

      expect(deleteProviderConfig(savedConfigs, 'openai-1')).toEqual({
        providers: [{ id: 'azure-1', providerId: 'azure', config: { apiKey: 'key-2' } }],
        defaultProviderIndex: 0,
        termsAccepted: false,
      });
    });

    it('adjusts the default provider index after deletion', () => {
      const savedConfigs = {
        providers: [
          { id: 'openai-1', providerId: 'openai', config: { apiKey: 'key-1' } },
          { id: 'azure-1', providerId: 'azure', config: { apiKey: 'key-2' } },
        ],
        defaultProviderIndex: 1,
        termsAccepted: true,
      };

      expect(deleteProviderConfig(savedConfigs, 'azure-1')).toEqual({
        providers: [{ id: 'openai-1', providerId: 'openai', config: { apiKey: 'key-1' } }],
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
          { id: 'openai-1', providerId: 'openai', config: { apiKey: 'key-1' } },
          { id: 'anthropic-1', providerId: 'anthropic', config: { apiKey: 'key-2' } },
          { id: 'azure-1', providerId: 'azure', config: { apiKey: 'key-3' } },
        ],
        defaultProviderIndex: 2, // azure is default
      };

      const result = deleteProviderConfig(savedConfigs, 'openai-1');

      expect(result.providers).toHaveLength(2);
      expect(result.providers![0].providerId).toBe('anthropic');
      expect(result.providers![1].providerId).toBe('azure');
      // azure was at index 2 before; after removing index 0 it is at index 1
      expect(result.defaultProviderIndex).toBe(1);
    });

    it('keeps default index unchanged when a provider after the default is deleted', () => {
      const savedConfigs = {
        providers: [
          { id: 'openai-1', providerId: 'openai', config: { apiKey: 'key-1' } },
          { id: 'anthropic-1', providerId: 'anthropic', config: { apiKey: 'key-2' } },
          { id: 'azure-1', providerId: 'azure', config: { apiKey: 'key-3' } },
        ],
        defaultProviderIndex: 0, // openai is default
      };

      const result = deleteProviderConfig(savedConfigs, 'azure-1');

      expect(result.providers).toHaveLength(2);
      expect(result.defaultProviderIndex).toBe(0); // openai is still default
    });
  });

  describe('setDefaultProviderConfig', () => {
    it('sets the default by stable ID', () => {
      const configs = {
        providers: [
          { id: 'one', providerId: 'openai', config: {} },
          { id: 'two', providerId: 'openai', config: {} },
        ],
        defaultProviderIndex: 0,
      };
      expect(setDefaultProviderConfig(configs, 'two').defaultProviderIndex).toBe(1);
    });

    it('preserves the default when the requested ID is unknown', () => {
      const configs = {
        providers: [{ id: 'one', providerId: 'openai', config: {} }],
        defaultProviderIndex: 0,
      };
      expect(setDefaultProviderConfig(configs, 'missing').defaultProviderIndex).toBe(0);
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
    it('matches the same credential-free config object', () => {
      const config = { providerId: 'mock-testing-model', config: {} };
      expect(isSameStoredConfig(config, config)).toBe(true);
    });

    it('does not match distinct credential-free config objects', () => {
      const first = { providerId: 'mock-testing-model', config: {} };
      const second = { providerId: 'mock-testing-model', config: {} };
      expect(isSameStoredConfig(first, second)).toBe(false);
    });

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

    it('does not match an Azure account to a legacy config missing account metadata', () => {
      const account = {
        providerId: 'azure',
        config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'account1' },
      };
      const legacy = { providerId: 'azure', config: { apiKey: '__AZ_CLI_AUTH__' } };
      expect(isSameStoredConfig(account, legacy)).toBe(false);
      expect(isSameStoredConfig(legacy, account)).toBe(false);
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
            id: 'azure-1',
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
            id: 'azure-1',
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

    it('keeps Azure CLI accounts distinct when model and deployment match', () => {
      const existing = {
        providers: [
          {
            id: 'azure-1',
            providerId: 'azure',
            config: {
              apiKey: '__AZ_CLI_AUTH__',
              azAccountName: 'account1',
              model: 'gpt-4o',
              deploymentName: 'shared',
            },
          },
        ],
      };
      const result = saveProviderConfig(existing, 'azure', {
        apiKey: '__AZ_CLI_AUTH__',
        azAccountName: 'account2',
        model: 'gpt-4o',
        deploymentName: 'shared',
      });
      expect(result.providers).toHaveLength(2);
      expect(result.providers?.map(provider => provider.config.azAccountName)).toEqual([
        'account1',
        'account2',
      ]);
    });

    it('keeps differently named Azure accounts distinct even when display names match', () => {
      const result = saveProviderConfig(
        {
          providers: [
            {
              id: 'azure-1',
              providerId: 'azure',
              displayName: 'Azure',
              config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'account1' },
            },
          ],
        },
        'azure',
        { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'account2' },
        false,
        'Azure'
      );
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
            id: 'openai-1',
            providerId: 'openai',
            config: { apiKey: 'sk-123', model: 'gpt-4o' },
          },
        ],
      };
      const result = deleteProviderConfig(existing, 'legacy-azure-0');
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
          {
            id: 'ollama-1',
            providerId: 'ollama',
            config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
          },
          {
            id: 'ollama-2',
            providerId: 'ollama',
            config: { baseUrl: 'http://localhost:11434', model: 'mistral' },
          },
        ],
        defaultProviderIndex: 0,
      };

      const result = deleteProviderConfig(savedConfigs, 'ollama-2');

      expect(result.providers).toHaveLength(1);
      expect(result.providers![0].config.model).toBe('llama3');
    });

    it('keeps defaultProviderIndex correct when the deleted baseUrl+model entry precedes the default', () => {
      const savedConfigs = {
        providers: [
          {
            id: 'ollama-1',
            providerId: 'ollama',
            config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
          },
          {
            id: 'ollama-2',
            providerId: 'ollama',
            config: { baseUrl: 'http://localhost:11434', model: 'mistral' },
          },
          { id: 'openai-1', providerId: 'openai', config: { apiKey: 'sk-test' } },
        ],
        defaultProviderIndex: 2, // openai is default
      };

      // Delete llama3 (index 0) — default should shift from 2 → 1
      const result = deleteProviderConfig(savedConfigs, 'ollama-1');

      expect(result.providers).toHaveLength(2);
      expect(result.providers![0].config.model).toBe('mistral');
      expect(result.defaultProviderIndex).toBe(1);
    });
  });
});
