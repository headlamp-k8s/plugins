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

import { getHolmesProxyBaseUrl, HolmesAgent } from '@headlamp-k8s/ai-common/agents/holmes/client';
import { MockHolmesAgent } from '@headlamp-k8s/ai-common/agents/holmes/MockHolmesAgent';
import AssistantSession from '@headlamp-k8s/ai-common/assistant/AssistantSession';
import LangChainAssistantSession from '@headlamp-k8s/ai-common/assistant/LangChainAssistantSession';
import type { ConversationMessage } from '@headlamp-k8s/ai-common/conversation/types';
import { getProviderById } from '@headlamp-k8s/ai-common/providers/catalog';
import {
  createFetchHttpClient,
  createNoopFileSystem,
} from '@headlamp-k8s/ai-common/skills/adapters/browser';
import { getSkillsConfig } from '@headlamp-k8s/ai-common/skills/config';
import { SkillManager } from '@headlamp-k8s/ai-common/skills/SkillManager';
import { inlineToolApprovalManager } from '@headlamp-k8s/ai-common/tools/approval/InlineToolApprovalManager';
import { createMockApprovalManager } from '@headlamp-k8s/ai-common/tools/approval/testing/MockApprovalManager';
import { createMockKubernetesToolManager } from '@headlamp-k8s/ai-common/tools/testing/MockToolManager';
import AIAssistantHeader from '@headlamp-k8s/ai-ui/components/assistant/AIAssistantHeader';
import type { ChatMode } from '@headlamp-k8s/ai-ui/components/assistant/AllInputSection';
import HolmesSetupGuide from '@headlamp-k8s/ai-ui/components/assistant/HolmesSetupGuide';
import { PromptSuggestions } from '@headlamp-k8s/ai-ui/components/assistant/PromptSuggestions';
import ApiConfirmationDialog from '@headlamp-k8s/ai-ui/components/common/ApiConfirmationDialog';
import {
  getProviderModels,
  parseSuggestionsFromResponse,
} from '@headlamp-k8s/ai-ui/providers/modelProviders';
import { isTestModeCheck } from '@headlamp-k8s/ai-ui/testing/testMode';
import { Icon } from '@iconify/react';
import { runCommand, useTranslation } from '@kinvolk/headlamp-plugin/lib';

// pluginRunCommand is injected as a scope variable by Headlamp's plugin runner.
declare const pluginRunCommand: typeof runCommand;
import ProactiveDiagnosisSection from '@headlamp-k8s/ai-ui/components/assistant/ProactiveDiagnosisSection';
import {
  type DiagnosisStepCallback,
  ProactiveDiagnosisManager,
  proactiveDiagnosisManager,
} from '@headlamp-k8s/ai-ui/diagnosis/ProactiveDiagnosisManager';
import { useProactiveDiagnosis } from '@headlamp-k8s/ai-ui/hooks/useProactiveDiagnosis';
import { useClustersConf, useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster, getClusterGroup } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Button, Grid, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import AIChatContent from './components/assistant/AIChatContent';
import { AIInputSection } from './components/assistant/AllInputSection';
import ContentRenderer from './ContentRenderer';
import { generateContextDescription } from './context/contextGenerator';
import EditorDialog from './editordialog';
import { checkHolmesAgentHealth } from './holmesClient';
import { HolmesHealthRequestGate } from './holmesHealthRequestGate';
import { useKubernetesToolUI } from './hooks/useKubernetesToolUI';
import { fetchClusterWarnings, fetchWarningEventsForClusters } from './kubernetes/EventFetcher';
import { getSettingsURL, type PluginConfig, useGlobalState } from './pluginState';
import { useDynamicPrompts } from './prompts/promptGenerator';
import { resolveRuntimeProviderConfig } from './resolveRuntimeProviderConfig';

// Operation type constants for translation
const OPERATION_TYPES = {
  CREATION: 'creation',
  UPDATE: 'update',
  DELETION: 'deletion',
  GENERIC: 'operation',
} as const;
import {
  type CommandRunner,
  refreshAzureOpenAIKey,
  refreshGitHubToken,
} from '@headlamp-k8s/ai-common/providers/detectProvider';
import {
  getActiveConfig,
  getSavedConfigurations,
  isSameStoredConfig,
  type ProviderSettings,
  StoredProviderConfig,
} from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { getEnabledToolIds } from '@headlamp-k8s/ai-common/tools/settings/enabledTools';
import { usePromptWidth } from '@headlamp-k8s/ai-ui/contexts/PromptWidthContext';

interface CommandProcess {
  /** Standard output stream emitted by the injected command. */
  stdout: {
    /** Registers a listener for command output chunks. */
    on: (event: 'data', listener: (chunk: unknown) => void) => void;
  };
  /** Registers a listener for process exit. */
  on: (event: 'exit', listener: (code: number | null) => void) => void;
}

interface HolmesTextEvent {
  /** Streamed message identifier. */
  messageId?: string;
  /** Streamed text delta. */
  delta?: string;
}

interface HolmesToolEvent {
  /** Tool call identifier. */
  toolCallId?: string;
  /** Tool display name. */
  toolCallName?: string;
}

type PluginCommandRunner = (
  command: string,
  args: string[],
  options: Record<string, unknown>
) => CommandProcess;

export default function AIPrompt(props: {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  pluginSettings: PluginConfig;
  width?: string;
}) {
  const { openPopup, setOpenPopup, pluginSettings, width } = props;
  const history = useHistory();
  const location = useLocation();
  const rootRef = React.useRef(null);
  // Command runner for CLI-based provider detection (wired to pluginRunCommand if available)
  const commandRunnerRef = React.useRef<CommandRunner | null>(null);
  React.useEffect(() => {
    if (typeof pluginRunCommand !== 'undefined') {
      commandRunnerRef.current = (command: string, args: string[]) =>
        new Promise<{ stdout: string; exitCode: number }>(resolve => {
          const proc = (pluginRunCommand as unknown as PluginCommandRunner)(command, args, {});
          let out = '';
          proc.stdout.on('data', chunk => (out += String(chunk)));
          proc.on('exit', (code: number | null) => resolve({ stdout: out, exitCode: code ?? -1 }));
        });
    }
  }, []);

  const resolveCliSentinels = React.useCallback(
    (config: Readonly<ProviderSettings>): Promise<ProviderSettings> =>
      resolveRuntimeProviderConfig(config, {
        commandRunner: commandRunnerRef.current,
        refreshGitHubToken,
        refreshAzureOpenAIKey,
      }),
    []
  );

  const [promptVal, setPromptVal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);
  const [aiManager, setAiManager] = React.useState<AssistantSession | null>(null);
  const _pluginSetting = useGlobalState();
  // TODO: enabledTools, setEnabledTools are not in _pluginSetting anymore??
  // const { enabledTools, setEnabledTools } = _pluginSetting;
  const [enabledTools, setEnabledTools] = React.useState<string[]>([]);
  const [promptHistory, setPromptHistory] = React.useState<ConversationMessage[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const selectedClusters = useSelectedClusters();
  const clusters = useClustersConf() || {};
  const dynamicPrompts = useDynamicPrompts();
  const prompWidthContext = usePromptWidth();
  const { t } = useTranslation();
  const proactiveDiagnosisEnabled = pluginSettings.proactiveDiagnosisEnabled === true;

  // Proactive diagnosis UI state
  const { diagnoses, isCycleRunning, scrollToEventUid, clearScrollTarget } =
    useProactiveDiagnosis();

  // Chat/agent mode state
  const [chatMode, setChatMode] = React.useState<ChatMode>('chat');

  useEffect(() => {
    if (width) {
      prompWidthContext.setPromptWidth(width);
    }
  }, [width]);

  // Get cluster names for warning lookup - use selected clusters or current cluster only
  const clusterNames = useMemo(() => {
    const currentCluster = getCluster();

    // If there are selected clusters, use those
    if (selectedClusters && selectedClusters.length > 0) {
      return selectedClusters;
    }

    // Otherwise, use only the current cluster
    if (currentCluster) {
      return [currentCluster];
    }

    return Object.keys(clusters);
  }, [selectedClusters, clusters]);

  // Keep a ref to clusterNames so the async proactive cycle can access the
  // latest value without forcing the useCallback to re-create.
  const clusterNamesRef = useRef(clusterNames);
  clusterNamesRef.current = clusterNames;

  // Fetch cluster warnings on-demand for context generation (replaces
  // the continuous useClusterWarnings hook).
  const clusterWarningsRef = useRef<Record<string, { warnings: any[]; error?: Error | null }>>({});

  // ─── Proactive Diagnosis ────────────────────────────────────────────
  // Wire the proactive diagnosis manager to the agent or AI manager.
  // It runs a diagnosis cycle on-demand (with a 20-min cooldown) on the
  // top 3 warning/error events fetched via a one-shot API call.
  const proactiveDiagIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Dedicated HolmesAgent for proactive diagnosis — one instance, reused sequentially.
  const diagnosisAgentRef = useRef<HolmesAgent | MockHolmesAgent | null>(null);

  // Build a stable diagnose function that uses the current agent or AI manager.
  // This function is passed to the proactive diagnosis manager so it can call
  // the AI without blocking the user's chat.
  const diagnoseFnRef = useRef<((prompt: string) => Promise<string>) | null>(null);
  // Track whether the diagnose function is ready (agent or AI manager available)
  const [diagnoseFnReady, setDiagnoseFnReady] = useState(false);
  // Track whether proactive diagnosis is currently running (blocks chat input)
  const [isDiagnosisRunning, setIsDiagnosisRunning] = useState(
    proactiveDiagnosisManager.isRunning()
  );

  // Subscribe to diagnosis cycle events so we can block chat
  useEffect(() => {
    const handleCycleStart = () => setIsDiagnosisRunning(true);
    const handleCycleEnd = () => setIsDiagnosisRunning(false);
    proactiveDiagnosisManager.on('cycle-start', handleCycleStart);
    proactiveDiagnosisManager.on('cycle-end', handleCycleEnd);
    return () => {
      proactiveDiagnosisManager.removeListener('cycle-start', handleCycleStart);
      proactiveDiagnosisManager.removeListener('cycle-end', handleCycleEnd);
    };
  }, []);

  // We'll update diagnoseFnRef after the agent/aiManager are set up (further below).
  // For now, set up the periodic trigger that runs every 5 minutes.

  // Use refs for loading/isDiagnosisRunning so runProactiveCycle stays
  // referentially stable and doesn't cause the scheduling effect to re-run.
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const isDiagnosisRunningRef = useRef(isDiagnosisRunning);
  isDiagnosisRunningRef.current = isDiagnosisRunning;
  const proactiveDiagnosisEnabledRef = useRef(proactiveDiagnosisEnabled);
  proactiveDiagnosisEnabledRef.current = proactiveDiagnosisEnabled;

  const runProactiveCycle = useCallback(async () => {
    if (!proactiveDiagnosisEnabledRef.current) return;
    if (!diagnoseFnRef.current) return; // Don't run if no AI is available yet
    if (loadingRef.current || isDiagnosisRunningRef.current) return; // Don't run while user is chatting or another diagnosis is running

    // Fetch events on-demand (one-shot API call — no continuous watch)
    const clusters = clusterNamesRef.current;
    if (!clusters || clusters.length === 0) return;

    try {
      const allWarningEvents = await fetchWarningEventsForClusters(clusters);
      if (!proactiveDiagnosisEnabledRef.current) return;
      if (allWarningEvents.length === 0) return;

      const topEvents = ProactiveDiagnosisManager.extractTopEvents(allWarningEvents, 3);
      if (topEvents.length > 0) {
        await proactiveDiagnosisManager.diagnoseEvents(topEvents);
      }
    } catch (err) {
      console.error('[ProactiveDiagnosis] Cycle error:', err);
    }
  }, []); // stable — reads current values via refs

  // Start/restart the interval whenever diagnoseFn becomes ready.
  // After a cycle completes, wait 20 minutes before the next one.
  const lastCycleEndRef = useRef<number>(0);
  const initialCycleRanRef = useRef(false);
  const DIAGNOSIS_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes

  useEffect(() => {
    if (!proactiveDiagnosisEnabled) {
      proactiveDiagnosisManager.stop();
      proactiveDiagnosisManager.setDiagnoseFn(null);
      proactiveDiagnosisManager.clearCache();
      diagnoseFnRef.current = null;
      setDiagnoseFnReady(false);
      initialCycleRanRef.current = false;
      if (proactiveDiagIntervalRef.current) {
        clearInterval(proactiveDiagIntervalRef.current);
        proactiveDiagIntervalRef.current = null;
      }
      return;
    }

    proactiveDiagnosisManager.start();

    // Don't start until the diagnose function is available
    if (!diagnoseFnReady) return;

    // Clear any existing interval
    if (proactiveDiagIntervalRef.current) {
      clearInterval(proactiveDiagIntervalRef.current);
    }

    // Track when a diagnosis cycle ends so we can enforce the cooldown
    const handleCycleEnd = () => {
      lastCycleEndRef.current = Date.now();
    };
    proactiveDiagnosisManager.on('cycle-end', handleCycleEnd);

    // Run the first cycle only once after a short delay to let events load
    let initialTimer: ReturnType<typeof setTimeout> | null = null;
    if (!initialCycleRanRef.current) {
      initialCycleRanRef.current = true;
      initialTimer = setTimeout(() => {
        console.log('[ProactiveDiagnosis] Running initial diagnosis cycle');
        runProactiveCycle();
      }, 3_000); // 3 seconds — agent is already connected
    }

    // Poll every minute but only actually run if the cooldown has elapsed
    proactiveDiagIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastCycleEndRef.current;
      if (lastCycleEndRef.current === 0 || elapsed >= DIAGNOSIS_COOLDOWN_MS) {
        console.log('[ProactiveDiagnosis] Running scheduled diagnosis cycle');
        runProactiveCycle();
      }
    }, 60 * 1000); // check every minute

    return () => {
      if (initialTimer) clearTimeout(initialTimer);
      if (proactiveDiagIntervalRef.current) {
        clearInterval(proactiveDiagIntervalRef.current);
      }
      proactiveDiagnosisManager.removeListener('cycle-end', handleCycleEnd);
    };
  }, [diagnoseFnReady, proactiveDiagnosisEnabled, runProactiveCycle]);
  // ─── End Proactive Diagnosis Setup ──────────────────────────────────

  const [activeConfig, setActiveConfig] = useState<StoredProviderConfig | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<StoredProviderConfig[]>([]);

  // Test mode detection
  const isTestMode = isTestModeCheck() || pluginSettings?.testMode === true;

  // Agent mode state — default to chat mode; agent mode is only enabled
  // explicitly by the user or when Holmes is confirmed available.
  const [isAgentMode, setIsAgentMode] = React.useState(false);

  const [agentModeStatus, setAgentModeStatus] = React.useState<
    'idle' | 'checking' | 'found' | 'not-found'
  >('idle');
  const holmesAgentRef = React.useRef<HolmesAgent | MockHolmesAgent | null>(null);

  // When the user opts into Holmes but it is not reachable, show setup guidance
  // instead of silently failing.
  const [showHolmesSetup, setShowHolmesSetup] = React.useState(false);
  const [isHolmesRetrying, setIsHolmesRetrying] = React.useState(false);
  const holmesHealthRequestGateRef = React.useRef(new HolmesHealthRequestGate());

  const [showEditor, setShowEditor] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState('');
  const [editorTitle, setEditorTitle] = React.useState('');
  const [resourceType, setResourceType] = React.useState('');
  const [isDelete, setIsDelete] = React.useState(false);

  const handleYamlAction = React.useCallback(
    (yaml: string, title: string, type: string, isDeleteOp: boolean) => {
      // If the title suggests this is a sample/example, don't allow deletion
      const isSampleYaml =
        title.toLowerCase().includes('sample') ||
        title.toLowerCase().includes('example') ||
        title.toLowerCase().includes('view');

      // Force isDelete to false for sample YAMLs
      const actualDelete = isSampleYaml ? false : isDeleteOp;

      // Update the title if needed
      let finalTitle = title;
      if (
        isSampleYaml &&
        !finalTitle.toLowerCase().startsWith('view') &&
        !finalTitle.toLowerCase().startsWith('sample')
      ) {
        finalTitle = t('View {{title}}', { title });
      } else if (actualDelete) {
        finalTitle = t('Delete {{kind}}', { kind: type });
      } else if (!isSampleYaml && !actualDelete) {
        finalTitle = t('Apply {{resourceType}}', { resourceType: type });
      }

      setEditorContent(yaml);
      setEditorTitle(finalTitle);
      setResourceType(type);
      setIsDelete(actualDelete);
      setShowEditor(true);
    },
    [t]
  );

  // Initialize active configuration from plugin settings
  useEffect(() => {
    // If we already have an active config, no need to reinitialize
    if (activeConfig) return;
    if (!pluginSettings) return;

    const savedConfigs = getSavedConfigurations(pluginSettings);
    setAvailableConfigs(savedConfigs.providers || []);

    // Always try to get the default provider first
    const active = getActiveConfig(savedConfigs);

    if (active) {
      setActiveConfig(active);
      // Set the default model for the active provider
      const defaultModel = resolveSelectedModel(active);
      setSelectedModel(defaultModel);

      // Update global state with all providers and active one
      _pluginSetting.setSavedProviders(savedConfigs.providers || []);
      _pluginSetting.setActiveProvider(active);
    }
  }, [pluginSettings]);

  // React to configuration changes (like provider deletion)
  useEffect(() => {
    if (!pluginSettings) return;

    const savedConfigs = getSavedConfigurations(pluginSettings);
    const newProviders = savedConfigs.providers || [];

    // Update available configs
    setAvailableConfigs(newProviders);

    // Check if the current active config still exists
    if (activeConfig) {
      const stillExists = newProviders.find(p => isSameStoredConfig(p, activeConfig));

      if (!stillExists) {
        // Active provider was deleted, switch to a new one or clear
        const newActive = getActiveConfig(savedConfigs);

        if (newActive) {
          // Switch to the new default provider
          setActiveConfig(newActive);
          _pluginSetting.setActiveProvider(newActive);

          // Set the default model for the new provider
          const defaultModel = resolveSelectedModel(newActive);
          setSelectedModel(defaultModel);

          // Clear history and show provider change message
          setPromptHistory([]);
          setPromptVal('');
          setApiError(null);

          if (aiManager) {
            aiManager.reset();
            setAiManager(null);
          }

          const providerName =
            newActive.displayName ||
            getProviderById(newActive.providerId)?.name ||
            newActive.providerId;

          setTimeout(() => {
            setPromptHistory([
              {
                role: 'system',
                content: t('Previous provider was removed. Switched to {{providerName}}.', {
                  providerName,
                }),
              },
            ]);
          }, 100);
        } else {
          // No providers available, clear everything
          setActiveConfig(null);
          setSelectedModel('default');
          setPromptHistory([]);
          setPromptVal('');
          setApiError(null);

          if (aiManager) {
            aiManager.reset();
            setAiManager(null);
          }
        }
      }
    }
  }, [pluginSettings, activeConfig, aiManager]);

  // Handle changing the active configuration
  const [selectedModel, setSelectedModel] = useState<string>('default');

  const resolveSelectedModel = (config: StoredProviderConfig, explicitModel?: string) => {
    if (explicitModel && explicitModel.trim().length > 0) {
      return explicitModel;
    }

    const savedModel = config.config?.model;
    if (savedModel && savedModel.trim().length > 0) {
      return savedModel;
    }

    const providerModels = getProviderModels(config);
    return providerModels[0] || 'default';
  };

  const handleChangeConfig = (config: StoredProviderConfig, model?: string) => {
    if (!config) return;

    const resolvedModel = resolveSelectedModel(config, model);

    if (
      !activeConfig ||
      !isSameStoredConfig(activeConfig, config) ||
      JSON.stringify(activeConfig.config) !== JSON.stringify(config.config) ||
      selectedModel !== resolvedModel
    ) {
      setApiError(null);
      setActiveConfig(config);
      setSelectedModel(resolvedModel);
      _pluginSetting.setActiveProvider(config);
      if (aiManager) {
        aiManager.reset();
        setAiManager(null);
        setTimeout(() => {
          const providerName =
            config.displayName || getProviderById(config.providerId)?.name || config.providerId;
          setPromptHistory(prev => [
            ...prev,
            {
              role: 'system',
              content: t('Switched to {{providerName}}{{modelSuffix}}.', {
                providerName,
                modelSuffix: resolvedModel ? ` / ${resolvedModel}` : '',
              }),
            },
          ]);
        }, 100);
      } else {
        const providerName =
          config.displayName || getProviderById(config.providerId)?.name || config.providerId;
        setPromptHistory(prev => [
          ...prev,
          {
            role: 'system',
            content: t('Using {{providerName}}{{modelSuffix}}.', {
              providerName,
              modelSuffix: resolvedModel ? ` / ${resolvedModel}` : '',
            }),
          },
        ]);
      }
    }
  };

  // Track MCP config to trigger manager recreation when MCP servers change
  const mcpConfigKey = React.useMemo(() => {
    try {
      return JSON.stringify(pluginSettings?.mcpConfig || {});
    } catch {
      return '';
    }
  }, [pluginSettings?.mcpConfig]);

  React.useEffect(() => {
    // Recreate the manager whenever pluginSettings change (including tool settings)
    // or when activeConfig/selectedModel/mcpConfig changes
    let isCurrent = true;

    if (!activeConfig)
      return () => {
        isCurrent = false;
      };

    async function initManager() {
      try {
        // Create config with selected model, resolving any CLI sentinel tokens
        // to real credentials before the model is created.
        const configWithModel = await resolveCliSentinels({
          ...activeConfig!.config,
          model: selectedModel,
        });

        if (!isCurrent) return;

        const newManager = new LangChainAssistantSession(
          activeConfig!.providerId,
          configWithModel,
          enabledTools,
          pluginSettings?.devOptions?.enableMockTools
            ? { toolManager: createMockKubernetesToolManager() }
            : undefined
        );
        setAiManager(newManager);
      } catch (error: unknown) {
        if (isCurrent) {
          const message = error instanceof Error ? error.message : String(error);
          setApiError(`Failed to initialize AI model: ${message}`);
        }
      }
    }

    initManager();

    return () => {
      isCurrent = false;
    };
  }, [
    enabledTools,
    activeConfig,
    selectedModel,
    mcpConfigKey,
    pluginSettings?.devOptions?.enableMockTools,
  ]);

  // ─── Wire up SkillManager for prompt skill injection ──────────────────────
  // Creates a SkillManager with browser-compatible adapters (fetch + JSZip).
  // Works in both browser and desktop/CLI: browser uses fetch for GitHub repos,
  // desktop can also load from local filesystem directories.
  const skillManagerRef = React.useRef<SkillManager | null>(null);
  React.useEffect(() => {
    if (!aiManager || !(aiManager instanceof LangChainAssistantSession)) return;

    const skillsConfig = getSkillsConfig(pluginSettings);
    if (skillsConfig.sources.length === 0) {
      aiManager.setSkillManager(null, skillsConfig);
      return;
    }

    // Reuse existing SkillManager instance to preserve its in-memory cache
    if (!skillManagerRef.current) {
      skillManagerRef.current = new SkillManager(createNoopFileSystem(), createFetchHttpClient());
    }
    (aiManager as LangChainAssistantSession).setSkillManager(skillManagerRef.current, skillsConfig);
  }, [aiManager, pluginSettings]);

  React.useEffect(() => {
    // Only set if different
    setEnabledTools(currentlyEnabledTools => {
      const newEnabledTools = getEnabledToolIds(pluginSettings);
      if (isEqual(currentlyEnabledTools, newEnabledTools)) {
        return currentlyEnabledTools;
      }
      return newEnabledTools;
    });
  }, [pluginSettings]);

  // ─── Connect AI manager to proactive diagnosis (fallback for non-agent mode) ──
  // When not in agent mode but an AI config is available, use a LangChain session as fallback.
  // In agent mode, the diagnoseFn is already set by handleToggleAgentMode above.
  useEffect(() => {
    let diagnosisGeneration = 0;
    // Only set the LangChain fallback if agent mode is NOT active
    if (proactiveDiagnosisEnabled && !isAgentMode && activeConfig) {
      const generation = ++diagnosisGeneration;
      const diagnoseFn = async (
        prompt: string,
        onStep?: DiagnosisStepCallback
      ): Promise<string> => {
        try {
          const configWithModel = await resolveCliSentinels({
            ...activeConfig.config,
            model: selectedModel,
          });
          if (generation !== diagnosisGeneration) {
            throw new Error('Diagnosis provider configuration changed during credential refresh.');
          }
          // Create an isolated manager instance for this single diagnosis
          const isolatedManager = new LangChainAssistantSession(
            activeConfig.providerId,
            configWithModel,
            enabledTools,
            pluginSettings?.devOptions?.enableMockTools
              ? { toolManager: createMockKubernetesToolManager() }
              : undefined
          );
          // LangChain doesn't stream intermediate events, so just report start/end
          onStep?.({
            id: `lc-start-${Date.now()}`,
            content: t('Sending diagnosis request…'),
            type: 'intermediate-text',
            timestamp: Date.now(),
          });
          const response = await isolatedManager.userSend(prompt);
          onStep?.({
            id: `lc-done-${Date.now()}`,
            content: t('Diagnosis response received'),
            type: 'tool-result',
            timestamp: Date.now(),
          });
          return response.content || t('No diagnosis available.');
        } catch (err: unknown) {
          console.error('[ProactiveDiagnosis] diagnoseFn error:', err);
          throw err;
        }
      };
      diagnoseFnRef.current = diagnoseFn;
      proactiveDiagnosisManager.setDiagnoseFn(diagnoseFn);
      setDiagnoseFnReady(true);
    } else if (!isAgentMode) {
      // No agent and no AI config — clear
      diagnoseFnRef.current = null;
      proactiveDiagnosisManager.setDiagnoseFn(null);
      setDiagnoseFnReady(false);
    }
    // If isAgentMode is true, diagnoseFn is managed by handleToggleAgentMode — don't touch it.
    return () => {
      diagnosisGeneration += 1;
    };
  }, [
    proactiveDiagnosisEnabled,
    isAgentMode,
    activeConfig,
    selectedModel,
    enabledTools,
    pluginSettings,
    t,
  ]);
  // ─── End proactive diagnosis connection ─────────────────────────────

  const updateHistory = React.useCallback(() => {
    if (!aiManager?.history) {
      setPromptHistory([]);
      return;
    }
    // Process the history to extract suggestions and clean content
    const processedHistory = aiManager.history.map((prompt, index) => {
      if (prompt.role === 'assistant' && prompt.content && !prompt.error) {
        const { cleanContent, suggestions } = parseSuggestionsFromResponse(prompt.content);

        // Update suggestions if this is the latest assistant response
        if (index === aiManager.history.length - 1 && suggestions.length > 0) {
          setSuggestions(suggestions);
        }

        // Return the prompt with cleaned content (without the SUGGESTIONS line)
        return {
          ...prompt,
          content: cleanContent,
        };
      }
      return prompt;
    });

    setPromptHistory(processedHistory);
  }, [aiManager?.history]);

  // Use the Kubernetes tool UI hook (must be after updateHistory is defined)
  const { state: kubernetesUI, callbacks: kubernetesCallbacks } = useKubernetesToolUI(
    updateHistory,
    t
  );

  // Set up event listeners for tool confirmation events
  React.useEffect(() => {
    const handleRequestConfirmation = () => {
      // Clear loading state when tool approval is requested
      setLoading(false);
      // Force an immediate update of the history from the AI manager
      updateHistory();
      // Also force a re-render by updating the state
      setPromptHistory(prev => [...prev]);
    };

    const handleUpdateConfirmation = () => {
      updateHistory();
      setPromptHistory(prev => [...prev]);
    };

    const handleMessageUpdated = () => {
      updateHistory();
      setPromptHistory(prev => [...prev]);
    };

    inlineToolApprovalManager.on('request-confirmation', handleRequestConfirmation);
    inlineToolApprovalManager.on('update-confirmation', handleUpdateConfirmation);
    inlineToolApprovalManager.on('message-updated', handleMessageUpdated);

    return () => {
      inlineToolApprovalManager.removeListener('request-confirmation', handleRequestConfirmation);
      inlineToolApprovalManager.removeListener('update-confirmation', handleUpdateConfirmation);
      inlineToolApprovalManager.removeListener('message-updated', handleMessageUpdated);
    };
  }, [updateHistory]);

  // Developer option: auto-approve all tool calls without showing the dialog.
  // Equivalent to the CLI's --auto-approve flag.
  React.useEffect(() => {
    if (pluginSettings?.devOptions?.enableAutoApproval) {
      inlineToolApprovalManager.setApprovalHandler(
        createMockApprovalManager({ mode: 'approve-all' })
      );
    } else {
      // Clear the handler so the normal confirmation dialog is shown again.
      inlineToolApprovalManager.setApprovalHandler(null);
    }
  }, [pluginSettings?.devOptions?.enableAutoApproval]);

  const handleOperationFailure = React.useCallback(
    (
      error: unknown,
      operationType: string,
      resourceInfo?: { kind?: string; name?: string; namespace?: string }
    ) => {
      // Determine the operation type from the error or method
      let operation: string = OPERATION_TYPES.GENERIC;
      if (operationType) {
        switch (operationType.toLowerCase()) {
          case 'post':
            operation = OPERATION_TYPES.CREATION;
            break;
          case 'put':
          case 'patch':
            operation = OPERATION_TYPES.UPDATE;
            break;
          case 'delete':
            operation = OPERATION_TYPES.DELETION;
            break;
          default:
            operation = OPERATION_TYPES.GENERIC;
        }
      }

      // Extract error details
      const errorRecord =
        error && typeof error === 'object' ? (error as Record<string, unknown>) : {};
      const errorMessage =
        (typeof errorRecord.message === 'string' && errorRecord.message) ||
        (typeof errorRecord.error === 'string' && errorRecord.error) ||
        t('Unknown error occurred');
      const statusCode = errorRecord.status ?? errorRecord.statusCode;

      // Build error content
      let errorContent = t('Resource {{operation}} failed: {{errorMessage}}', {
        operation: t(operation),
        errorMessage,
      });

      if (resourceInfo) {
        errorContent += `\n\n${t('Resource Details:')} ${JSON.stringify(
          {
            kind: resourceInfo.kind,
            name: resourceInfo.name,
            namespace: resourceInfo.namespace,
            status: t('Failed'),
            ...(statusCode && { statusCode }),
          },
          null,
          2
        )}`;
      } else if (statusCode) {
        errorContent += `\n\n${t('Status Code: {{statusCode}}', { statusCode })}`;
      }

      const toolPrompt: ConversationMessage = {
        role: 'tool',
        content: errorContent,
        name: 'kubernetes_api_request',
        toolCallId: `${operation}-error-${Date.now()}`,
        error: true,
      };

      if (aiManager) {
        aiManager.history.push(toolPrompt);
        updateHistory();
      }
    },
    [aiManager, t, updateHistory]
  );

  // Function to handle test mode responses
  const handleTestModeResponse = (
    content: string | object,
    type: 'assistant' | 'user',
    hasError?: boolean
  ) => {
    let newPrompt: ConversationMessage;

    // Handle tool confirmation objects
    if (typeof content === 'object' && content && 'toolConfirmation' in content) {
      const confirmation = content as Partial<ConversationMessage>;
      newPrompt = {
        role: type,
        content: confirmation.content || '',
        error: hasError || false,
        toolConfirmation: confirmation.toolConfirmation,
        isDisplayOnly: confirmation.isDisplayOnly,
        requestId: confirmation.requestId,
        ...(hasError && { contentFilterError: true }),
      };
    } else {
      // Handle regular string content
      newPrompt = {
        role: type,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        error: hasError || false,
        ...(hasError && { contentFilterError: true }),
      };
    }

    setPromptHistory(prev => [...prev, newPrompt]);
    setOpenPopup(true);
  };

  async function AnalyzeResourceBasedOnPrompt(prompt: string) {
    setOpenPopup(true);

    if (!aiManager && !isTestMode) {
      setPromptVal(prompt);
      setApiError(t('The AI model is still initializing. Please try again.'));
      return;
    }

    // Always add user message to promptHistory immediately so it shows up right away
    const userPrompt: ConversationMessage = {
      role: 'user',
      content: prompt,
    };
    setPromptHistory(prev => [...prev, userPrompt]);

    // If in test mode, just return after adding the prompt
    if (isTestMode) {
      return;
    }

    setLoading(true);
    try {
      const promptResponse = await aiManager!.userSend(prompt);
      if (promptResponse.error) {
        // Clear the global API error since errors are now handled at the prompt level
        setApiError(null);
      } else {
        // Clear any previous errors
        setApiError(null);
      }

      // Update history from AI manager - this will replace our immediate user message
      // but should include the same user message plus the AI response
      setAiManager(aiManager);
      updateHistory();
    } catch (error) {
      console.error('Error analyzing resource:', error);

      // Don't add error to history if it was an abort error (user stopped the request)
      if (error.name !== 'AbortError') {
        // Add the error as an assistant message in the history
        const errorPrompt: ConversationMessage = {
          role: 'assistant',
          content: t('Error: {{message}}', {
            message: error.message || t('An unknown error occurred'),
          }),
          error: true,
        };

        // Add to history so it appears with the specific request
        aiManager!.history.push(errorPrompt);
        setAiManager(aiManager);
        updateHistory();
      }

      // Keep API error null since we're handling it in the prompt
      setApiError(null);
    } finally {
      setLoading(false);
    }
  }

  // Agent mode: toggle handler – connects directly to the Holmes ag-ui server.
  // Ref to track the current agent message being built.
  // Intermediate text messages are accumulated as thinking steps;
  // the last message before RUN_FINISHED becomes the final answer.
  const agentMessageIdRef = React.useRef<string | null>(null);
  const agentTextBufferRef = React.useRef<string>('');
  const agentCurrentMsgIdRef = React.useRef<string>('');

  /** Classify an incoming text message from Holmes */
  const classifyAgentText = (
    text: string
  ): 'tool-start' | 'tool-result' | 'todo-update' | 'intermediate-text' => {
    if (/^🔧\s*Using Agent tool:/.test(text)) return 'tool-start';
    if (/^🔧\s*\S+\s+result:/.test(text)) return 'tool-result';
    if (/^###\s*Investigation Tasks:/.test(text)) return 'todo-update';
    return 'intermediate-text';
  };

  /**
   * Remove tool-call artifacts and raw CLI output that may leak into the
   * final displayed content from the Holmes agent.
   */
  const sanitizeAgentContent = (text: string): string => {
    if (!text) return text;

    let cleaned = text;

    // Remove 🔧 tool result blocks (🔧 <tool> result: ... up to the next ## heading)
    cleaned = cleaned.replace(/🔧\s*\S+\s+result:[\s\S]*?(?=\n\s*##)/g, '');
    // Also remove standalone 🔧 result blocks at the end (no ## heading follows)
    cleaned = cleaned.replace(/🔧\s*\S+\s+result:[\s\S]*$/g, '');

    // Remove 🔧 tool-start lines
    cleaned = cleaned.replace(/🔧\s*Using Agent tool:.*\n?/g, '');

    // If content starts with non-markdown text before a ## heading,
    // check whether it looks like leaked tool/CLI output and strip it
    const headingMatch = cleaned.match(/(^[\s\S]*?)(\n##\s)/m);
    if (headingMatch && headingMatch[1]) {
      const before = headingMatch[1].trim();
      if (before && looksLikeToolOutput(before)) {
        cleaned = cleaned.substring((headingMatch.index ?? 0) + headingMatch[1].length);
      }
    }

    return cleaned.trim();
  };

  /** Heuristic: does this snippet look like raw CLI / tool output? */
  const looksLikeToolOutput = (text: string): boolean => {
    const t = text.trim();
    if (!t) return false;
    // Common CLI error lines
    if (/^(error|Error|ERROR)\s*:/m.test(t)) return true;
    // kubectl commands or output
    if (/kubectl\s+\w+/m.test(t)) return true;
    // Tool-result emoji markers
    if (/🔧/.test(t)) return true;
    // Shell prompts
    if (/^\$\s+/m.test(t)) return true;
    return false;
  };

  const handleToggleAgentMode = React.useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        // Use MockHolmesAgent when the developer option is enabled
        const useMockAgent = pluginSettings?.devOptions?.enableMockAgent === true;

        let agent: HolmesAgent | MockHolmesAgent;
        if (useMockAgent) {
          agent = new MockHolmesAgent();
          console.log('[AgentMode] Using MockHolmesAgent');
        } else {
          // Create the HolmesAgent routing through K8s service proxy
          const cluster = getCluster();
          if (!cluster) {
            console.error('[AgentMode] No cluster available');
            setAgentModeStatus('not-found');
            setIsAgentMode(false);
            setShowHolmesSetup(true);
            return;
          }
          agent = new HolmesAgent(getHolmesProxyBaseUrl(cluster, pluginSettings));
        }
        setAgentModeStatus('found');
        setIsAgentMode(true);
        agent.subscribe({
          onEvent: ({ event }) => {
            console.log('[AgentMode] onEvent:', event.type, event);
          },
          onRunInitialized: () => {
            console.log('[AgentMode] onRunInitialized');
          },
          onRunFailed: ({ error }) => {
            console.error('[AgentMode] onRunFailed:', error);
          },
          onRunFinalized: () => {
            console.log('[AgentMode] onRunFinalized');
          },
          onRunStartedEvent: () => {
            console.log('[AgentMode] onRunStartedEvent');
            setLoading(true);
            // Create the placeholder assistant message with thinking steps
            const placeholderId = `agent-response-${Date.now()}`;
            agentMessageIdRef.current = placeholderId;
            setPromptHistory(prev => [
              ...prev,
              {
                role: 'assistant',
                content: '',
                agentThinkingSteps: [],
                agentThinkingDone: false,
              },
            ]);
          },
          onRunFinishedEvent: () => {
            console.log('[AgentMode] onRunFinishedEvent');
            setLoading(false);
            // Mark thinking as done and sanitize the final displayed content
            setPromptHistory(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (
                  updated[i].role === 'assistant' &&
                  updated[i].agentThinkingSteps !== undefined &&
                  !updated[i].agentThinkingDone
                ) {
                  const cleanContent = sanitizeAgentContent(updated[i].content || '');
                  updated[i] = {
                    ...updated[i],
                    content: cleanContent,
                    agentThinkingDone: true,
                  };
                  break;
                }
              }
              return updated;
            });
            agentMessageIdRef.current = null;
            agentTextBufferRef.current = '';
            agentCurrentMsgIdRef.current = '';
          },
          onRunErrorEvent: ({ event }) => {
            console.error('[AgentMode] onRunErrorEvent:', event);
            setLoading(false);
            setPromptHistory(prev => [
              ...prev,
              {
                role: 'assistant',
                content: t('Agent error: {{message}}', { message: event.message }),
                error: true,
              },
            ]);
            agentMessageIdRef.current = null;
          },
          onTextMessageStartEvent: ({ event }) => {
            console.log('[AgentMode] onTextMessageStartEvent:', event.messageId);
            agentTextBufferRef.current = '';
            agentCurrentMsgIdRef.current = event.messageId;
          },
          onTextMessageContentEvent: ({ event }) => {
            console.log('[AgentMode] onTextMessageContentEvent:', { delta: event.delta });
            agentTextBufferRef.current += event.delta || '';
          },
          onTextMessageEndEvent: () => {
            console.log('[AgentMode] onTextMessageEndEvent');
            const fullText = agentTextBufferRef.current;
            const msgId = agentCurrentMsgIdRef.current;
            const stepType = classifyAgentText(fullText);
            const isToolMessage = stepType === 'tool-result' || stepType === 'tool-start';

            // Update the placeholder assistant message:
            // - Tool-result / tool-start messages go ONLY into agentThinkingSteps
            //   (they must never overwrite the displayed content).
            // - Other messages replace content (final answer is the last non-tool one).
            setPromptHistory(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (
                  updated[i].role === 'assistant' &&
                  updated[i].agentThinkingSteps !== undefined &&
                  !updated[i].agentThinkingDone
                ) {
                  const existingSteps = updated[i].agentThinkingSteps || [];
                  const prevContent = updated[i].content || '';
                  const newSteps = [...existingSteps];

                  // For non-tool messages, move previous content into thinking
                  // steps (if it hasn't already been added).
                  if (!isToolMessage && prevContent.trim()) {
                    const prevType = classifyAgentText(prevContent);
                    const alreadyInSteps = newSteps.some(step => step.content === prevContent);
                    if (!alreadyInSteps) {
                      newSteps.push({
                        id: `step-prev-${i}-${newSteps.length}`,
                        content: prevContent,
                        type: prevType,
                        timestamp: Date.now(),
                      });
                    }
                  }

                  // Always record the message as a thinking step
                  newSteps.push({
                    id: `step-${msgId}`,
                    content: fullText,
                    type: stepType,
                    timestamp: Date.now(),
                  });

                  // Only update displayed content for non-tool messages
                  const newContent = isToolMessage ? updated[i].content : fullText;

                  updated[i] = {
                    ...updated[i],
                    content: newContent,
                    agentThinkingSteps: newSteps,
                  };
                  break;
                }
              }
              return updated;
            });

            agentTextBufferRef.current = '';
            agentCurrentMsgIdRef.current = '';
          },
          onToolCallStartEvent: ({ event }) => {
            console.log('[AgentMode] onToolCallStartEvent:', event.toolCallName);
            // Add tool call as a thinking step
            setPromptHistory(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (
                  updated[i].role === 'assistant' &&
                  updated[i].agentThinkingSteps !== undefined &&
                  !updated[i].agentThinkingDone
                ) {
                  const steps = [...(updated[i].agentThinkingSteps || [])];
                  steps.push({
                    id: `tool-${event.toolCallId || event.toolCallName}-${Date.now()}`,
                    content: t('Calling tool: {{toolCallName}}', {
                      toolCallName: event.toolCallName,
                    }),
                    type: 'tool-start',
                    timestamp: Date.now(),
                  });
                  updated[i] = { ...updated[i], agentThinkingSteps: steps };
                  break;
                }
              }
              return updated;
            });
          },
          onToolCallEndEvent: ({ toolCallName }) => {
            console.log('[AgentMode] onToolCallEndEvent:', toolCallName);
            // Add tool result as a thinking step
            setPromptHistory(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (
                  updated[i].role === 'assistant' &&
                  updated[i].agentThinkingSteps !== undefined &&
                  !updated[i].agentThinkingDone
                ) {
                  const steps = [...(updated[i].agentThinkingSteps || [])];
                  steps.push({
                    id: `tool-end-${toolCallName}-${Date.now()}`,
                    content: t('Tool {{toolCallName}} completed', {
                      toolCallName,
                    }),
                    type: 'tool-result',
                    timestamp: Date.now(),
                  });
                  updated[i] = { ...updated[i], agentThinkingSteps: steps };
                  break;
                }
              }
              return updated;
            });
          },
        });
        holmesAgentRef.current = agent;

        // ─── Set up proactive diagnosis via dedicated HolmesAgent ──────
        // One HolmesAgent instance, reused sequentially for all diagnoses.
        // Between each diagnosis we resetThread() to get a fresh conversation.
        // Chat is blocked (loading=true) while diagnosis runs.
        const diagAgent = useMockAgent
          ? new MockHolmesAgent()
          : new HolmesAgent(getHolmesProxyBaseUrl(getCluster()!, pluginSettings));
        diagnosisAgentRef.current = diagAgent;

        const agentDiagnoseFn = async (
          prompt: string,
          onStep?: DiagnosisStepCallback
        ): Promise<string> => {
          // Reset thread for a fresh conversation — no leftover history
          diagAgent.resetThread();

          let responseText = '';
          let textMsgBuffer = '';
          let textMsgId = '';

          // Subscribe to collect text AND forward intermediate events
          const sub = diagAgent.subscribe({
            onTextMessageStartEvent: ({ event }: { event?: HolmesTextEvent }) => {
              textMsgBuffer = '';
              textMsgId = event?.messageId || `msg-${Date.now()}`;
            },
            onTextMessageContentEvent: ({ event }: { event?: HolmesTextEvent }) => {
              if (event?.delta) {
                textMsgBuffer += event.delta;
              }
            },
            onTextMessageEndEvent: () => {
              if (textMsgBuffer.trim()) {
                const stepType = classifyAgentText(textMsgBuffer);

                // Forward as a thinking step
                if (onStep) {
                  onStep({
                    id: `diag-text-${textMsgId}`,
                    content: textMsgBuffer,
                    type: stepType,
                    timestamp: Date.now(),
                  });
                }

                // Only accumulate non-tool messages into the final response
                if (stepType !== 'tool-result' && stepType !== 'tool-start') {
                  responseText = textMsgBuffer;
                }
              }
              textMsgBuffer = '';
              textMsgId = '';
            },
            onToolCallStartEvent: ({ event }: { event?: HolmesToolEvent }) => {
              onStep?.({
                id: `diag-tool-start-${event?.toolCallId || event?.toolCallName}-${Date.now()}`,
                content: t('Calling tool: {{toolName}}', {
                  toolName: event?.toolCallName || t('unknown'),
                }),
                type: 'tool-start',
                timestamp: Date.now(),
              });
            },
            onToolCallEndEvent: ({ toolCallName }: { toolCallName?: string }) => {
              onStep?.({
                id: `diag-tool-end-${toolCallName}-${Date.now()}`,
                content: t('Tool {{toolName}} completed', {
                  toolName: toolCallName || t('unknown'),
                }),
                type: 'tool-result',
                timestamp: Date.now(),
              });
            },
          });

          try {
            const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            diagAgent.addMessage({
              id: `diag-msg-${uniqueId}`,
              role: 'user',
              content: prompt,
            });

            console.log(`[ProactiveDiagnosis] runAgent starting (${uniqueId})`);
            await diagAgent.runAgent({
              runId: `diag-run-${uniqueId}`,
            });
            console.log(
              `[ProactiveDiagnosis] runAgent completed (${uniqueId}), length=${responseText.length}`
            );

            return sanitizeAgentContent(responseText) || t('No diagnosis available.');
          } catch (err: unknown) {
            console.error('[ProactiveDiagnosis] runAgent error:', err);
            throw err;
          } finally {
            sub.unsubscribe();
          }
        };

        if (proactiveDiagnosisEnabled) {
          diagnoseFnRef.current = agentDiagnoseFn;
          proactiveDiagnosisManager.setDiagnoseFn(agentDiagnoseFn);
          setDiagnoseFnReady(true);
          console.log('[ProactiveDiagnosis] Agent diagnose function ready');
        }
        // ─── End proactive diagnosis agent setup ────────────────────

        setPromptHistory(prev => [
          ...prev,
          {
            role: 'system',
            content: t(
              'Agent mode active. Connected to Holmes ag-ui server at {{connectionLabel}}.',
              {
                connectionLabel: agent.connectionLabel,
              }
            ),
          },
        ]);
      } else {
        setIsAgentMode(false);
        setAgentModeStatus('idle');
        holmesAgentRef.current = null;
        diagnoseFnRef.current = null;
        diagnosisAgentRef.current = null;
        proactiveDiagnosisManager.setDiagnoseFn(null);
        setDiagnoseFnReady(false);
        setPromptHistory(prev => [
          ...prev,
          { role: 'system', content: t('Switched back to AI Chat mode.') },
        ]);
      }
    },
    [pluginSettings, t]
  );

  // Explicit "Use Holmes Agent" action: verify Holmes is reachable in the
  // cluster before switching. When it is not, show setup guidance (Holmes is
  // cluster-scoped and must be installed in the cluster) instead of failing.
  const handleUseHolmes = React.useCallback(async () => {
    const requestId = holmesHealthRequestGateRef.current.begin();
    // Mock agent bypasses the health check.
    if (pluginSettings?.devOptions?.enableMockAgent) {
      setIsHolmesRetrying(false);
      setShowHolmesSetup(false);
      await handleToggleAgentMode(true);
      return;
    }

    const cluster = getCluster();
    if (!cluster) {
      setAgentModeStatus('not-found');
      setShowHolmesSetup(true);
      setIsHolmesRetrying(false);
      return;
    }

    setAgentModeStatus('checking');
    setIsHolmesRetrying(true);
    try {
      const available = await checkHolmesAgentHealth(cluster, pluginSettings);
      if (!holmesHealthRequestGateRef.current.isCurrent(requestId)) return;
      if (available) {
        setShowHolmesSetup(false);
        await handleToggleAgentMode(true);
      } else {
        setAgentModeStatus('not-found');
        setShowHolmesSetup(true);
      }
    } catch {
      if (!holmesHealthRequestGateRef.current.isCurrent(requestId)) return;
      setAgentModeStatus('not-found');
      setShowHolmesSetup(true);
    } finally {
      if (holmesHealthRequestGateRef.current.isCurrent(requestId)) setIsHolmesRetrying(false);
    }
  }, [pluginSettings, handleToggleAgentMode]);

  // In-chat "agent mode" toggle. Enabling verifies Holmes is reachable first
  // (via handleUseHolmes) so users never land in a dead agent mode; disabling
  // returns to chat and clears any setup guidance.
  const handleToggleAgentModeRequest = React.useCallback(
    (enabled: boolean) => {
      if (enabled) {
        void handleUseHolmes();
      } else {
        holmesHealthRequestGateRef.current.invalidate();
        setIsHolmesRetrying(false);
        setShowHolmesSetup(false);
        void handleToggleAgentMode(false);
      }
    },
    [handleUseHolmes, handleToggleAgentMode]
  );

  // Auto-initialize agent mode on first mount if Holmes is reachable
  // or if mock agent is enabled.
  // Holmes takes priority over chat mode: if Holmes is available, always
  // default to it regardless of whether a chat provider is also configured.
  // Fall back to chat mode only when Holmes is not reachable.
  React.useEffect(() => {
    if (isAgentMode || holmesAgentRef.current) return;

    // If mock agent is enabled, skip health check and go straight to agent mode
    if (pluginSettings?.devOptions?.enableMockAgent) {
      void handleToggleAgentMode(true);
      return;
    }

    const cluster = getCluster();
    if (!cluster) return;
    const requestId = holmesHealthRequestGateRef.current.begin();
    void checkHolmesAgentHealth(cluster, pluginSettings)
      .then(available => {
        if (holmesHealthRequestGateRef.current.isCurrent(requestId) && available) {
          void handleToggleAgentMode(true);
        }
      })
      .catch(() => {
        /* Holmes not reachable — stay in chat mode */
      });
    return () => {
      if (holmesHealthRequestGateRef.current.isCurrent(requestId)) {
        holmesHealthRequestGateRef.current.invalidate();
      }
    };
  }, [handleToggleAgentMode, isAgentMode, pluginSettings]);

  // Agent mode: send a message to Holmes via the ag-ui HolmesAgent.
  // Events (text streaming, tool calls, errors) are handled by the subscriber
  // set up in handleToggleAgentMode.
  const handleAgentSend = React.useCallback(
    async (prompt: string) => {
      const agent = holmesAgentRef.current;
      if (!agent) {
        // Holmes agent isn't available (not installed / unreachable in this
        // cluster). Surface the setup guide instead of silently dropping the
        // prompt with no feedback.
        setIsAgentMode(false);
        setPromptVal(prompt);
        setShowHolmesSetup(true);
        return;
      }

      setOpenPopup(true);
      setPromptHistory(prev => [...prev, { role: 'user', content: prompt }]);
      setLoading(true);

      try {
        console.log('[AgentMode] addMessage:', prompt);
        agent.addMessage({
          id: `msg-${Date.now()}`,
          role: 'user',
          content: prompt,
        });

        console.log('[AgentMode] runAgent starting...');
        const result = await agent.runAgent({
          runId: `run-${Date.now()}`,
        });
        console.log('[AgentMode] runAgent completed:', result);
      } catch (error) {
        console.error('[AgentMode] runAgent error:', error);
        setPromptHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: t('Error: {{message}}', {
              message: error instanceof Error ? error.message : t('Unknown error'),
            }),
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [setOpenPopup, t]
  );

  // Function to handle tool retry
  const handleRetryTool = React.useCallback(
    async (toolName: string, args: Record<string, any>) => {
      if (!aiManager) {
        console.error('Cannot retry tool: aiManager not available');
        return;
      }

      try {
        // Get the tool manager from the LangChain manager
        const toolManager = (aiManager as any).toolManager;
        if (!toolManager) {
          console.error('Cannot retry tool: toolManager not available');
          return;
        }

        // Execute the tool directly
        const toolResponse = await toolManager.executeTool(toolName, args);

        // Add the retry result to the conversation history
        const retryPrompt: ConversationMessage = {
          role: 'tool',
          content: toolResponse.content,
          toolCallId: `retry-${Date.now()}`,
          name: toolName,
        };

        aiManager.history.push(retryPrompt);
        updateHistory();

        // If the tool should process follow-up, trigger that
        if (toolResponse.shouldProcessFollowUp) {
          await aiManager.processToolResponses();
          updateHistory();
        }
      } catch (error) {
        console.error(`Error retrying tool ${toolName}:`, error);

        // Add error to conversation
        const errorPrompt: ConversationMessage = {
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: t('Failed to retry tool: {{message}}', {
              message: error instanceof Error ? error.message : t('Unknown error'),
            }),
            toolName,
          }),
          toolCallId: `retry-error-${Date.now()}`,
          name: toolName,
          error: true,
        };

        aiManager.history.push(errorPrompt);
        updateHistory();
      }
    },
    [aiManager, t, updateHistory]
  );

  // Function to stop the current request
  const handleStopRequest = () => {
    if (isAgentMode && holmesAgentRef.current) {
      holmesAgentRef.current.abortRun();
      setLoading(false);
    } else if (aiManager && loading) {
      aiManager.abort();
      setLoading(false);
    }
  };

  // Function to handle API confirmation dialog confirmation
  const handleApiConfirmation = async (body, resourceInfo) => {
    if (!kubernetesUI.apiRequest) return;

    const { url, method } = kubernetesUI.apiRequest;
    kubernetesCallbacks.setApiRequest(null);

    await kubernetesCallbacks.handleActualApiRequest(
      url,
      method,
      body,
      handleApiDialogClose,
      aiManager,
      resourceInfo,
      undefined, // targetCluster
      handleOperationFailure
    );
  };

  const handleApiDialogClose = () => {
    kubernetesCallbacks.setShowApiConfirmation(false);
    kubernetesCallbacks.setApiRequest(null);
    kubernetesCallbacks.setApiResponse(null);
    kubernetesCallbacks.setApiRequestError(null);
    kubernetesCallbacks.setApiLoading(false);
  };

  // Memoize the kubernetesContext to avoid unnecessary re-creation
  const kubernetesContext = useMemo(
    () => ({
      ui: kubernetesUI,
      callbacks: {
        ...kubernetesCallbacks,
        handleActualApiRequest: (
          url,
          method,
          body,
          onClose,
          aiManagerParam,
          resourceInfo,
          targetCluster
        ) => {
          // If no specific cluster is provided, use the first available cluster
          const clusterToUse =
            targetCluster ||
            (selectedClusters && selectedClusters.length > 0 ? selectedClusters[0] : null) ||
            getCluster() ||
            (Object.keys(clusters).length > 0 ? Object.keys(clusters)[0] : null);

          return kubernetesCallbacks.handleActualApiRequest(
            url,
            method,
            body,
            onClose,
            aiManagerParam || aiManager,
            resourceInfo,
            clusterToUse,
            handleOperationFailure
          );
        },
      },
      selectedClusters,
      aiManager, // Add the AI manager to the context
    }),
    [kubernetesUI, kubernetesCallbacks, selectedClusters, aiManager, clusters]
  );

  React.useEffect(() => {
    if (!aiManager) {
      return;
    }

    const event = _pluginSetting.event;
    const currentCluster = getCluster();
    const currentClusterGroup = getClusterGroup();

    // Fetch warnings on-demand for context generation (one-shot, not continuous)
    const clusters = clusterNames;
    fetchClusterWarnings(clusters)
      .then(warnings => {
        clusterWarningsRef.current = warnings;

        const contextDescription = generateContextDescription(
          event,
          currentCluster,
          warnings,
          selectedClusters && selectedClusters.length > 0 ? selectedClusters : undefined
        );
        let fullContext = contextDescription;
        if (currentClusterGroup && currentClusterGroup.length > 1) {
          fullContext = `Part of cluster group with ${currentClusterGroup.length} clusters\n${fullContext}`;
        }
        aiManager.setContext(fullContext);
      })
      .catch(err => {
        console.error('[Context] Failed to fetch warnings for context:', err);
        // Fall back to generating context without warnings
        const contextDescription = generateContextDescription(
          event,
          currentCluster,
          undefined,
          selectedClusters && selectedClusters.length > 0 ? selectedClusters : undefined
        );
        let fullContext = contextDescription;
        if (currentClusterGroup && currentClusterGroup.length > 1) {
          fullContext = `Part of cluster group with ${currentClusterGroup.length} clusters\n${fullContext}`;
        }
        aiManager.setContext(fullContext);
      });

    // Configure AI manager with tools
    if (aiManager.configureTools) {
      aiManager.configureTools(
        [], // No longer need to pass the tool definitions manually
        kubernetesContext
      );
    }
  }, [_pluginSetting.event, aiManager, clusterNames, selectedClusters, kubernetesContext]);

  useEffect(() => {
    if (openPopup && aiManager) {
      // Only use dynamic prompts as initial suggestions if there's no conversation history
      // If there's conversation history, suggestions will be parsed from the latest AI response
      const hasConversation = aiManager.history && aiManager.history.length > 0;
      if (!hasConversation) {
        setSuggestions(dynamicPrompts);
      }
    }
  }, [openPopup, aiManager, dynamicPrompts, location.pathname]);

  // Set suggestions to dynamic prompts when there's a content filter error
  useEffect(() => {
    if (apiError && apiError.includes('content filter')) {
      setSuggestions(dynamicPrompts);
    }
  }, [apiError, dynamicPrompts]);

  const disableSettingsButton = useMemo(() => {
    // Compensate the @ symbol not getting encoded in the history's URL
    const currentURL = location.pathname.replace(/@/g, '%40');
    return currentURL === getSettingsURL();
  }, [location]);

  // Generate greeting message
  const getGreetingMessage = React.useMemo(() => {
    return {
      role: 'assistant' as const,
      content: t(
        "Hello! I'm your AI Assistant, ready to help you with Kubernetes operations. How can I assist you today?"
      ),
      isDisplayOnly: true, // Mark this as display-only so it doesn't get sent to LLM
    };
  }, [t]);

  // If panel is not open, don't render
  if (!openPopup) return null;

  // Check if we have any valid configuration for chat mode
  const savedConfigs = getSavedConfigurations(pluginSettings);
  const hasAnyValidConfig = savedConfigs.providers && savedConfigs.providers.length > 0;
  const hasValidConfig = hasAnyValidConfig;

  // Helper function to check if we should show greeting - memoized for performance
  const shouldShowGreeting = React.useMemo(() => {
    // In agent mode, show greeting without requiring chat config
    if (isAgentMode) {
      const hasConversationMessages = promptHistory.some(
        msg => (msg.role === 'user' || msg.role === 'assistant') && !msg.isDisplayOnly
      );
      return !hasConversationMessages;
    }
    // Only show greeting if we have a valid configuration
    if (!hasValidConfig || !activeConfig) return false;

    // Only show if history is empty or contains only system messages
    const hasConversationMessages = promptHistory.some(
      msg => (msg.role === 'user' || msg.role === 'assistant') && !msg.isDisplayOnly
    );
    return !hasConversationMessages; // Removed dependency on loading state
  }, [hasValidConfig, activeConfig, promptHistory, isAgentMode]); // Removed loading from dependencies

  // Memoize the history array to prevent unnecessary re-renders of AIChatContent
  const memoizedHistory = React.useMemo(() => {
    if (shouldShowGreeting) {
      return [getGreetingMessage, ...promptHistory];
    }
    return promptHistory;
  }, [shouldShowGreeting, getGreetingMessage, promptHistory]);

  // Holmes was requested but is not reachable — guide the user to install it in
  // their cluster and configure the connection in Settings. Shown regardless of
  // provider config or agent-mode state so users are never stuck in a dead
  // agent mode.
  if (showHolmesSetup) {
    return (
      <HolmesSetupGuide
        onOpenSettings={() => {
          history.push(getSettingsURL());
          setOpenPopup(false);
        }}
        onRetry={handleUseHolmes}
        isRetrying={isHolmesRetrying}
        onDismiss={() => {
          holmesHealthRequestGateRef.current.invalidate();
          setIsHolmesRetrying(false);
          setShowHolmesSetup(false);
          setChatMode('chat');
        }}
        namespace={pluginSettings?.holmesNamespace}
        serviceName={pluginSettings?.holmesServiceName}
        port={pluginSettings?.holmesPort}
      />
    );
  }

  // If no valid configuration AND NOT in agent mode, show setup message
  if (!hasValidConfig && !isAgentMode && chatMode !== 'agent') {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          {t('AI Assistant Setup Required')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t(
            'To use the AI Assistant, please configure your AI provider credentials in the settings page.'
          )}{' '}
          {t('Or switch to Holmes Agent mode.')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:settings" />}
            onClick={() => {
              history.push(getSettingsURL());
              setOpenPopup(false);
            }}
          >
            {t('Go to Settings')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:robot" />}
            disabled={agentModeStatus === 'checking'}
            onClick={() => {
              handleUseHolmes();
            }}
          >
            {agentModeStatus === 'checking' ? t('Checking for Holmes…') : t('Use Holmes Agent')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <div ref={rootRef}>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Prevent horizontal overflow
          maxWidth: '100%',
          minWidth: 0,
          // Global override for all MUI Grid items to prevent max-width: none
          '& .MuiGrid-root > .MuiGrid-item': {
            maxWidth: '100% !important',
          },
        }}
      >
        <AIAssistantHeader
          isTestMode={isTestMode}
          disableSettingsButton={disableSettingsButton}
          onClose={() => setOpenPopup(false)}
          onSettings={() => history.push(getSettingsURL())}
        />

        <Grid
          container
          direction="column"
          justifyContent="flex-end"
          alignItems="stretch"
          sx={{
            height: '100%',
            padding: 1,
            overflow: 'hidden', // Prevent overflow
            maxWidth: '100%',
            minWidth: 0,
            '& > .MuiGrid-item': {
              maxWidth: '100% !important',
            },
          }}
        >
          <Grid
            item
            xs
            sx={{
              height: '100%',
              overflowY: 'auto',
              overflowX: 'auto', // Allow horizontal scrolling when needed
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            {proactiveDiagnosisEnabled && (
              <ProactiveDiagnosisSection
                diagnoses={diagnoses}
                scrollToEventUid={scrollToEventUid}
                onScrollComplete={clearScrollTarget}
                isCycleRunning={isCycleRunning}
                onYamlAction={handleYamlAction}
                ContentRendererSlot={ContentRenderer}
              />
            )}
            <AIChatContent
              history={memoizedHistory}
              isLoading={loading}
              apiError={apiError}
              onOperationSuccess={() => {}}
              onOperationFailure={handleOperationFailure}
              onYamlAction={handleYamlAction}
              onRetryTool={handleRetryTool}
            />
          </Grid>
          <Grid
            item
            sx={{
              paddingY: 1,
              maxWidth: '100% !important',
              '& .MuiGrid-item': {
                maxWidth: '100% !important',
              },
            }}
          >
            <PromptSuggestions
              suggestions={suggestions}
              apiError={apiError}
              loading={loading || isDiagnosisRunning}
              onPromptSelect={prompt => setPromptVal(prompt)}
              onPromptSend={prompt => {
                if (isDiagnosisRunning) return;
                AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                  setApiError(error.message);
                });
              }}
              onErrorClear={() => setApiError(null)}
            />
            <AIInputSection
              promptVal={promptVal}
              setPromptVal={setPromptVal}
              loading={loading}
              isTestMode={isTestMode}
              activeConfig={activeConfig}
              availableConfigs={availableConfigs}
              selectedModel={selectedModel}
              isAgentMode={isAgentMode}
              agentModeStatus={agentModeStatus}
              isDiagnosisRunning={isDiagnosisRunning}
              enabledTools={enabledTools}
              onSend={prompt => {
                // Block chat while proactive diagnosis is running
                if (isDiagnosisRunning) return;
                if (isAgentMode) {
                  handleAgentSend(prompt).catch(error => {
                    setApiError(error.message);
                  });
                } else {
                  AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                    setApiError(error.message);
                  });
                }
              }}
              onStop={handleStopRequest}
              onClearHistory={() => {
                if (isTestMode) {
                  setPromptHistory([]);
                } else {
                  aiManager?.reset();
                  updateHistory();
                }
                // Clear tool approval session when history is cleared
                inlineToolApprovalManager.clearSession();
              }}
              onConfigChange={(config, model) => {
                setActiveConfig(config);
                setSelectedModel(model);
                handleChangeConfig(config, model);
              }}
              onTestModeResponse={handleTestModeResponse}
              onToggleAgentMode={handleToggleAgentModeRequest}
              onToolsChange={newEnabledTools => {
                setEnabledTools(newEnabledTools);
                // Recreate AI manager with new tools
                handleChangeConfig(activeConfig, selectedModel);
              }}
              chatMode={chatMode}
              onChatModeChange={mode => {
                setChatMode(mode);
                setPromptHistory([]);
                setApiError(null);
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Editor Dialog */}
      {!isDelete && showEditor && (
        <EditorDialog
          open={showEditor}
          onClose={() => setShowEditor(false)}
          yamlContent={editorContent}
          title={editorTitle}
          resourceType={resourceType}
          onSuccess={() => {}}
          onFailure={handleOperationFailure}
        />
      )}

      {/* API Confirmation Dialog */}
      <ApiConfirmationDialog
        open={kubernetesUI.showApiConfirmation}
        onClose={handleApiDialogClose}
        method={kubernetesUI.apiRequest?.method || ''}
        url={kubernetesUI.apiRequest?.url || ''}
        body={kubernetesUI.apiRequest?.body}
        onConfirm={handleApiConfirmation}
        isLoading={kubernetesUI.apiLoading}
        result={kubernetesUI.apiResponse}
        error={kubernetesUI.apiRequestError}
      />
    </div>
  );
}
