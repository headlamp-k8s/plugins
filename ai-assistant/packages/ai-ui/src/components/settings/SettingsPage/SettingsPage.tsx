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
 * Composable settings page for the AI Assistant plugin.
 *
 * Renders all settings sections: model provider selection with auto-detect,
 * AI tools toggles, MCP servers, skills, Holmes agent, and optional
 * platform-specific sections. All headlamp-plugin dependencies are
 * injected via props so this component works in any MUI-based host.
 *
 * @example
 * ```tsx
 * // In headlamp-plugin (ai-assistant/src/components/settings/Settings.tsx):
 * <SettingsPage
 *   savedConfigs={savedConfigs as any}
 *   onConfigsChange={configs => pluginStore.update(configs)}
 *   tools={getAllAvailableTools()}
 *   isToolEnabled={id => isToolEnabled(pluginSettings, id)}
 *   onToolToggle={id => pluginStore.update(toggleTool(pluginSettings, id))}
 *   isRunningAsApp={Headlamp.isRunningAsApp()}
 *   configStore={pluginStore}
 *   // ...other props
 * />
 * ```
 */

import { getDefaultConfig } from '@headlamp-k8s/ai-common/config/modelConfig';
import {
  getActiveConfig,
  type SavedConfigurations,
} from '@headlamp-k8s/ai-common/managers/ProviderConfigManager';
import type { CommandRunner } from '@headlamp-k8s/ai-common/providers/providerAutoDetect';
import { Box, Button, Divider, FormControlLabel, Link, Switch, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AIToolsSettings, type ToolInfo } from '../AIToolsSettings/AIToolsSettings';
import { AutoDetectProvider, useAutoDetect } from '../AutoDetectProvider/AutoDetectProvider';
import {
  type DeveloperOptionsConfig,
  DeveloperSettings,
} from '../DeveloperSettings/DeveloperSettings';
import { HolmesAgentSettings } from '../HolmesAgentSettings/HolmesAgentSettings';
import { type ConfigStore, MCPSettings } from '../MCPSettings/MCPSettings';
import ModelSelector from '../ModelSelector/ModelSelector';
import { SkillSettings } from '../SkillSettings/SkillSettings';
import type { SkillDisplayInfo } from '../SkillsViewerDialog/SkillsViewerDialog';

/** Props for the {@link SettingsPage} component. */
export interface SettingsPageProps {
  // --- Provider config ---

  /** Current saved configurations. */
  savedConfigs: SavedConfigurations | null | undefined;
  /** Callback to persist configuration changes. */
  onConfigsChange: (configs: SavedConfigurations) => void;
  /** Callback invoked when terms are accepted. */
  onTermsAccept?: (configs: SavedConfigurations) => void;

  // --- Auto-detect ---

  /** Platform-specific command runner for CLI-based provider detection. */
  commandRunner?: CommandRunner | null;
  /** Previously dismissed provider keys. */
  dismissedProviders?: string[];
  /** Callback to persist dismissed provider keys. */
  onDismissProviders?: (keys: string[]) => void;

  // --- AI Tools ---

  /** Available AI tools to display as toggles. */
  tools?: ToolInfo[];
  /** Returns whether the given tool is enabled. */
  isToolEnabled?: (toolId: string) => boolean;
  /** Callback when a tool toggle is flipped. */
  onToolToggle?: (toolId: string) => void;

  // --- MCP ---

  /** Whether the app is running in desktop/Electron mode. */
  isRunningAsApp?: boolean;
  /** Config store for MCP and Skill settings. */
  configStore: ConfigStore;

  // --- Skills ---

  /** Callback to check whether a filesystem path exists (for skill detection). */
  checkPathExists?: (path: string) => Promise<boolean>;
  /** Root directory of the current project (for skill path resolution). */
  projectRoot?: string;
  /** Async function that loads all skills and returns them for display. */
  loadSkills?: (
    onProgress?: (progress: any) => void,
    sourceUrl?: string
  ) => Promise<SkillDisplayInfo[]>;
  /** Callback fired when skill loading completes (for notifications). */
  onSkillsLoadComplete?: (result: { count: number; error?: string }) => void;

  // --- Holmes ---

  /** Callback invoked when Holmes settings change. */
  onHolmesConfigChange?: (patch: Record<string, any>) => void;
  /** Default Holmes namespace. */
  defaultHolmesNamespace?: string;
  /** Default Holmes service name. */
  defaultHolmesServiceName?: string;
  /** Default Holmes port. */
  defaultHolmesPort?: number;

  // --- Preview / Test mode ---

  /** Whether the preview features are enabled. */
  previewEnabled?: boolean;
  /** Callback when preview toggle changes. */
  onPreviewChange?: (enabled: boolean) => void;
  /** Whether test mode is active. */
  isTestMode?: boolean;
  /** Callback when test mode toggle changes. */
  onTestModeChange?: (enabled: boolean) => void;
  /** Whether the config popover has been shown. */
  hasShownConfigPopover?: boolean;
  /** Callback to reset the config popover state. */
  onResetPopover?: () => void;

  // --- Developer Options ---

  /** Current developer options (mock model, agent, fake MCP). */
  devOptions?: DeveloperOptionsConfig;
  /** Callback when developer options change. */
  onDevOptionsChange?: (options: DeveloperOptionsConfig) => void;

  // --- AKS Agent ---

  /** URL to AKS Agent installation documentation. */
  aksDocUrl?: string;
}

/**
 * Main AI Assistant settings page.
 *
 * Composes model provider selection, auto-detect, AI tools, MCP,
 * skills, Holmes, and optional sections into a single settings view.
 */
export function SettingsPage({
  savedConfigs,
  onConfigsChange,
  onTermsAccept,
  commandRunner,
  dismissedProviders,
  onDismissProviders,
  tools,
  isToolEnabled: isToolEnabledFn,
  onToolToggle,
  isRunningAsApp = false,
  configStore,
  checkPathExists,
  projectRoot,
  loadSkills,
  onSkillsLoadComplete,
  onHolmesConfigChange,
  defaultHolmesNamespace,
  defaultHolmesServiceName,
  defaultHolmesPort,
  previewEnabled,
  onPreviewChange,
  isTestMode,
  onTestModeChange,
  hasShownConfigPopover,
  onResetPopover,
  devOptions,
  onDevOptionsChange,
  aksDocUrl,
}: SettingsPageProps) {
  const { t } = useTranslation();
  const [activeConfiguration, setActiveConfiguration] = React.useState<{
    providerId: string;
    config: Record<string, any>;
    displayName: string;
  }>(() => {
    const activeConfig = getActiveConfig(savedConfigs);
    if (activeConfig) {
      return {
        providerId: activeConfig.providerId,
        config: { ...activeConfig.config },
        displayName: activeConfig.displayName || '',
      };
    }
    return { providerId: 'openai', config: getDefaultConfig('openai'), displayName: '' };
  });

  // Auto-detect hook
  const autoDetect = useAutoDetect({
    savedConfigs,
    onConfigsChange,
    onActiveConfigChange: setActiveConfiguration,
    commandRunner,
    dismissedProviders,
    onDismissProviders,
  });

  const handleModelSelectorChange = (changes: {
    providerId: string;
    config: Record<string, any>;
    displayName: string;
    savedConfigs?: SavedConfigurations;
  }) => {
    setActiveConfiguration({
      providerId: changes.providerId,
      config: changes.config,
      displayName: changes.displayName,
    });

    if (changes.savedConfigs) {
      onConfigsChange(changes.savedConfigs);
    }
  };

  return (
    <Box width={'100%'}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        meow
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This plugin is in early development and is not yet ready for production use. Using it may
        incur in costs from the AI provider! Use at your own risk.
      </Typography>

      {/* Preview Feature Toggle */}
      {onPreviewChange && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ mb: 3, ml: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={previewEnabled ?? true}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onPreviewChange(e.target.checked)
                  }
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{t('Preview Features')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('Enable preview features including the AI assistant button in the app bar')}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </>
      )}

      {/* Test mode section */}
      <Divider sx={{ my: 3 }} />
      {isTestMode && onTestModeChange && (
        <>
          <Box sx={{ mb: 3, ml: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isTestMode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onTestModeChange(e.target.checked)
                  }
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{t('Test Mode')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enable test mode to manually input AI responses and see how they render in the
                    chat window
                  </Typography>
                </Box>
              }
            />
          </Box>

          {onResetPopover && (
            <Box sx={{ mb: 3, ml: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body1">{t('Configuration Popover')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hasShownConfigPopover
                      ? 'The configuration popover has been shown and dismissed'
                      : 'The configuration popover will show when no AI providers are configured'}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onResetPopover}
                  disabled={!hasShownConfigPopover}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* Model provider selection */}
      <ModelSelector
        selectedProvider={activeConfiguration.providerId}
        config={activeConfiguration.config}
        savedConfigs={savedConfigs as any}
        configName={activeConfiguration.displayName}
        isConfigView
        onChange={handleModelSelectorChange}
        onTermsAccept={updatedConfigs => {
          onTermsAccept?.(updatedConfigs);
        }}
        onAutoDetect={autoDetect.handleAutoDetect}
        autoDetecting={autoDetect.autoDetecting}
        commandRunner={commandRunner ?? undefined}
      />
      <AutoDetectProvider
        detectedProviders={autoDetect.detectedProviders}
        showDetectedDialog={autoDetect.showDetectedDialog}
        setShowDetectedDialog={autoDetect.setShowDetectedDialog}
        handleAddDetectedProviders={autoDetect.handleAddDetectedProviders}
        handleDismissDetectedProviders={autoDetect.handleDismissDetectedProviders}
      />

      {/* AI Tools Section */}
      {tools && isToolEnabledFn && onToolToggle && (
        <>
          <Divider sx={{ my: 3 }} />
          <AIToolsSettings
            tools={tools}
            isToolEnabled={isToolEnabledFn}
            onToolToggle={onToolToggle}
          />
        </>
      )}

      {/* MCP Servers Section */}
      <Divider sx={{ my: 3 }} />
      <MCPSettings isRunningAsApp={isRunningAsApp} configStore={configStore} />

      {/* Skills Section */}
      <Divider sx={{ my: 3 }} />
      <SkillSettings
        configStore={configStore}
        checkPathExists={checkPathExists}
        projectRoot={projectRoot}
        isRunningAsApp={isRunningAsApp}
        loadSkills={loadSkills}
        onSkillsLoadComplete={onSkillsLoadComplete}
      />

      {/* Holmes Agent Section */}
      {onHolmesConfigChange && (
        <>
          <Divider sx={{ my: 3 }} />
          <HolmesAgentSettings
            config={savedConfigs}
            onConfigChange={onHolmesConfigChange}
            defaultNamespace={defaultHolmesNamespace}
            defaultServiceName={defaultHolmesServiceName}
            defaultPort={defaultHolmesPort}
          />
        </>
      )}

      {/* AKS Agent Section */}
      {aksDocUrl && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            AKS Agent
          </Typography>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              The AKS Agent provides AI-powered troubleshooting for Azure Kubernetes Service
              clusters. When installed in your cluster, it enables an agent mode in the AI assistant
              that can diagnose and help resolve cluster issues.
            </Typography>
            <Link
              href={aksDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ fontSize: '0.875rem' }}
            >
              Learn how to install the AKS Agent →
            </Link>
          </Box>
        </>
      )}

      {/* Developer Options Section */}
      {devOptions && onDevOptionsChange && (
        <>
          <Divider sx={{ my: 3 }} />
          <DeveloperSettings
            devOptions={devOptions}
            onDevOptionsChange={onDevOptionsChange}
            savedConfigs={savedConfigs as any}
            onConfigsChange={onConfigsChange}
          />
        </>
      )}

      {/* Bottom divider */}
      <Divider sx={{ my: 3 }} />
    </Box>
  );
}

export default SettingsPage;
