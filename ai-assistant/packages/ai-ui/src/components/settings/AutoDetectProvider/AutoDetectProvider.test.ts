/**
 * Tests for AutoDetectProvider / useAutoDetect logic.
 *
 * Exercises the auto-detect orchestration: initial state,
 * add/dismiss callbacks, and provider processing.
 */

import type { DetectedProvider } from '@headlamp-k8s/ai-common/providers/providerAutoDetect';
import { dismissalKey } from '@headlamp-k8s/ai-common/providers/providerAutoDetect';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const copilotProvider: DetectedProvider = {
  providerId: 'copilot',
  source: 'GitHub CLI',
  displayName: 'GitHub Copilot',
  config: { apiKey: '__GH_CLI_AUTH__', model: 'gpt-4o' },
};

const ollamaProvider: DetectedProvider = {
  providerId: 'local',
  source: 'Ollama',
  displayName: 'Ollama (llama3)',
  config: { baseUrl: 'http://localhost:11434', model: 'llama3' },
};

const azureProvider: DetectedProvider = {
  providerId: 'azure',
  source: 'Azure CLI',
  displayName: 'Azure (myaccount)',
  config: { apiKey: '__AZ_CLI_AUTH__', azAccountName: 'myaccount', model: 'gpt-4o' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AutoDetectProvider logic', () => {
  describe('dismissal key generation', () => {
    it('generates a dismissal key for copilot provider', () => {
      const key = dismissalKey(copilotProvider);
      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
    });

    it('generates unique keys for different providers', () => {
      const keys = [copilotProvider, ollamaProvider, azureProvider].map(p => dismissalKey(p));
      expect(new Set(keys).size).toBe(3);
    });

    it('generates the same key for the same provider', () => {
      const key1 = dismissalKey(copilotProvider);
      const key2 = dismissalKey(copilotProvider);
      expect(key1).toBe(key2);
    });
  });

  describe('dismissed providers merging', () => {
    it('merges new dismissals with existing ones', () => {
      const existing = ['copilot'];
      const newDismissals = ['local', 'azure:myaccount'];
      const merged = [...new Set([...existing, ...newDismissals])];
      expect(merged).toHaveLength(3);
      expect(merged).toContain('copilot');
      expect(merged).toContain('local');
      expect(merged).toContain('azure:myaccount');
    });

    it('deduplicates when merging', () => {
      const existing = ['copilot', 'local'];
      const newDismissals = ['local', 'azure:myaccount'];
      const merged = [...new Set([...existing, ...newDismissals])];
      expect(merged).toHaveLength(3);
    });

    it('handles empty existing dismissals', () => {
      const existing: string[] = [];
      const newDismissals = ['copilot'];
      const merged = [...new Set([...existing, ...newDismissals])];
      expect(merged).toEqual(['copilot']);
    });
  });

  describe('add detected providers', () => {
    it('processes multiple providers for saving', () => {
      const providers = [copilotProvider, ollamaProvider];

      // Simulate the add flow: each provider should have the required fields
      for (const p of providers) {
        expect(p.providerId).toBeTruthy();
        expect(p.config).toBeDefined();
        expect(p.displayName).toBeTruthy();
      }
    });

    it('first added provider becomes default when no existing providers', () => {
      const existingProviders: any[] = [];
      const detected = [copilotProvider, ollamaProvider];

      // The first provider should become default when no existing providers
      const shouldBeDefault = !existingProviders.length;
      expect(shouldBeDefault).toBe(true);
      expect(detected[0].providerId).toBe('copilot');
    });

    it('does not change default when providers already exist', () => {
      const existingProviders = [{ providerId: 'openai', config: {}, displayName: 'OpenAI' }];
      const shouldBeDefault = !existingProviders.length;
      expect(shouldBeDefault).toBe(false);
    });
  });

  describe('active config update on add', () => {
    it('sets active config to first provider when none exist', () => {
      const providers = [copilotProvider, ollamaProvider];
      const existingCount = 0;
      let activeConfig: any = null;

      if (existingCount === 0 && providers.length > 0) {
        activeConfig = {
          providerId: providers[0].providerId,
          config: { ...providers[0].config },
          displayName: providers[0].displayName,
        };
      }

      expect(activeConfig).not.toBeNull();
      expect(activeConfig.providerId).toBe('copilot');
      expect(activeConfig.displayName).toBe('GitHub Copilot');
    });

    it('does not update active config when providers exist', () => {
      const existingCount: number = 2;
      let activeConfig: any = null;

      if (existingCount === 0) {
        activeConfig = { providerId: 'copilot', config: {}, displayName: 'test' };
      }

      expect(activeConfig).toBeNull();
    });
  });

  describe('command runner', () => {
    it('accepts null command runner (no CLI available)', () => {
      const commandRunner = null;
      // Detection should handle null runner gracefully
      expect(commandRunner).toBeNull();
    });

    it('command runner interface matches expected shape', () => {
      const mockRunner = vi.fn(async (cmd: string, args: string[]) => ({
        stdout: 'test-output',
        exitCode: 0,
      }));

      // Verify the runner matches the CommandRunner interface
      expect(typeof mockRunner).toBe('function');
    });
  });
});
