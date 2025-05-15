/**
 * Utility functions for managing AI provider configurations
 */

export interface StoredProviderConfig {
  providerId: string;
  displayName?: string;
  config: Record<string, any>;
}

export interface SavedConfigurations {
  providers: StoredProviderConfig[];
  defaultProviderIndex?: number;
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
      defaultProviderIndex: data.defaultProviderIndex,
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
      });
    } else if (data.GPT_MODEL) {
      providers.push({
        providerId: 'openai',
        displayName: 'OpenAI (Legacy)',
        config: {
          apiKey: data.API_KEY,
          model: data.GPT_MODEL,
        },
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
      });
    }
  }

  return {
    providers,
  };
}

/**
 * Gets the active configuration based on the default config
 */
export function getActiveConfig(savedConfigs: SavedConfigurations): StoredProviderConfig | null {
  if (!savedConfigs.providers || savedConfigs.providers.length === 0) {
    return null;
  }

  const defaultConfig = savedConfigs.providers[savedConfigs.defaultProviderIndex || 0];
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
  })) ?? [];

  // Check if this provider already exists
  const existingIndex = providers.findIndex(p => p.providerId === providerId);

  // Create new config object
  const updatedConfig: StoredProviderConfig = {
    providerId,
    displayName: displayName || providers[existingIndex]?.displayName,
    config: { ...config },
  };

  // Update or add the configuration
  if (existingIndex >= 0) {
    providers[existingIndex] = updatedConfig;
  } else {
    providers.push(updatedConfig);
  }

  // Set defaultProviderIndex if makeDefault is true
  let defaultProviderIndex = savedConfigs.defaultProviderIndex;
  if (makeDefault) {
    // If we're updating an existing provider
    if (existingIndex >= 0) {
      defaultProviderIndex = existingIndex;
    } else {
      // If we're adding a new provider
      defaultProviderIndex = 0;
    }
  }

  // Return updated configurations
  return {
    providers,
    defaultProviderIndex,
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

  // If we deleted the default provider and have others left, make the first one the default
  let defaultProviderIndex = savedConfigs.defaultProviderIndex % providers.length;

  return {
    providers,
    defaultProviderIndex,
  };
}
