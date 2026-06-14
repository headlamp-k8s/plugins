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
 * Developer options section for the AI Assistant settings page.
 *
 * Provides toggles to enable fake/mock implementations of the model,
 * agent, and MCP server so the AI assistant can be used for testing,
 * demos, and development without real API keys or network access.
 */

import {
  getActiveConfig,
  type SavedConfigurations,
  type StoredProviderConfig,
} from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';
import { Box, Collapse, FormControlLabel, Switch, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** Configuration state for developer options, persisted in the plugin config store. */
export interface DeveloperOptionsConfig {
  /** Whether the mock testing model provider is enabled. */
  enableMockModel?: boolean;
  /** Whether the mock testing agent is enabled for agent mode. */
  enableMockAgent?: boolean;
  /** Whether the fake MCP server is auto-configured. */
  enableFakeMCP?: boolean;
}

/** Props for the {@link DeveloperSettings} component. */
export interface DeveloperSettingsProps {
  /** Current developer options configuration. */
  devOptions: DeveloperOptionsConfig;
  /** Callback when any developer option changes. */
  onDevOptionsChange: (options: DeveloperOptionsConfig) => void;
  /** Current saved provider configurations (used to check/add mock model). */
  savedConfigs?: SavedConfigurations | null;
  /** Callback to update provider configs (e.g. to add mock-testing-model). */
  onConfigsChange?: (configs: SavedConfigurations) => void;
}

/** Provider ID for the mock testing model. */
const MOCK_MODEL_PROVIDER_ID = 'mock-testing-model';
/** Display name used when auto-adding the mock model provider. */
const MOCK_MODEL_DISPLAY_NAME = 'Mock Testing Model';

/**
 * Checks whether the mock-testing-model provider is present in saved configs.
 */
export function hasMockModelProvider(
  savedConfigs: SavedConfigurations | null | undefined
): boolean {
  return savedConfigs?.providers?.some(p => p.providerId === MOCK_MODEL_PROVIDER_ID) ?? false;
}

/**
 * Adds the mock-testing-model provider to saved configs if not already present.
 * Makes it the default provider.
 */
export function addMockModelProvider(
  savedConfigs: SavedConfigurations | null | undefined
): SavedConfigurations {
  const configs: SavedConfigurations = savedConfigs || { providers: [] };
  const providers: StoredProviderConfig[] = [...(configs.providers || [])];

  if (!providers.some(p => p.providerId === MOCK_MODEL_PROVIDER_ID)) {
    providers.push({
      providerId: MOCK_MODEL_PROVIDER_ID,
      displayName: MOCK_MODEL_DISPLAY_NAME,
      config: {},
    });
  }

  // Make mock model the default
  const mockIndex = providers.findIndex(p => p.providerId === MOCK_MODEL_PROVIDER_ID);
  return {
    ...configs,
    providers,
    defaultProviderIndex: mockIndex >= 0 ? mockIndex : configs.defaultProviderIndex,
    termsAccepted: true,
  };
}

/**
 * Removes the mock-testing-model provider from saved configs.
 * Adjusts default provider index if needed.
 */
export function removeMockModelProvider(
  savedConfigs: SavedConfigurations | null | undefined
): SavedConfigurations {
  const configs: SavedConfigurations = savedConfigs || { providers: [] };
  const providers = (configs.providers || []).filter(p => p.providerId !== MOCK_MODEL_PROVIDER_ID);

  let defaultIndex = configs.defaultProviderIndex ?? 0;
  // If the removed provider was before or at the default index, adjust
  const oldProviders = configs.providers || [];
  const removedIndex = oldProviders.findIndex(p => p.providerId === MOCK_MODEL_PROVIDER_ID);
  if (removedIndex >= 0 && removedIndex <= defaultIndex) {
    defaultIndex = Math.max(0, defaultIndex - 1);
  }
  // If no providers left, reset
  if (providers.length === 0) {
    defaultIndex = 0;
  }

  // If the default was the mock model, pick the first remaining
  const activeConfig = getActiveConfig(configs);
  if (activeConfig?.providerId === MOCK_MODEL_PROVIDER_ID) {
    defaultIndex = 0;
  }

  return {
    ...configs,
    providers,
    defaultProviderIndex: providers.length > 0 ? defaultIndex : undefined,
  };
}

/**
 * Collapsible developer options section with toggles for fake model, agent, and MCP server.
 */
export function DeveloperSettings({
  devOptions,
  onDevOptionsChange,
  savedConfigs,
  onConfigsChange,
}: DeveloperSettingsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(
    () =>
      devOptions.enableMockModel === true ||
      devOptions.enableMockAgent === true ||
      devOptions.enableFakeMCP === true
  );

  const handleToggleMockModel = (enabled: boolean) => {
    onDevOptionsChange({ ...devOptions, enableMockModel: enabled });

    // Also add/remove the mock-testing-model provider from saved configs
    if (onConfigsChange && savedConfigs !== undefined) {
      if (enabled) {
        onConfigsChange(addMockModelProvider(savedConfigs));
      } else {
        onConfigsChange(removeMockModelProvider(savedConfigs));
      }
    }
  };

  const handleToggleMockAgent = (enabled: boolean) => {
    onDevOptionsChange({ ...devOptions, enableMockAgent: enabled });
  };

  const handleToggleFakeMCP = (enabled: boolean) => {
    onDevOptionsChange({ ...devOptions, enableFakeMCP: enabled });
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Typography variant="h6">{t('Developer Options')}</Typography>
        <IconButton
          size="small"
          sx={{ ml: 1 }}
          aria-label={expanded ? t('Collapse developer options') : t('Expand developer options')}
        >
          {expanded ? '▼' : '▶'}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ ml: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enable fake implementations for testing, demos, and development without real API keys or
            network access.
          </Typography>

          {/* Mock Testing Model */}
          <FormControlLabel
            control={
              <Switch
                checked={devOptions.enableMockModel ?? false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToggleMockModel(e.target.checked)
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">{t('Mock Testing Model')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  A canned-response model for automated tests and demos — no API key or network
                  required. When enabled, adds it as a provider and sets it as the default.
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />

          {/* Mock Testing Agent */}
          <FormControlLabel
            control={
              <Switch
                checked={devOptions.enableMockAgent ?? false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToggleMockAgent(e.target.checked)
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">{t('Mock Testing Agent')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  A scripted agent with built-in sessions for pod troubleshooting and cluster
                  exploration. Simulates thinking steps and tool calls without a real agent backend.
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />

          {/* Fake MCP Server */}
          <FormControlLabel
            control={
              <Switch
                checked={devOptions.enableFakeMCP ?? false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToggleFakeMCP(e.target.checked)
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">{t('Fake MCP Server')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Registers a fake MCP server with greet and add tools. Requires the desktop app
                  (stdio transport). Useful for testing MCP tool execution without real servers.
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

export default DeveloperSettings;
