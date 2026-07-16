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
 * Utility functions for managing AI provider configurations.
 */

/**
 * Provider-specific settings persisted by the assistant.
 *
 * Known cross-provider fields are documented explicitly; providers may store
 * additional values through the index signature.
 */
export interface ProviderSettings {
  /** API credential or authentication sentinel. */
  apiKey?: string;
  /** Base URL for OpenAI-compatible or local providers. */
  baseUrl?: string;
  /** Model identifier selected for requests. */
  model?: string;
  /** Azure OpenAI deployment name. */
  deploymentName?: string;
  /** Azure OpenAI service endpoint. */
  endpoint?: string;
  /** Azure account label used to match CLI-authenticated configs. */
  azAccountName?: string;
  /** Additional provider-specific persisted setting. */
  [key: string]: unknown;
}

/** Represents one saved AI provider configuration. */
export interface StoredProviderConfig {
  /** Stable persisted identity used for editing, selection, and deletion. */
  id?: string;
  /** Provider identifier for this saved configuration. */
  providerId: string;
  /** Optional name shown to users for this configuration. */
  displayName?: string;
  /** Provider-specific settings persisted for reuse. */
  config: ProviderSettings;
}

/** Creates a stable identity for a newly persisted provider configuration. */
export function createProviderConfigId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `provider-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

/** Returns a deterministic ID for a persisted provider that predates stable IDs. */
function createLegacyProviderConfigId(providerId: string, index: number): string {
  const safeProviderId = providerId.replace(/[^a-zA-Z0-9_-]+/g, '-') || 'provider';
  return `legacy-${safeProviderId}-${index}`;
}

/** @returns Whether an untrusted value is a non-null object mapping. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Copies provider settings while omitting malformed values for known string fields. */
function normalizeProviderSettings(value: Record<string, unknown>): ProviderSettings {
  const settings: ProviderSettings = { ...value };
  const stringFields = [
    'apiKey',
    'baseUrl',
    'model',
    'deploymentName',
    'endpoint',
    'azAccountName',
  ] as const;
  stringFields.forEach(fieldName => {
    if (settings[fieldName] !== undefined && typeof settings[fieldName] !== 'string') {
      delete settings[fieldName];
    }
  });
  return settings;
}

/** Normalizes one persisted provider and backfills its stable ID when necessary. */
function normalizeStoredProvider(value: unknown, index: number): StoredProviderConfig | null {
  if (
    !isRecord(value) ||
    typeof value.providerId !== 'string' ||
    !value.providerId.trim() ||
    !isRecord(value.config)
  ) {
    return null;
  }
  return {
    id:
      typeof value.id === 'string' && value.id.trim()
        ? value.id
        : createLegacyProviderConfigId(value.providerId, index),
    providerId: value.providerId,
    ...(typeof value.displayName === 'string' ? { displayName: value.displayName } : {}),
    config: normalizeProviderSettings(value.config),
  };
}

/**
 * Stores all persisted provider configurations and related preferences.
 */
export interface SavedConfigurations {
  /** Saved provider configurations in display order. */
  providers?: StoredProviderConfig[];
  /** Index of the default provider in {@link providers}. */
  defaultProviderIndex?: number;
  /** Whether the user accepted the assistant terms. */
  termsAccepted?: boolean;
}

/**
 * Returns true when two stored provider configs refer to the same
 * logical provider account. Handles Azure CLI sentinel auth where
 * configs use azAccountName instead of matching API keys directly.
 *
 * @param a - First stored provider configuration to compare.
 * @param b - Second stored provider configuration to compare.
 * @returns Whether provider identity and account-defining fields match.
 */
export function isSameStoredConfig(a: StoredProviderConfig, b: StoredProviderConfig): boolean {
  if (a === b) return true;
  if (a.id && b.id) return a.id === b.id;
  if (a.providerId !== b.providerId) return false;
  if (a.providerId === 'azure' && (a.config.azAccountName || b.config.azAccountName)) {
    return Boolean(
      a.config.azAccountName &&
        b.config.azAccountName &&
        a.config.azAccountName === b.config.azAccountName
    );
  }
  if (a.config.apiKey && b.config.apiKey) return a.config.apiKey === b.config.apiKey;
  return Boolean(
    a.config.baseUrl &&
      b.config.baseUrl &&
      a.config.baseUrl === b.config.baseUrl &&
      a.config.model &&
      b.config.model &&
      a.config.model === b.config.model
  );
}

/**
 * Returns saved provider configurations from plugin data.
 *
 * @param data - Persisted plugin data to validate and normalize.
 * @returns Saved providers and metadata, or an empty configuration for invalid data.
 */
export function getSavedConfigurations(data: unknown): SavedConfigurations {
  if (!data || typeof data !== 'object') {
    return { providers: [] };
  }
  const stored = data as Record<string, unknown>;

  // Check for new format storage
  if (Array.isArray(stored.providers)) {
    const reservedIds = new Set(
      stored.providers.flatMap(provider => {
        if (!isRecord(provider) || typeof provider.id !== 'string' || !provider.id.trim()) {
          return [];
        }
        return [provider.id];
      })
    );
    const seenIds = new Set<string>();
    let normalizedDefaultIndex: number | undefined;
    const providers = stored.providers.flatMap((provider, index) => {
      const normalized = normalizeStoredProvider(provider, index);
      if (!normalized) return [];
      const persistedId =
        isRecord(provider) && typeof provider.id === 'string' && provider.id.trim()
          ? provider.id
          : undefined;
      let ownsPersistedId = false;
      let id = createLegacyProviderConfigId(normalized.providerId, index);
      if (persistedId && !seenIds.has(persistedId)) {
        ownsPersistedId = true;
        id = persistedId;
      }
      while (seenIds.has(id) || (!ownsPersistedId && reservedIds.has(id))) {
        id = `${id}-${index}`;
      }
      seenIds.add(id);
      const normalizedIndex = seenIds.size - 1;
      if (stored.defaultProviderIndex === index) normalizedDefaultIndex = normalizedIndex;
      return [{ ...normalized, id }];
    });
    return {
      providers,
      defaultProviderIndex: normalizedDefaultIndex,
      termsAccepted: stored.termsAccepted === true,
    };
  }

  // Create empty configuration if nothing is found
  const providers: StoredProviderConfig[] = [];

  return {
    providers,
    termsAccepted: false,
  };
}

/**
 * Returns the active provider configuration.
 *
 * @param savedConfigs - Saved providers and optional default index.
 * @returns The configured default, the first provider, or `null` when none exist.
 */
export function getActiveConfig(
  savedConfigs: SavedConfigurations | null | undefined
): StoredProviderConfig | null {
  if (!savedConfigs?.providers || savedConfigs.providers.length === 0) {
    return null;
  }
  const defaultConfig = savedConfigs?.providers[savedConfigs.defaultProviderIndex || 0];
  if (defaultConfig) return defaultConfig;

  // Otherwise return the first one
  return savedConfigs?.providers[0];
}

/**
 * Saves or updates a provider configuration.
 *
 * @param savedConfigs - Existing saved configurations to copy and update.
 * @param providerId - Provider identifier for the configuration.
 * @param config - Provider-specific settings to store.
 * @param makeDefault - Whether the saved entry should become the default.
 * @param displayName - Optional user-facing name and primary update key.
 * @param configId - Stable identity of the entry to update, or a new identity to persist.
 * @returns New saved configurations with the provider added or replaced.
 */
export function saveProviderConfig(
  savedConfigs: SavedConfigurations | null | undefined,
  providerId: string,
  config: ProviderSettings,
  makeDefault: boolean = false,
  displayName?: string,
  configId?: string
): SavedConfigurations {
  // Ensure we have a valid savedConfigs object
  const safeConfigs = getSavedConfigurations(savedConfigs);

  // Create new array to avoid modifying the original
  const providers: StoredProviderConfig[] =
    safeConfigs?.providers?.map(p => ({
      ...p,
    })) ?? [];

  // Check if this exact configuration already exists (by comparing display name or key fields)
  const existingIndex = providers.findIndex(p => {
    if (configId) return p.id === configId;
    // Azure account identity is exclusive because CLI-authenticated accounts share a sentinel key.
    if (
      p.providerId === 'azure' &&
      providerId === 'azure' &&
      (p.config.azAccountName || config.azAccountName)
    ) {
      return Boolean(
        p.config.azAccountName &&
          config.azAccountName &&
          p.config.azAccountName === config.azAccountName
      );
    }
    // If displayName is provided, use that as primary matching criteria
    if (displayName && p.displayName === displayName && p.providerId === providerId) {
      return true;
    }

    // Must match provider ID
    if (p.providerId !== providerId) return false;

    // If either config doesn't have API key or other identifying fields, they're not matching
    if ((!p.config.apiKey && config.apiKey) || (p.config.apiKey && !config.apiKey)) {
      return false;
    }

    // If API keys exist and match, consider a match (same account)
    if (p.config.apiKey && config.apiKey && p.config.apiKey === config.apiKey) {
      // But if models or deployment names differ, they're different configs
      if (p.config.model && config.model && p.config.model !== config.model) {
        return false;
      }
      if (
        p.config.deploymentName &&
        config.deploymentName &&
        p.config.deploymentName !== config.deploymentName
      ) {
        return false;
      }

      // If we got here with matching API keys and no conflicting models/deployments,
      // consider it the same configuration
      return true;
    }

    // If baseURLs exist and match, consider a potential match
    if (p.config.baseUrl && config.baseUrl && p.config.baseUrl === config.baseUrl) {
      // For base URLs, we also need matching models to consider them the same config
      if (p.config.model && config.model && p.config.model === config.model) {
        return true;
      }
    }

    // Otherwise, consider it a different configuration
    return false;
  });

  // Create new config object
  const updatedConfig: StoredProviderConfig = {
    id: configId || providers[existingIndex]?.id || createProviderConfigId(),
    providerId,
    displayName:
      displayName !== undefined
        ? displayName
        : existingIndex >= 0
        ? providers[existingIndex]?.displayName
        : undefined,
    config: { ...config },
  };

  // Update or add the configuration
  if (existingIndex >= 0) {
    providers[existingIndex] = updatedConfig;
  } else {
    // This is a new configuration, add it to the list
    providers.push(updatedConfig);
  }

  // Set defaultProviderIndex if makeDefault is true
  let defaultProviderIndex = safeConfigs.defaultProviderIndex;
  if (makeDefault) {
    // If we're updating an existing provider
    if (existingIndex >= 0) {
      defaultProviderIndex = existingIndex;
    } else {
      // If we're adding a new provider
      defaultProviderIndex = providers.length - 1;
    }
  }

  // Return updated configurations
  return {
    providers,
    defaultProviderIndex,
    termsAccepted: safeConfigs.termsAccepted || false,
  };
}

/**
 * Deletes a saved provider configuration.
 *
 * @param savedConfigs - Existing saved configurations to copy and update.
 * @param configId - Stable identity of the entry to remove.
 * @returns New saved configurations with matching entries removed and default adjusted.
 */
export function deleteProviderConfig(
  savedConfigs: SavedConfigurations | null | undefined,
  configId: string
): SavedConfigurations {
  // Ensure we have a valid savedConfigs object
  const safeConfigs = getSavedConfigurations(savedConfigs);

  // Create new array without the deleted config
  const providers = Array.isArray(safeConfigs?.providers)
    ? safeConfigs.providers.filter(provider => provider.id !== configId)
    : [];

  // Determine the index of the deleted provider in the original array so we
  // can correctly shift the default index when an earlier entry is removed.
  const originalProviders = Array.isArray(safeConfigs?.providers) ? safeConfigs.providers : [];
  const deletedIndex = originalProviders.findIndex(provider => provider.id === configId);

  let defaultProviderIndex: number | undefined;
  if (providers.length === 0) {
    defaultProviderIndex = undefined;
  } else {
    const oldDefault = safeConfigs.defaultProviderIndex ?? 0;
    if (deletedIndex === -1 || deletedIndex > oldDefault) {
      // Deleted provider was after the default (or not found) — index unchanged,
      // but clamp in case the list shrank.
      defaultProviderIndex = Math.min(oldDefault, providers.length - 1);
    } else if (deletedIndex < oldDefault) {
      // Deleted provider was before the default — shift default left by one.
      defaultProviderIndex = oldDefault - 1;
    } else {
      // Deleted provider was the default — keep the same numeric index (now
      // points at the next provider) but clamp to the new length.
      defaultProviderIndex = Math.min(oldDefault, providers.length - 1);
    }
  }

  return {
    providers,
    defaultProviderIndex,
    termsAccepted: safeConfigs.termsAccepted || false,
  };
}

/** Sets the default provider by stable persisted configuration ID. */
export function setDefaultProviderConfig(
  savedConfigs: SavedConfigurations,
  configId: string
): SavedConfigurations {
  const normalized = getSavedConfigurations(savedConfigs);
  const providers = normalized.providers ?? [];
  const defaultProviderIndex = providers.findIndex(provider => provider.id === configId);
  return {
    ...normalized,
    providers,
    defaultProviderIndex:
      defaultProviderIndex >= 0 ? defaultProviderIndex : normalized.defaultProviderIndex,
  };
}

/**
 * Marks the terms as accepted in saved configurations.
 *
 * @param savedConfigs - Existing saved configurations to copy.
 * @returns New saved configurations with terms acceptance enabled.
 */
export function saveTermsAcceptance(
  savedConfigs: SavedConfigurations | null | undefined
): SavedConfigurations {
  const safeConfigs = savedConfigs || { providers: [] };

  return {
    ...safeConfigs,
    termsAccepted: true,
  };
}
