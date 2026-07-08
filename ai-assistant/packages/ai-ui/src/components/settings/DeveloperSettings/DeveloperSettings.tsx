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
} from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { Box, ButtonBase, Collapse, FormControlLabel, Switch, Typography } from '@mui/material';
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
  /**
   * Whether all tool calls are auto-approved without showing the confirmation
   * dialog.  Equivalent to `--auto-approve` in the CLI.
   */
  enableAutoApproval?: boolean;
  /**
   * Whether a mock Kubernetes tool manager is injected so the assistant can
   * answer cluster questions without a real cluster connection.  Uses built-in
   * fixture data (a few fake pods, deployments, services, and nodes).
   */
  enableMockTools?: boolean;
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
 *
 * @param savedConfigs - Saved provider configurations to inspect.
 * @returns Whether the mock provider is present.
 */
export function hasMockModelProvider(
  savedConfigs: SavedConfigurations | null | undefined
): boolean {
  return savedConfigs?.providers?.some(p => p.providerId === MOCK_MODEL_PROVIDER_ID) ?? false;
}

/**
 * Adds the mock-testing-model provider to saved configs if not already present.
 * Makes it the default provider.
 *
 * @param savedConfigs - Saved provider configurations to copy and update.
 * @returns Configurations containing the mock provider as the default.
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
  };
}

/**
 * Removes the mock-testing-model provider from saved configs.
 * Adjusts default provider index if needed.
 *
 * @param savedConfigs - Saved provider configurations to copy and update.
 * @returns Configurations without the mock provider.
 */
export function removeMockModelProvider(
  savedConfigs: SavedConfigurations | null | undefined
): SavedConfigurations {
  const configs: SavedConfigurations = savedConfigs || { providers: [] };
  const oldProviders = configs.providers || [];
  const providers = oldProviders.filter(p => p.providerId !== MOCK_MODEL_PROVIDER_ID);
  const oldDefaultIndex = configs.defaultProviderIndex ?? 0;
  const activeConfig = getActiveConfig(configs);
  const removedBeforeDefault = oldProviders
    .slice(0, oldDefaultIndex)
    .filter(provider => provider.providerId === MOCK_MODEL_PROVIDER_ID).length;
  const defaultIndex =
    activeConfig?.providerId === MOCK_MODEL_PROVIDER_ID
      ? 0
      : Math.max(0, oldDefaultIndex - removedBeforeDefault);

  return {
    ...configs,
    providers,
    defaultProviderIndex: providers.length > 0 ? defaultIndex : undefined,
  };
}

/**
 * Collapsible developer options section with toggles for fake model, agent, and MCP server.
 *
 * @param props - Developer settings properties.
 * @returns Developer option controls.
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
      devOptions.enableFakeMCP === true ||
      devOptions.enableAutoApproval === true ||
      devOptions.enableMockTools === true
  );

  /**
   * Toggles the mock model and synchronizes its saved provider entry.
   *
   * @param enabled - Whether the mock model should be enabled.
   * @returns No value.
   */
  const handleToggleMockModel = (enabled: boolean): void => {
    // Persist the provider collection before exposing the matching option state.
    if (onConfigsChange) {
      if (enabled) {
        onConfigsChange(addMockModelProvider(savedConfigs));
      } else {
        onConfigsChange(removeMockModelProvider(savedConfigs));
      }
    }

    onDevOptionsChange({ ...devOptions, enableMockModel: enabled });
  };

  /**
   * Toggles the scripted mock agent.
   *
   * @param enabled - Whether the mock agent should be enabled.
   * @returns No value.
   */
  const handleToggleMockAgent = (enabled: boolean): void => {
    onDevOptionsChange({ ...devOptions, enableMockAgent: enabled });
  };

  /**
   * Toggles the fake MCP server.
   *
   * @param enabled - Whether fake MCP should be enabled.
   * @returns No value.
   */
  const handleToggleFakeMCP = (enabled: boolean): void => {
    onDevOptionsChange({ ...devOptions, enableFakeMCP: enabled });
  };

  /**
   * Toggles automatic tool approval.
   *
   * @param enabled - Whether tool calls should be auto-approved.
   * @returns No value.
   */
  const handleToggleAutoApproval = (enabled: boolean): void => {
    onDevOptionsChange({ ...devOptions, enableAutoApproval: enabled });
  };

  /**
   * Toggles fixture-backed Kubernetes tools.
   *
   * @param enabled - Whether mock tools should be enabled.
   * @returns No value.
   */
  const handleToggleMockTools = (enabled: boolean): void => {
    onDevOptionsChange({ ...devOptions, enableMockTools: enabled });
  };

  return (
    <Box>
      <ButtonBase
        aria-controls="developer-options-content"
        aria-expanded={expanded}
        onClick={() => setExpanded(current => !current)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          width: '100%',
        }}
      >
        <Typography variant="h6" component="span">
          {t('Developer Options')}
        </Typography>
        <Box component="span" aria-hidden="true" sx={{ ml: 1 }}>
          {expanded ? '▼' : '▶'}
        </Box>
      </ButtonBase>

      <Collapse id="developer-options-content" in={expanded}>
        <Box sx={{ ml: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t(
              'Enable fake implementations for testing, demos, and development without real API keys or network access.'
            )}
          </Typography>

          {/* Mock Testing Model */}
          <FormControlLabel
            control={
              <Switch
                checked={devOptions.enableMockModel ?? false}
                inputProps={{ 'aria-label': t('Mock Testing Model') }}
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
                  {t(
                    'A canned-response model for automated tests and demos — no API key or network required. When enabled, adds it as a provider and sets it as the default.'
                  )}
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
                inputProps={{ 'aria-label': t('Mock Testing Agent') }}
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
                  {t(
                    'A scripted agent with built-in sessions for pod troubleshooting and cluster exploration. Simulates thinking steps and tool calls without a real agent backend.'
                  )}
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
                inputProps={{ 'aria-label': t('Fake MCP Server') }}
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
                  {t(
                    'Registers a fake MCP server with greet and add tools. Requires the desktop app (stdio transport). Useful for testing MCP tool execution without real servers.'
                  )}
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />

          {/* Auto-approve tool calls */}
          <FormControlLabel
            control={
              <Switch
                checked={devOptions.enableAutoApproval ?? false}
                inputProps={{ 'aria-label': t('Auto-approve Tool Calls') }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToggleAutoApproval(e.target.checked)
                }
                color="warning"
              />
            }
            label={
              <Box>
                <Typography variant="body1">{t('Auto-approve Tool Calls')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t(
                    "Skip the tool-approval dialog and approve every tool call automatically. Equivalent to the CLI's --auto-approve flag. Only enable in trusted development environments."
                  )}
                </Typography>
              </Box>
            }
            sx={{ mb: 2, alignItems: 'flex-start' }}
          />

          {/* Mock Kubernetes tools */}
          <FormControlLabel
            control={
              <Switch
                checked={devOptions.enableMockTools ?? false}
                inputProps={{ 'aria-label': t('Mock Testing Tools') }}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleToggleMockTools(e.target.checked)
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">{t('Mock Testing Tools')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t(
                    'Replace the real Kubernetes API with built-in fixture data (a few fake pods, deployments, services, and nodes). Lets the assistant answer cluster questions without a real cluster connection. Best combined with Mock Testing Model.'
                  )}
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
