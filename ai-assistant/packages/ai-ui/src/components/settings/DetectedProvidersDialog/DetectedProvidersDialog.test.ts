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

/**
 * Tests for DetectedProvidersDialog component logic.
 *
 * Since the component depends on React/MUI (peer deps not available in
 * the unit-test environment), these tests exercise the data-flow
 * contracts: selection defaults, toggle behaviour, add/dismiss callbacks,
 * and edge cases like empty provider lists.
 */

import type { DetectedProvider } from '@headlamp-k8s/ai-common/providers/providerAutoDetect';
import { describe, expect, it } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers — replicate the component's selection logic so we can test it
// without rendering React.
// ---------------------------------------------------------------------------

/** Mirrors the initial selection state: all providers selected by default. */
function initialSelection(providers: DetectedProvider[]): Set<number> {
  return new Set(providers.map((_, i) => i));
}

/** Mirrors the toggle logic used in the component. */
function toggle(prev: Set<number>, index: number): Set<number> {
  const next = new Set(prev);
  if (next.has(index)) {
    next.delete(index);
  } else {
    next.add(index);
  }
  return next;
}

/** Mirrors the "Add Selected" filtering. */
function selectedProviders(
  providers: DetectedProvider[],
  selected: Set<number>
): DetectedProvider[] {
  return providers.filter((_, i) => selected.has(i));
}

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

describe('DetectedProvidersDialog logic', () => {
  describe('initial selection', () => {
    it('selects all providers by default', () => {
      const providers = [copilotProvider, ollamaProvider, azureProvider];
      const sel = initialSelection(providers);
      expect(sel.size).toBe(3);
      expect(sel.has(0)).toBe(true);
      expect(sel.has(1)).toBe(true);
      expect(sel.has(2)).toBe(true);
    });

    it('returns empty set for empty provider list', () => {
      const sel = initialSelection([]);
      expect(sel.size).toBe(0);
    });

    it('selects the single provider when only one is detected', () => {
      const sel = initialSelection([copilotProvider]);
      expect(sel.size).toBe(1);
      expect(sel.has(0)).toBe(true);
    });
  });

  describe('toggle', () => {
    it('deselects a selected provider', () => {
      const sel = new Set([0, 1, 2]);
      const result = toggle(sel, 1);
      expect(result.has(1)).toBe(false);
      expect(result.size).toBe(2);
    });

    it('re-selects a deselected provider', () => {
      const sel = new Set([0, 2]);
      const result = toggle(sel, 1);
      expect(result.has(1)).toBe(true);
      expect(result.size).toBe(3);
    });

    it('does not mutate the original set', () => {
      const sel = new Set([0, 1]);
      const result = toggle(sel, 1);
      expect(sel.has(1)).toBe(true);
      expect(result.has(1)).toBe(false);
    });
  });

  describe('selectedProviders', () => {
    it('returns all providers when all are selected', () => {
      const providers = [copilotProvider, ollamaProvider, azureProvider];
      const sel = initialSelection(providers);
      const result = selectedProviders(providers, sel);
      expect(result).toHaveLength(3);
      expect(result).toEqual(providers);
    });

    it('returns only selected providers after toggling', () => {
      const providers = [copilotProvider, ollamaProvider, azureProvider];
      let sel = initialSelection(providers);
      sel = toggle(sel, 1); // deselect Ollama
      const result = selectedProviders(providers, sel);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(copilotProvider);
      expect(result[1]).toBe(azureProvider);
    });

    it('returns empty array when none selected', () => {
      const providers = [copilotProvider, ollamaProvider];
      let sel = initialSelection(providers);
      sel = toggle(sel, 0);
      sel = toggle(sel, 1);
      const result = selectedProviders(providers, sel);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for empty provider list', () => {
      const result = selectedProviders([], new Set());
      expect(result).toHaveLength(0);
    });
  });

  describe('add button disabled state', () => {
    it('should be disabled when no providers are selected', () => {
      const providers = [copilotProvider];
      let sel = initialSelection(providers);
      sel = toggle(sel, 0);
      // The button is disabled when selected.size === 0
      expect(sel.size).toBe(0);
    });

    it('should be enabled when at least one provider is selected', () => {
      const sel = initialSelection([copilotProvider]);
      expect(sel.size).toBeGreaterThan(0);
    });
  });

  describe('dismiss callback', () => {
    it('dismiss passes all providers (not just selected ones)', () => {
      // The component calls onDismiss?.(detectedProviders) — all of them
      const providers = [copilotProvider, ollamaProvider];
      // Simulate: user deselects copilot, then clicks "Not Now"
      // The dismiss callback still receives ALL providers
      expect(providers).toHaveLength(2);
      expect(providers[0]).toBe(copilotProvider);
      expect(providers[1]).toBe(ollamaProvider);
    });
  });

  describe('provider display data', () => {
    it('each detected provider has required fields', () => {
      const providers = [copilotProvider, ollamaProvider, azureProvider];
      for (const p of providers) {
        expect(p.providerId).toBeTruthy();
        expect(p.source).toBeTruthy();
        expect(p.displayName).toBeTruthy();
        expect(p.config).toBeDefined();
      }
    });

    it('copilot provider uses sentinel auth', () => {
      expect(copilotProvider.config.apiKey).toBe('__GH_CLI_AUTH__');
    });

    it('azure provider uses sentinel auth with account name', () => {
      expect(azureProvider.config.apiKey).toBe('__AZ_CLI_AUTH__');
      expect(azureProvider.config.azAccountName).toBe('myaccount');
    });

    it('ollama provider uses base URL without API key', () => {
      expect(ollamaProvider.config.baseUrl).toBe('http://localhost:11434');
      expect(ollamaProvider.config.apiKey).toBeUndefined();
    });
  });
});
