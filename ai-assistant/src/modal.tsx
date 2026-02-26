import { Icon } from '@iconify/react';
import { useClustersConf, useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster, getClusterGroup } from '@kinvolk/headlamp-plugin/lib/Utils';
import { HolmesAgent, DEFAULT_AGUI_URL } from './agent/holmesClient';
import { Box, Button, Grid, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
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
import { useClusterWarnings } from './hooks/useClusterWarnings';
import { useKubernetesToolUI } from './hooks/useKubernetesToolUI';
import LangChainManager from './langchain/LangChainManager';
import { getSettingsURL, useGlobalState } from './utils';
import { generateContextDescription } from './utils/contextGenerator';
import { inlineToolApprovalManager } from './utils/InlineToolApprovalManager';
import { getProviderModels, parseSuggestionsFromResponse } from './utils/modalUtils';
import { useDynamicPrompts } from './utils/promptGenerator';

// Operation type constants for translation
const OPERATION_TYPES = {
  CREATION: 'creation',
  UPDATE: 'update',
  DELETION: 'deletion',
  GENERIC: 'operation',
} as const;
import { usePromptWidth } from './contexts/PromptWidthContext';
import {
  getActiveConfig,
  getSavedConfigurations,
  StoredProviderConfig,
} from './utils/ProviderConfigManager';

export default function AIPrompt(props: {
  openPopup: boolean;
  setOpenPopup: (...args) => void;
  pluginSettings: any;
  width: string;
}) {
  const { openPopup, setOpenPopup, pluginSettings, width } = props;
  const history = useHistory();
  const location = useLocation();
  const rootRef = React.useRef(null);
  const [promptVal, setPromptVal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);
  const [aiManager, setAiManager] = React.useState<AIManager | null>(null);
  const _pluginSetting = useGlobalState();
  const { enabledTools, setEnabledTools } = _pluginSetting;
  const [promptHistory, setPromptHistory] = React.useState<Prompt[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const selectedClusters = useSelectedClusters();
  const clusters = useClustersConf() || {};
  const dynamicPrompts = useDynamicPrompts();
  const prompWidthContext = usePromptWidth();

  useEffect(() => {
    prompWidthContext.setPromptWidth(width);
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

  // Use the custom hook to get warnings for clusters
  const clusterWarnings = useClusterWarnings(clusterNames);

  const [activeConfig, setActiveConfig] = useState<StoredProviderConfig | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<StoredProviderConfig[]>([]);

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
  }, [enabledTools, activeConfig, selectedModel, mcpConfigKey]);

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
    content: string | object,
    type: 'assistant' | 'user',
    hasError?: boolean
  ) => {
    let newPrompt: Prompt;

    // Handle tool confirmation objects
    if (typeof content === 'object' && content && 'toolConfirmation' in content) {
      newPrompt = {
        role: type,
        content: (content as any).content || '',
        error: hasError || false,
        toolConfirmation: (content as any).toolConfirmation,
        isDisplayOnly: (content as any).isDisplayOnly,
        requestId: (content as any).requestId,
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
        const retryPrompt: Prompt = {
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
        const errorPrompt: Prompt = {
          role: 'tool',
          content: JSON.stringify({
            error: true,
            message: `Failed to retry tool: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
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
    [aiManager, updateHistory]
  );

  // Agent mode: toggle handler – connects directly to the Holmes ag-ui server.
  // Ref to track the current agent message being built.
  // Intermediate text messages are accumulated as thinking steps;
  // the last message before RUN_FINISHED becomes the final answer.
  const agentMessageIdRef = React.useRef<string | null>(null);
  const agentTextBufferRef = React.useRef<string>('');
  const agentCurrentMsgIdRef = React.useRef<string>('');

  /** Classify an incoming text message from Holmes */
  const classifyAgentText = (text: string): 'tool-start' | 'tool-result' | 'todo-update' | 'intermediate-text' => {
    if (/^🔧\s*Using Agent tool:/.test(text)) return 'tool-start';
    if (/^🔧\s*\S+\s+result:/.test(text)) return 'tool-result';
    if (/^###\s*Investigation Tasks:/.test(text)) return 'todo-update';
    return 'intermediate-text';
  };

  const handleToggleAgentMode = React.useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        setAgentModeStatus('found');
        setIsAgentMode(true);

        // Create the HolmesAgent pointing directly at the ag-ui server
        const agent = new HolmesAgent(DEFAULT_AGUI_URL);
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
            // Mark thinking as done on the placeholder message
            setPromptHistory(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (
                  updated[i].role === 'assistant' &&
                  updated[i].agentThinkingSteps !== undefined &&
                  !updated[i].agentThinkingDone
                ) {
                  updated[i] = { ...updated[i], agentThinkingDone: true };
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

            // Update the placeholder assistant message:
            // - Intermediate messages go into agentThinkingSteps
            // - Each new message replaces content (final answer is the last one)
            setPromptHistory(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (
                  updated[i].role === 'assistant' &&
                  updated[i].agentThinkingSteps !== undefined &&
                  !updated[i].agentThinkingDone
                ) {
                  const existingSteps = updated[i].agentThinkingSteps || [];
                  // Move the previous content (if any) into thinking steps
                  const prevContent = updated[i].content || '';
                  let newSteps = [...existingSteps];
                  if (prevContent.trim()) {
                    const prevType = classifyAgentText(prevContent);
                    // Only add if it's not already the last step
                    const lastStep = newSteps[newSteps.length - 1];
                    if (!lastStep || lastStep.content !== prevContent) {
                      newSteps.push({
                        id: `step-prev-${i}-${newSteps.length}`,
                        content: prevContent,
                        type: prevType,
                        timestamp: Date.now(),
                      });
                    }
                  }
                  // The new text becomes the current content (potential final answer)
                  // We also add it as a thinking step since we don't know if it's final yet
                  newSteps.push({
                    id: `step-${msgId}`,
                    content: fullText,
                    type: stepType,
                    timestamp: Date.now(),
                  });
                  updated[i] = {
                    ...updated[i],
                    content: fullText,
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
          onToolCallEndEvent: ({ toolCallName, toolCallArgs }) => {
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
        setPromptHistory(prev => [
          ...prev,
          { role: 'system', content: 'Switched back to AI Chat mode.' },
        ]);
      }
    },
    []
  );

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
    // Generate a human-readable context description
    const contextDescription = generateContextDescription(
      event,
      currentCluster,
      clusterWarnings,
      selectedClusters && selectedClusters.length > 0 ? selectedClusters : undefined
    );
    // Add cluster group info if relevant
    let fullContext = contextDescription;
    if (currentClusterGroup && currentClusterGroup.length > 1) {
      fullContext = `Part of cluster group with ${currentClusterGroup.length} clusters\n${fullContext}`;
    }

    // Set the simplified context
    aiManager.setContext(fullContext);

    // Configure AI manager with tools
    if (aiManager.configureTools) {
      aiManager.configureTools(
        [], // No longer need to pass the tool definitions manually
        kubernetesContext
      );
    }
  }, [_pluginSetting.event, aiManager, clusterWarnings, selectedClusters, kubernetesContext]);

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
              loading={loading}
              onPromptSelect={prompt => setPromptVal(prompt)}
              onPromptSend={prompt => {
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
              enabledTools={enabledTools}
              isAgentMode={isAgentMode}
              agentModeStatus={agentModeStatus}
              onSend={prompt => {
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
              onToolsChange={newEnabledTools => {
                setEnabledTools(newEnabledTools);
                // Recreate AI manager with new tools
                handleChangeConfig(activeConfig, selectedModel);
              }}
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
