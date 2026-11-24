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
 *   savedConfigs={savedConfigs}
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

import { getDefaultConfig } from '@headlamp-k8s/ai-common/providers/catalog';
import type { CommandRunner } from '@headlamp-k8s/ai-common/providers/detectProvider';
import {
  getActiveConfig,
  getSavedConfigurations,
  type ProviderSettings,
  type SavedConfigurations,
} from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { Icon } from '@iconify/react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Switch,
  Typography,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DefaultSectionWrapper,
  type DefaultSectionWrapperProps,
  DefaultSettingsTable,
  type DefaultSettingsTableProps,
} from '../../defaults/DefaultSlots/DefaultSlots';
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
import type { SkillDisplayInfo, SkillLoadProgress } from '../SkillsViewerDialog/SkillsViewerDialog';

/** Props for the {@link SettingsPage} component. */
export interface SettingsPageProps {
  /** Optional host section layout, including section-header actions. */
  SectionWrapper?: React.ComponentType<DefaultSectionWrapperProps>;
  /** Optional host name/value table for setting labels and controls. */
  SettingsTable?: React.ComponentType<DefaultSettingsTableProps>;
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
    onProgress?: (progress: SkillLoadProgress) => void,
    sourceUrl?: string,
    forceReload?: boolean
  ) => Promise<SkillDisplayInfo[]>;
  /** Callback fired when skill loading completes (for notifications). */
  onSkillsLoadComplete?: (result: { count: number; error?: string }) => void;

  // --- Holmes ---

  /** Callback invoked when Holmes settings change. */
  onHolmesConfigChange?: (patch: Record<string, unknown>) => void;
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
  /** Whether scheduled proactive diagnosis is enabled. */
  proactiveDiagnosisEnabled?: boolean;
  /** Callback when the proactive diagnosis toggle changes. */
  onProactiveDiagnosisChange?: (enabled: boolean) => void;
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
}

/** Active provider settings displayed and edited by the model selector. */
interface ActiveConfiguration {
  /** Stable ID of the active saved configuration. */
  configId?: string;
  /** Active provider identifier. */
  providerId: string;
  /** Active provider-specific settings. */
  config: ProviderSettings;
  /** User-facing saved configuration name. */
  displayName: string;
}

/**
 * Resolves the active saved provider or OpenAI defaults when none exist.
 *
 * @param savedConfigs - Persisted provider configurations.
 * @returns Active provider state for the model selector.
 */
function resolveActiveConfiguration(
  savedConfigs: SavedConfigurations | null | undefined
): ActiveConfiguration {
  const activeConfig = getActiveConfig(savedConfigs);
  if (activeConfig) {
    return {
      configId: activeConfig.id,
      providerId: activeConfig.providerId,
      config: { ...activeConfig.config },
      displayName: activeConfig.displayName || '',
    };
  }
  return { providerId: 'openai', config: getDefaultConfig('openai'), displayName: '' };
}

/**
 * Main AI Assistant settings page.
 *
 * Composes model provider selection, auto-detect, AI tools, MCP,
 * skills, Holmes, and optional sections into a single settings view.
 *
 * @param props - Settings page configuration and host callbacks.
 * @returns Composed AI Assistant settings UI.
 */
export function SettingsPage({
  SectionWrapper = DefaultSectionWrapper,
  SettingsTable = DefaultSettingsTable,
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
  proactiveDiagnosisEnabled = false,
  onProactiveDiagnosisChange,
  isTestMode,
  onTestModeChange,
  hasShownConfigPopover,
  onResetPopover,
  devOptions,
  onDevOptionsChange,
}: SettingsPageProps) {
  const { t } = useTranslation();
  const settingsId = React.useId();
  const normalizedSavedConfigs = React.useMemo(
    () => getSavedConfigurations(savedConfigs),
    [savedConfigs]
  );
  const [activeConfiguration, setActiveConfiguration] = React.useState<ActiveConfiguration>(() =>
    resolveActiveConfiguration(normalizedSavedConfigs)
  );
  const previousDefaultConfigId = React.useRef(getActiveConfig(normalizedSavedConfigs)?.id);
  const pendingLocalEcho = React.useRef<{
    configId?: string;
    defaultConfigId?: string;
    providerIds: string[];
  }>();

  React.useEffect(() => {
    const incomingDefaultConfigId = getActiveConfig(normalizedSavedConfigs)?.id;
    const defaultChanged = previousDefaultConfigId.current !== incomingDefaultConfigId;
    previousDefaultConfigId.current = incomingDefaultConfigId;
    setActiveConfiguration(current => {
      const currentStillExists = normalizedSavedConfigs.providers?.find(
        provider => provider.id === current.configId
      );
      const pendingEcho = pendingLocalEcho.current;
      const isLocalEcho = Boolean(
        pendingEcho !== undefined &&
          pendingEcho.configId === current.configId &&
          pendingEcho.defaultConfigId === incomingDefaultConfigId &&
          pendingEcho.providerIds.length === (normalizedSavedConfigs.providers?.length ?? 0) &&
          pendingEcho.providerIds.every(
            (id, index) => normalizedSavedConfigs.providers?.[index].id === id
          )
      );
      pendingLocalEcho.current = undefined;
      if (defaultChanged && !isLocalEcho) {
        return resolveActiveConfiguration(normalizedSavedConfigs);
      }
      return currentStillExists
        ? {
            configId: currentStillExists.id,
            providerId: currentStillExists.providerId,
            config: { ...currentStillExists.config },
            displayName: currentStillExists.displayName || '',
          }
        : resolveActiveConfiguration(normalizedSavedConfigs);
    });
  }, [normalizedSavedConfigs]);

  // CLI-based provider auto-detection relies on running local `gh`/`az`
  // commands via runCommand, which only works in the desktop app. Hide the
  // auto-detect button and results dialog unless the desktop runner is ready.
  const cliDetectionEnabled =
    isRunningAsApp && commandRunner !== null && commandRunner !== undefined;

  // Auto-detect hook
  const autoDetect = useAutoDetect({
    savedConfigs,
    onConfigsChange,
    onActiveConfigChange: setActiveConfiguration,
    commandRunner,
    dismissedProviders,
    onDismissProviders,
  });

  /**
   * Applies model-selector changes and persists an updated saved collection when supplied.
   *
   * @param changes - Active configuration and optional saved configurations.
   * @returns No value.
   */
  const handleModelSelectorChange = (changes: {
    configId?: string;
    providerId: string;
    config: ProviderSettings;
    displayName: string;
    savedConfigs?: SavedConfigurations;
  }): void => {
    if (changes.savedConfigs) {
      const normalizedChanges = getSavedConfigurations(changes.savedConfigs);
      pendingLocalEcho.current = {
        configId: changes.configId,
        defaultConfigId: getActiveConfig(normalizedChanges)?.id,
        providerIds: normalizedChanges.providers?.map(provider => provider.id ?? '') ?? [],
      };
    }
    setActiveConfiguration({
      configId: changes.configId,
      providerId: changes.providerId,
      config: changes.config,
      displayName: changes.displayName,
    });

    if (changes.savedConfigs) {
      onConfigsChange(changes.savedConfigs);
    }
  };

  return (
    <Box width="100%" sx={{ pt: 2 }}>
      <Alert severity="warning" sx={{ mb: 3 }}>
        {t('The AI assistant is in preview. AI provider usage may incur costs.')}
      </Alert>
      <ModelSelector
        selectedConfigId={activeConfiguration.configId}
        selectedProvider={activeConfiguration.providerId}
        config={activeConfiguration.config}
        savedConfigs={normalizedSavedConfigs}
        configName={activeConfiguration.displayName}
        isConfigView
        onChange={handleModelSelectorChange}
        onTermsAccept={onTermsAccept ?? onConfigsChange}
        onAutoDetect={cliDetectionEnabled ? autoDetect.handleAutoDetect : undefined}
        autoDetecting={autoDetect.autoDetecting}
        commandRunner={cliDetectionEnabled ? commandRunner ?? undefined : undefined}
        SectionWrapper={SectionWrapper}
      />
      {cliDetectionEnabled && (
        <AutoDetectProvider
          detectedProviders={autoDetect.detectedProviders}
          showDetectedDialog={autoDetect.showDetectedDialog}
          setShowDetectedDialog={autoDetect.setShowDetectedDialog}
          handleAddDetectedProviders={autoDetect.handleAddDetectedProviders}
          handleDismissDetectedProviders={autoDetect.handleDismissDetectedProviders}
          addingProviders={autoDetect.addingProviders}
          addError={autoDetect.addError}
        />
      )}

      {(onPreviewChange || onProactiveDiagnosisChange) && (
        <SectionWrapper title={t('Features')}>
          <SettingsTable
            rows={[
              ...(onPreviewChange
                ? [
                    {
                      name: (
                        <Box>
                          <Typography id={`${settingsId}-preview-label`}>
                            {t('Preview Features')}
                          </Typography>
                          <Typography
                            id={`${settingsId}-preview-description`}
                            variant="body2"
                            color="text.secondary"
                          >
                            {t(
                              'Enable preview features including the AI assistant button in the app bar'
                            )}
                          </Typography>
                        </Box>
                      ),
                      value: (
                        <Switch
                          checked={previewEnabled ?? true}
                          onChange={event => onPreviewChange(event.target.checked)}
                          inputProps={{
                            'aria-labelledby': `${settingsId}-preview-label`,
                            'aria-describedby': `${settingsId}-preview-description`,
                          }}
                        />
                      ),
                    },
                  ]
                : []),
              ...(onProactiveDiagnosisChange
                ? [
                    {
                      name: (
                        <Box>
                          <Typography id={`${settingsId}-diagnosis-label`}>
                            {t('Proactive Diagnosis (preview)')}
                          </Typography>
                          <Typography
                            id={`${settingsId}-diagnosis-description`}
                            variant="body2"
                            color="text.secondary"
                          >
                            {t('Periodically diagnose warning and error events with AI')}
                          </Typography>
                        </Box>
                      ),
                      value: (
                        <Switch
                          checked={proactiveDiagnosisEnabled}
                          onChange={event => onProactiveDiagnosisChange(event.target.checked)}
                          inputProps={{
                            'aria-labelledby': `${settingsId}-diagnosis-label`,
                            'aria-describedby': `${settingsId}-diagnosis-description`,
                          }}
                        />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </SectionWrapper>
      )}
      {tools && isToolEnabledFn && onToolToggle && (
        <AIToolsSettings
          tools={tools}
          isToolEnabled={isToolEnabledFn}
          onToolToggle={onToolToggle}
          SectionWrapper={SectionWrapper}
          SettingsTable={SettingsTable}
        />
      )}
      <MCPSettings
        isRunningAsApp={isRunningAsApp}
        configStore={configStore}
        SectionWrapper={SectionWrapper}
        SettingsTable={SettingsTable}
      />
      <SkillSettings
        configStore={configStore}
        checkPathExists={checkPathExists}
        projectRoot={projectRoot}
        isRunningAsApp={isRunningAsApp}
        filesystemSkillsEnabled={false}
        loadSkills={loadSkills}
        onSkillsLoadComplete={onSkillsLoadComplete}
        SectionWrapper={SectionWrapper}
      />
      {onHolmesConfigChange && (
        <HolmesAgentSettings
          config={savedConfigs}
          onConfigChange={onHolmesConfigChange}
          defaultNamespace={defaultHolmesNamespace}
          defaultServiceName={defaultHolmesServiceName}
          defaultPort={defaultHolmesPort}
          SectionWrapper={SectionWrapper}
        />
      )}
      {(onTestModeChange || (devOptions && onDevOptionsChange)) && (
        <Accordion
          disableGutters
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}
        >
          <AccordionSummary
            id={`${settingsId}-advanced-header`}
            aria-controls={`${settingsId}-advanced-content`}
            expandIcon={<Icon icon="mdi:chevron-down" aria-hidden="true" />}
          >
            <Box
              sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, minWidth: 0 }}
            >
              <Typography component="h2" variant="h6">
                {t('Advanced')}
              </Typography>
              {isTestMode && <Chip size="small" color="warning" label={t('Test mode enabled')} />}
              {Object.values(devOptions ?? {}).some(value => value === true) && (
                <Chip size="small" color="warning" label={t('Developer overrides enabled')} />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {onTestModeChange && (
              <SettingsTable
                rows={[
                  {
                    name: (
                      <Box>
                        <Typography id={`${settingsId}-test-label`}>{t('Test Mode')}</Typography>
                        <Typography
                          id={`${settingsId}-test-description`}
                          variant="body2"
                          color="text.secondary"
                        >
                          {t(
                            'Enable test mode to manually input AI responses and see how they render in the chat window'
                          )}
                        </Typography>
                      </Box>
                    ),
                    value: (
                      <Switch
                        checked={Boolean(isTestMode)}
                        onChange={event => onTestModeChange(event.target.checked)}
                        inputProps={{
                          'aria-labelledby': `${settingsId}-test-label`,
                          'aria-describedby': `${settingsId}-test-description`,
                        }}
                      />
                    ),
                  },
                  ...(onResetPopover
                    ? [
                        {
                          name: (
                            <Box>
                              <Typography>{t('Configuration Popover')}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {hasShownConfigPopover
                                  ? t('The configuration popover has been shown and dismissed')
                                  : t(
                                      'The configuration popover will show when no AI providers are configured'
                                    )}
                              </Typography>
                            </Box>
                          ),
                          value: (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={onResetPopover}
                              disabled={!hasShownConfigPopover}
                            >
                              {t('Reset')}
                            </Button>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            )}
            {devOptions && onDevOptionsChange && (
              <Box sx={{ mt: onTestModeChange ? 3 : 0 }}>
                <DeveloperSettings
                  devOptions={devOptions}
                  onDevOptionsChange={onDevOptionsChange}
                  savedConfigs={normalizedSavedConfigs}
                  onConfigsChange={onConfigsChange}
                  collapsible={false}
                />
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}

export default SettingsPage;
