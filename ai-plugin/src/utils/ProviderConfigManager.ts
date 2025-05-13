/**
 * Utility functions for managing AI provider configurations
 */

export interface StoredProviderConfig {
  providerId: string;
  displayName?: string;
  config: Record<string, any>;
  isDefault?: boolean;
}

export interface SavedConfigurations {
  providers: StoredProviderConfig[];
  activeProviderId?: string;
}

/**
 * Gets saved provider configurations from plugin data
 */
export function getSavedConfigurations(data: any): SavedConfigurations {
  if (!data) {
    return { providers: [] };
  }

  // Check for new format storage
  if (data.providers && Array.isArray(data.providers)) {
    return {
      providers: data.providers,
      activeProviderId: data.activeProviderId,
    };
  }

  // Create empty configuration if nothing is found
  const providers: StoredProviderConfig[] = [];

  // Handle legacy format (convert to new format)
  if (data.API_KEY) {
    // Check if this is OpenAI or Azure OpenAI
    if (data.API_TYPE === 'azure' && data.DEPLOYMENT_NAME && data.ENDPOINT) {
      providers.push({
        providerId: 'azure',
        displayName: 'Azure OpenAI (Legacy)',
        config: {
          apiKey: data.API_KEY,
          deploymentName: data.DEPLOYMENT_NAME,
          endpoint: data.ENDPOINT,
          model: data.GPT_MODEL || 'gpt-4',
        },
        isDefault: true,
      });
    } else if (data.GPT_MODEL) {
      providers.push({
        providerId: 'openai',
        displayName: 'OpenAI (Legacy)',
        config: {
          apiKey: data.API_KEY,
          model: data.GPT_MODEL,
        },
        isDefault: true,
      });
    }
  }

  // Check for "provider" and "config" format (intermediate format)
  if (data.provider && data.config && typeof data.config === 'object') {
    // Make sure it's not already added from legacy format
    const alreadyAdded = providers.some(p => p.providerId === data.provider);

    if (!alreadyAdded) {
      providers.push({
        providerId: data.provider,
        displayName: `${data.provider} Config`,
        config: { ...data.config },
        isDefault: true,
      });
    }
  }

  return {
    providers,
    activeProviderId:
      providers.length > 0
        ? providers.find(p => p.isDefault)?.providerId || providers[0].providerId
        : undefined,
  };
}

/**
 * Gets the active configuration based on activeProviderId or the default config
 */
export function getActiveConfig(savedConfigs: SavedConfigurations): StoredProviderConfig | null {
  if (!savedConfigs.providers || savedConfigs.providers.length === 0) {
    return null;
  }

  // First try to find by activeProviderId
  if (savedConfigs.activeProviderId) {
    const activeConfig = savedConfigs.providers.find(
      p => p.providerId === savedConfigs.activeProviderId
    );
    if (activeConfig) return activeConfig;
  }

  // Then try to find the default
  const defaultConfig = savedConfigs.providers.find(p => p.isDefault);
  if (defaultConfig) return defaultConfig;

  // Otherwise return the first one
  return savedConfigs.providers[0];
}

/**
 * Saves or updates a provider configuration
 */
export function saveProviderConfig(
  savedConfigs: SavedConfigurations,
  providerId: string,
  config: Record<string, any>,
  makeDefault: boolean = false,
  displayName?: string
): SavedConfigurations {
  // Create new array to avoid modifying the original
  const providers: StoredProviderConfig[] = savedConfigs.providers?.map(p => ({
    ...p,
    // If makeDefault is true, unset default flag on all other providers
    isDefault: makeDefault ? false : p.isDefault,
  })) ?? [];

  // Check if this provider already exists
  const existingIndex = providers.findIndex(p => p.providerId === providerId);

  // Create new config object
  const updatedConfig: StoredProviderConfig = {
    providerId,
    displayName: displayName || providers[existingIndex]?.displayName,
    config: { ...config },
    isDefault: makeDefault || (existingIndex === -1 && providers.length === 0),
  };

  // Update or add the configuration
  if (existingIndex >= 0) {
    providers[existingIndex] = updatedConfig;
  } else {
    providers.push(updatedConfig);
  }

  // Set activeProviderId to the saved provider
  const activeProviderId = providerId;

  // Return updated configurations
  return {
    providers,
    activeProviderId,
  };
}

/**
 * Deletes a provider configuration
 */
export function deleteProviderConfig(
  savedConfigs: SavedConfigurations,
  providerId: string,
  config: Record<string, any>
): SavedConfigurations {
  // Create new array without the deleted config
  const providers = Array.isArray(savedConfigs.providers)
    ? savedConfigs.providers.filter(p => {
        if (p.providerId !== providerId) return true;

        if (p.config.apiKey && config.apiKey) {
          return p.config.apiKey !== config.apiKey;
        }
        if (p.config.baseUrl && config.baseUrl) {
          return p.config.baseUrl !== config.baseUrl;
        }

        return JSON.stringify(p.config) !== JSON.stringify(config);
      })
    : [];

  // If we're deleting the active provider, clear the active provider ID
  let activeProviderId = savedConfigs.activeProviderId;
  if (activeProviderId === providerId) {
    // Find a new active provider (first available, preferring default)
    const defaultConfig = providers.find(p => p.isDefault);
    activeProviderId = defaultConfig?.providerId || providers[0]?.providerId;
  }

  // If we deleted the default provider and have others left, make the first one the default
  if (providers.length > 0 && !providers.some(p => p.isDefault)) {
    providers[0].isDefault = true;
  }

  return {
    providers,
    activeProviderId,
  };
}
