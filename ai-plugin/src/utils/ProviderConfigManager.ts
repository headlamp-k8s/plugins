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
export function getActiveConfig(savedConfigs: SavedConfigurations | null | undefined): StoredProviderConfig | null {
  if (!savedConfigs?.providers || savedConfigs.providers.length === 0) {
    return null;
  }
  const defaultConfig = savedConfigs?.providers[savedConfigs.defaultProviderIndex || 0];
  if (defaultConfig) return defaultConfig;

  // Otherwise return the first one
  return savedConfigs?.providers[0];
}

/**
 * Saves or updates a provider configuration
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
  const providers: StoredProviderConfig[] = safeConfigs?.providers?.map(p => ({
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
      if (p.config.deploymentName && config.deploymentName &&
          p.config.deploymentName !== config.deploymentName) {
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
    displayName: displayName || (existingIndex >= 0 ? providers[existingIndex]?.displayName : undefined),
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
  };
}

/**
 * Deletes a provider configuration
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
  const defaultProviderIndex = providers.length > 0 ? 
    (safeConfigs.defaultProviderIndex !== undefined ? 
      Math.min(safeConfigs.defaultProviderIndex, providers.length - 1) : 
      0) : 
    undefined;

  return {
    providers,
    defaultProviderIndex,
  };
}
