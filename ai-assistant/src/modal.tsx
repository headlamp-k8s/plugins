import { Icon } from '@iconify/react';
import { useClustersConf, useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster, getClusterGroup } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Button, Grid, Typography } from '@mui/material';
import { isEqual } from 'lodash';
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
import { getProviderModels, parseSuggestionsFromResponse } from './utils/modalUtils';
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

  // Use the custom hook to get warnings for clusters
  const clusterWarnings = useClusterWarnings(clusterNames);

  const [activeConfig, setActiveConfig] = useState<StoredProviderConfig | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<StoredProviderConfig[]>([]);

  const [enabledTools, setEnabledTools] = React.useState<string[]>(
    getEnabledToolIds(pluginSettings)
  );

  // Test mode detection
  const isTestMode = isTestModeCheck();

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

  // Function to stop the current request
  const handleStopRequest = () => {
    if (aiManager && loading) {
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

  // Check if we have any valid configuration
  const savedConfigs = getSavedConfigurations(pluginSettings);
  const hasAnyValidConfig = savedConfigs.providers && savedConfigs.providers.length > 0;
  const hasValidConfig = hasAnyValidConfig;

  // Helper function to check if we should show greeting - memoized for performance
  const shouldShowGreeting = React.useMemo(() => {
    // Only show greeting if we have a valid configuration
    if (!hasValidConfig || !activeConfig) return false;

    // Only show if history is empty or contains only system messages
    const hasConversationMessages = promptHistory.some(
      msg => (msg.role === 'user' || msg.role === 'assistant') && !msg.isDisplayOnly
    );
    return !hasConversationMessages; // Removed dependency on loading state
  }, [hasValidConfig, activeConfig, promptHistory]); // Removed loading from dependencies

  // Memoize the history array to prevent unnecessary re-renders of AIChatContent
  const memoizedHistory = React.useMemo(() => {
    if (shouldShowGreeting) {
      return [getGreetingMessage, ...promptHistory];
    }
    return promptHistory;
  }, [shouldShowGreeting, getGreetingMessage, promptHistory]);

  // If no valid configuration, show setup message
  if (!hasValidConfig) {
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
          page.
        </Typography>
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
              onSend={prompt => {
                AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                  setApiError(error.message);
                });
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
