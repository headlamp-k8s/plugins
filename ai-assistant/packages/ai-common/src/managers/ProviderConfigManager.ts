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
 * Represents one saved AI provider configuration.
 */
export interface StoredProviderConfig {
  /** Provider identifier for this saved configuration. */
  providerId: string;
  /** Optional name shown to users for this configuration. */
  displayName?: string;
  /** Provider-specific settings persisted for reuse. */
  config: Record<string, any>;
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
 */
export function isSameStoredConfig(a: StoredProviderConfig, b: StoredProviderConfig): boolean {
  if (a.providerId !== b.providerId) return false;

  // Azure: match on account name (sentinel configs have no real key)
  if (a.providerId === 'azure') {
    if (a.config?.azAccountName && b.config?.azAccountName) {
      return a.config.azAccountName === b.config.azAccountName;
    }
  }

  // Match on API key
  if (a.config?.apiKey && b.config?.apiKey && a.config.apiKey === b.config.apiKey) {
    return true;
  }

  // Match on base URL + model
  if (a.config?.baseUrl && b.config?.baseUrl && a.config.baseUrl === b.config.baseUrl) {
    if (a.config?.model && b.config?.model && a.config.model === b.config.model) {
      return true;
    }
  }

  return false;
}

/**
 * Returns saved provider configurations from plugin data.
 */
export function getSavedConfigurations(data: any): SavedConfigurations {
  if (!data) {
    return { providers: [] };
  }

  // Check for new format storage
  if (data.providers && Array.isArray(data.providers)) {
    return {
      providers: data.providers,
      defaultProviderIndex: data.defaultProviderIndex,
      termsAccepted: data.termsAccepted || false,
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
 */
export function saveProviderConfig(
  savedConfigs: SavedConfigurations | null | undefined,
  providerId: string,
  config: Record<string, any>,
  makeDefault: boolean = false,
  displayName?: string
): SavedConfigurations {
  // Ensure we have a valid savedConfigs object
  const safeConfigs: SavedConfigurations = savedConfigs || { providers: [] };

  // Create new array to avoid modifying the original
  const providers: StoredProviderConfig[] =
    safeConfigs?.providers?.map(p => ({
      ...p,
    })) ?? [];

  // Check if this exact configuration already exists (by comparing display name or key fields)
  const existingIndex = providers.findIndex(p => {
    // If displayName is provided, use that as primary matching criteria
    if (displayName && p.displayName === displayName && p.providerId === providerId) {
      return true;
    }

    // Must match provider ID
    if (p.providerId !== providerId) return false;

    // Azure sentinel-aware matching: configs with azAccountName match on that
    if (
      p.providerId === 'azure' &&
      p.config.azAccountName &&
      config.azAccountName &&
      p.config.azAccountName === config.azAccountName
    ) {
      return true;
    }

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
    providerId,
    displayName:
      displayName || (existingIndex >= 0 ? providers[existingIndex]?.displayName : undefined),
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
 */
export function deleteProviderConfig(
  savedConfigs: SavedConfigurations | null | undefined,
  providerId: string,
  config: Record<string, any>
): SavedConfigurations {
  // Ensure we have a valid savedConfigs object
  const safeConfigs: SavedConfigurations = savedConfigs || { providers: [] };

  // Create new array without the deleted config
  const providers = Array.isArray(safeConfigs?.providers)
    ? safeConfigs?.providers.filter(p => {
        if (p.providerId !== providerId) return true;

        // Azure sentinel-aware matching: configs with azAccountName match on that
        if (
          p.providerId === 'azure' &&
          p.config.azAccountName &&
          config.azAccountName &&
          p.config.azAccountName === config.azAccountName
        ) {
          return false;
        }

        if (p.config.apiKey && config.apiKey) {
          return p.config.apiKey !== config.apiKey;
        }
        if (p.config.baseUrl && config.baseUrl) {
          return p.config.baseUrl !== config.baseUrl;
        }

        return JSON.stringify(p.config) !== JSON.stringify(config);
      })
    : [];

  // If we deleted the default provider and have others left, make the first one the default
  const defaultProviderIndex =
    providers.length > 0
      ? safeConfigs.defaultProviderIndex !== undefined
        ? Math.min(safeConfigs.defaultProviderIndex, providers.length - 1)
        : 0
      : undefined;

  return {
    providers,
    defaultProviderIndex,
    termsAccepted: safeConfigs.termsAccepted || false,
  };
}

/**
 * Marks the terms as accepted in saved configurations.
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
