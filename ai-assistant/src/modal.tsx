import { Icon } from '@iconify/react';
import { useClustersConf, useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster, getClusterGroup } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Button, Grid, Typography } from '@mui/material';
import { isEqual } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { getHolmesProxyBaseUrl, HolmesAgent } from './agent/holmesClient';
import AIManager, { Prompt } from './ai/manager';
import {
  AIAssistantHeader,
  AIChatContent,
  AIInputSection,
  ApiConfirmationDialog,
  PromptSuggestions,
} from './components';
import { getProviderById } from './config/modelConfig';
import EditorDialog from './editordialog';
import { isTestModeCheck } from './helper';
import { useKubernetesToolUI } from './hooks/useKubernetesToolUI';
import LangChainManager from './langchain/LangChainManager';
import { getSettingsURL, useGlobalState } from './utils';
import { generateContextDescription } from './utils/contextGenerator';
import {
  /* [PROACTIVE_DIAGNOSIS_DISABLED] fetchWarningEventsForClusters, */ fetchClusterWarnings,
} from './utils/EventFetcher';
import { getProviderModels, parseSuggestionsFromResponse } from './utils/modalUtils';
// [PROACTIVE_DIAGNOSIS_DISABLED]
// import {
//   DiagnosisStepCallback,
//   proactiveDiagnosisManager,
//   ProactiveDiagnosisManager,
// } from './utils/ProactiveDiagnosisManager';
import { useDynamicPrompts } from './utils/promptGenerator';

// Operation type constants for translation
const OPERATION_TYPES = {
  CREATION: 'creation',
  UPDATE: 'update',
  DELETION: 'deletion',
  GENERIC: 'operation',
} as const;
import {
  getActiveConfig,
  getSavedConfigurations,
  StoredProviderConfig,
} from './utils/ProviderConfigManager';
import { getEnabledToolIds } from './utils/ToolConfigManager';

export default function AIPrompt(props: {
  openPopup: boolean;
  setOpenPopup: (...args) => void;
  pluginSettings: any;
}) {
  const { openPopup, setOpenPopup, pluginSettings } = props;
  const history = useHistory();
  const location = useLocation();
  const rootRef = React.useRef(null);
  const [promptVal, setPromptVal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);
  const [aiManager, setAiManager] = React.useState<AIManager | null>(null);
  const _pluginSetting = useGlobalState();
  const [promptHistory, setPromptHistory] = React.useState<Prompt[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const selectedClusters = useSelectedClusters();
  const clusters = useClustersConf() || {};
  const dynamicPrompts = useDynamicPrompts();
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
  // [PROACTIVE_DIAGNOSIS_DISABLED] — entire proactive diagnosis block commented out.
  // To re-enable, uncomment the code below and the import above.
  /*
  // Wire the proactive diagnosis manager to the agent or AI manager.
  // It runs a diagnosis cycle on-demand (with a 1-hour cooldown) on the
  // top 3 warning/error events fetched via a one-shot API call.
  const proactiveDiagIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Dedicated HolmesAgent for proactive diagnosis — one instance, reused sequentially.
  const diagnosisAgentRef = useRef<HolmesAgent | null>(null);

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

  const runProactiveCycle = useCallback(async () => {
    if (!diagnoseFnRef.current) return; // Don't run if no AI is available yet
    if (loadingRef.current || isDiagnosisRunningRef.current) return; // Don't run while user is chatting or another diagnosis is running

    // Fetch events on-demand (one-shot API call — no continuous watch)
    const clusters = clusterNamesRef.current;
    if (!clusters || clusters.length === 0) return;

    try {
      const allWarningEvents = await fetchWarningEventsForClusters(clusters);
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
  }, [diagnoseFnReady]); // runProactiveCycle is now stable, no need in deps
  */
  // Stub: proactive diagnosis disabled — isDiagnosisRunning is always false
  const isDiagnosisRunning = false;
  // ─── End Proactive Diagnosis Setup ──────────────────────────────────

  const [activeConfig, setActiveConfig] = useState<StoredProviderConfig | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<StoredProviderConfig[]>([]);

  const [enabledTools, setEnabledTools] = React.useState<string[]>(
    getEnabledToolIds(pluginSettings)
  );

  // Test mode detection
  const isTestMode = isTestModeCheck();

  // Agent mode state – default to agent mode so users can start immediately
  const [isAgentMode, setIsAgentMode] = React.useState(true);

  const [agentModeStatus, setAgentModeStatus] = React.useState<
    'idle' | 'checking' | 'found' | 'not-found'
  >('idle');
  const holmesAgentRef = React.useRef<HolmesAgent | null>(null);

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
        finalTitle = `View ${title}`;
      } else if (actualDelete) {
        finalTitle = `Delete ${type}`;
      } else if (!isSampleYaml && !actualDelete) {
        finalTitle = `Apply ${type}`;
      }

      setEditorContent(yaml);
      setEditorTitle(finalTitle);
      setResourceType(type);
      setIsDelete(actualDelete);
      setShowEditor(true);
    },
    []
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
      const stillExists = newProviders.find(
        p =>
          p.providerId === activeConfig.providerId && p.config.apiKey === activeConfig.config.apiKey
      );

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
                content: `Previous provider was removed. Switched to ${providerName}.`,
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
      activeConfig.providerId !== config.providerId ||
      activeConfig.config.apiKey !== config.config.apiKey ||
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
              content: `Switched to ${providerName}${resolvedModel ? ' / ' + resolvedModel : ''}.`,
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
            content: `Using ${providerName}${resolvedModel ? ' / ' + resolvedModel : ''}.`,
          },
        ]);
      }
    }
  };

  React.useEffect(() => {
    // Recreate the manager whenever pluginSettings change (including tool settings)
    // or when activeConfig/selectedModel changes
    if (activeConfig) {
      try {
        // Create config with selected model
        const configWithModel = {
          ...activeConfig.config,
          model: selectedModel,
        };
        const newManager = new LangChainManager(
          activeConfig.providerId,
          configWithModel,
          enabledTools
        );
        setAiManager(newManager);
        return;
      } catch (error) {
        setApiError(`Failed to initialize AI model: ${error.message}`);
      }
    }
  }, [enabledTools, activeConfig, selectedModel]);

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

  // [PROACTIVE_DIAGNOSIS_DISABLED] — LangChain fallback diagnosis connection
  /*
  // ─── Connect AI manager to proactive diagnosis (fallback for non-agent mode) ──
  // When NOT in agent mode but an AI config is available, use LangChainManager as fallback.
  // In agent mode, the diagnoseFn is already set by handleToggleAgentMode above.
  useEffect(() => {
    // Only set the LangChain fallback if agent mode is NOT active
    if (!isAgentMode && activeConfig) {
      const diagnoseFn = async (prompt: string, onStep?: DiagnosisStepCallback): Promise<string> => {
        try {
          const configWithModel = {
            ...activeConfig.config,
            model: selectedModel,
          };
          // Create an isolated manager instance for this single diagnosis
          const isolatedManager = new LangChainManager(
            activeConfig.providerId,
            configWithModel,
            enabledTools
          );
          // LangChain doesn't stream intermediate events, so just report start/end
          onStep?.({
            id: `lc-start-${Date.now()}`,
            content: 'Sending diagnosis request…',
            type: 'intermediate-text',
            timestamp: Date.now(),
          });
          const response = await isolatedManager.userSend(prompt);
          onStep?.({
            id: `lc-done-${Date.now()}`,
            content: 'Diagnosis response received',
            type: 'tool-result',
            timestamp: Date.now(),
          });
          return response.content || 'No diagnosis available.';
        } catch (err: any) {
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
  }, [isAgentMode, activeConfig, selectedModel, enabledTools]);
  */
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
  const { state: kubernetesUI, callbacks: kubernetesCallbacks } =
    useKubernetesToolUI(updateHistory);

  const handleOperationSuccess = React.useCallback(
    (response: any) => {
      // Add the response to the conversation
      const operationType = response.metadata?.deletionTimestamp ? 'deletion' : 'application';

      const toolPrompt: Prompt = {
        role: 'tool',
        content: `Resource ${operationType} completed successfully: ${JSON.stringify(
          {
            kind: response.kind,
            name: response.metadata.name,
            namespace: response.metadata.namespace,
            status: 'Success',
          },
          null,
          2
        )}`,
        name: 'kubernetes_api_request',
        toolCallId: `${operationType}-${Date.now()}`,
      };

      if (aiManager) {
        aiManager.history.push(toolPrompt);
        updateHistory();
      }
    },
    [aiManager, updateHistory]
  );

  const handleOperationFailure = React.useCallback(
    (error: any, operationType: string, resourceInfo?: any) => {
      // Determine the operation type from the error or method
      let operation: string;
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
      const errorMessage = error?.message || error?.error || 'Unknown error occurred';
      const statusCode = error?.status || error?.statusCode;

      // Build error content
      let errorContent = `Resource ${operation} failed: ${errorMessage}`;

      if (resourceInfo) {
        errorContent += `\n\nResource Details: ${JSON.stringify(
          {
            kind: resourceInfo.kind,
            name: resourceInfo.name,
            namespace: resourceInfo.namespace,
            status: 'Failed',
            ...(statusCode && { statusCode }),
          },
          null,
          2
        )}`;
      } else if (statusCode) {
        errorContent += `\n\nStatus Code: ${statusCode}`;
      }

      const toolPrompt: Prompt = {
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
    [aiManager, updateHistory]
  );

  // Function to handle test mode responses
  const handleTestModeResponse = (
    content: string,
    type: 'assistant' | 'user',
    hasError?: boolean
  ) => {
    const newPrompt: Prompt = {
      role: type,
      content,
      error: hasError || false,
      ...(hasError && { contentFilterError: true }),
    };

    setPromptHistory(prev => [...prev, newPrompt]);
    setOpenPopup(true);
  };

  async function AnalyzeResourceBasedOnPrompt(prompt: string) {
    setOpenPopup(true);

    // Always add user message to promptHistory immediately so it shows up right away
    const userPrompt: Prompt = {
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
      const promptResponse = await aiManager.userSend(prompt);
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
        const errorPrompt: Prompt = {
          role: 'assistant',
          content: `Error: ${error.message || 'An unknown error occurred'}`,
          error: true,
        };

        // Add to history so it appears with the specific request
        aiManager.history.push(errorPrompt);
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

  const handleToggleAgentMode = React.useCallback(async (enabled: boolean) => {
    if (enabled) {
      setAgentModeStatus('found');
      setIsAgentMode(true);

      // Create the HolmesAgent routing through K8s service proxy
      const cluster = getCluster();
      if (!cluster) {
        console.error('[AgentMode] No cluster available');
        return;
      }
      const agent = new HolmesAgent(getHolmesProxyBaseUrl(cluster));
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
              content: `Agent error: ${event.message}`,
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
                  content: `Calling tool: ${event.toolCallName}`,
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
                  content: `Tool ${toolCallName} completed`,
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

      // [PROACTIVE_DIAGNOSIS_DISABLED] — agent diagnosis setup
      /*
        // ─── Set up proactive diagnosis via dedicated HolmesAgent ──────
        // One HolmesAgent instance, reused sequentially for all diagnoses.
        // Between each diagnosis we resetThread() to get a fresh conversation.
        // Chat is blocked (loading=true) while diagnosis runs.
        const diagAgent = new HolmesAgent(getHolmesProxyBaseUrl(cluster));
        diagnosisAgentRef.current = diagAgent;

        const agentDiagnoseFn = async (prompt: string, onStep?: DiagnosisStepCallback): Promise<string> => {
          // Reset thread for a fresh conversation — no leftover history
          diagAgent.resetThread();

          let responseText = '';
          let textMsgBuffer = '';
          let textMsgId = '';

          // Subscribe to collect text AND forward intermediate events
          const sub = diagAgent.subscribe({
            onTextMessageStartEvent: ({ event }: any) => {
              textMsgBuffer = '';
              textMsgId = event?.messageId || `msg-${Date.now()}`;
            },
            onTextMessageContentEvent: ({ event }: any) => {
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
            onToolCallStartEvent: ({ event }: any) => {
              onStep?.({
                id: `diag-tool-start-${event?.toolCallId || event?.toolCallName}-${Date.now()}`,
                content: `Calling tool: ${event?.toolCallName || 'unknown'}`,
                type: 'tool-start',
                timestamp: Date.now(),
              });
            },
            onToolCallEndEvent: ({ toolCallName }: any) => {
              onStep?.({
                id: `diag-tool-end-${toolCallName}-${Date.now()}`,
                content: `Tool ${toolCallName || 'unknown'} completed`,
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
            console.log(`[ProactiveDiagnosis] runAgent completed (${uniqueId}), length=${responseText.length}`);

            return sanitizeAgentContent(responseText) || 'No diagnosis available.';
          } catch (err: any) {
            console.error('[ProactiveDiagnosis] runAgent error:', err);
            throw err;
          } finally {
            sub.unsubscribe();
          }
        };

        diagnoseFnRef.current = agentDiagnoseFn;
        proactiveDiagnosisManager.setDiagnoseFn(agentDiagnoseFn);
        setDiagnoseFnReady(true);
        console.log('[ProactiveDiagnosis] Agent diagnose function ready');
        // ─── End proactive diagnosis agent setup ────────────────────
        */

      setPromptHistory(prev => [
        ...prev,
        {
          role: 'system',
          content: `Agent mode active. Connected to Holmes ag-ui server at ${agent.connectionLabel}.`,
        },
      ]);
    } else {
      setIsAgentMode(false);
      setAgentModeStatus('idle');
      holmesAgentRef.current = null;
      // [PROACTIVE_DIAGNOSIS_DISABLED] — Clean up proactive diagnosis
      // diagnoseFnRef.current = null;
      // diagnosisAgentRef.current = null;
      // proactiveDiagnosisManager.setDiagnoseFn(null);
      // setDiagnoseFnReady(false);
      setPromptHistory(prev => [
        ...prev,
        { role: 'system', content: 'Switched back to AI Chat mode.' },
      ]);
    }
  }, []);

  // Auto-initialize agent mode on first mount (agent is default mode)
  React.useEffect(() => {
    if (isAgentMode && !holmesAgentRef.current) {
      handleToggleAgentMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Agent mode: send a message to Holmes via the ag-ui HolmesAgent.
  // Events (text streaming, tool calls, errors) are handled by the subscriber
  // set up in handleToggleAgentMode.
  const handleAgentSend = React.useCallback(
    async (prompt: string) => {
      const agent = holmesAgentRef.current;
      if (!agent) return;

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
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [setOpenPopup]
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
      content: `Hello! I'm your AI Assistant, ready to help you with Kubernetes operations. How can I assist you today?`,
      isDisplayOnly: true, // Mark this as display-only so it doesn't get sent to LLM
    };
  }, []);

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

  // If no valid configuration AND NOT in agent mode, show setup message
  if (!hasValidConfig && !isAgentMode) {
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
          AI Assistant Setup Required
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          To use the AI Assistant, please configure your AI provider credentials in the settings
          page. Or switch to Holmes Agent mode.
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
            Go to Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<Icon icon="mdi:robot" />}
            onClick={() => {
              handleToggleAgentMode(true);
            }}
          >
            Use Holmes Agent
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
        }}
      >
        <AIAssistantHeader
          isTestMode={isTestMode}
          disableSettingsButton={disableSettingsButton}
          onClose={() => setOpenPopup(false)}
        />

        <Grid
          container
          direction="column"
          justifyContent="flex-end"
          alignItems="stretch"
          sx={{
            height: '100%',
            padding: 1,
          }}
        >
          <Grid
            item
            xs
            sx={{
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <AIChatContent
              history={memoizedHistory}
              isLoading={loading}
              apiError={apiError}
              onOperationSuccess={handleOperationSuccess}
              onOperationFailure={handleOperationFailure}
              onYamlAction={handleYamlAction}
            />
          </Grid>
          <Grid
            item
            sx={{
              paddingY: 1,
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
              }}
              onConfigChange={(config, model) => {
                setActiveConfig(config);
                setSelectedModel(model);
                handleChangeConfig(config, model);
              }}
              onTestModeResponse={handleTestModeResponse}
              onToggleAgentMode={handleToggleAgentMode}
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
          onSuccess={handleOperationSuccess}
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
