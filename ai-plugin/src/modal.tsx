import { Icon } from '@iconify/react';
import { ActionButton, Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useClustersConf, useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
import { getCluster, getClusterGroup } from '@kinvolk/headlamp-plugin/lib/Utils';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  ListSubheader,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import AIManager, { Prompt } from './ai/manager';
import ApiConfirmationDialog from './components/ApiConfirmationDialog';
import TestModeInput from './components/TestModeInput';
import { getProviderById } from './config/modelConfig';
import EditorDialog from './editordialog';
import { useClusterWarnings } from './hooks/useClusterWarnings';
import { useKubernetesToolUI } from './hooks/useKubernetesToolUI';
import LangChainManager from './langchain/LangChainManager';
import TextStreamContainer from './textstream';
import { getSettingsURL, useGlobalState } from './utils';
import { generateContextDescription } from './utils/contextGenerator';
import { useDynamicPrompts } from './utils/promptGenerator';
import {
  getActiveConfig,
  getSavedConfigurations,
  StoredProviderConfig,
} from './utils/ProviderConfigManager';

function markdownToPlainText(markdown: string): string {
  return (
    markdown
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove blockquotes
      .replace(/^\s*>+\s+/gm, '')
      // Remove horizontal rules
      .replace(/^-{3,}\s*$/gm, '')
      // Remove surrounding square brackets
      .replace(/^\[|\]$/g, '')
      .trim()
  );
}

// Utility function to parse suggestions from LLM response
function parseSuggestionsFromResponse(content: string): {
  cleanContent: string;
  suggestions: string[];
} {
  const suggestionPattern = /SUGGESTIONS:\s*(.+?)(?:\n|$)/i;
  const match = content.match(suggestionPattern);

  if (match) {
    const suggestionsText = match[1];
    const suggestions = suggestionsText
      .split('|')
      .map(s => markdownToPlainText(s.trim()))
      .filter(s => s.length > 0)
      .slice(0, 3); // Ensure max 3 suggestions

    // Remove the suggestions line from the content
    const cleanContent = content.replace(suggestionPattern, '').trim();

    return { cleanContent, suggestions };
  }

  return { cleanContent: content, suggestions: [] };
}

export default function AIPrompt(props: {
  openPopup: boolean;
  setOpenPopup: (...args) => void;
  pluginSettings: any;
}) {
  const { openPopup, setOpenPopup, pluginSettings } = props;
  const history = useHistory();
  const location = useLocation();
  const [promptError] = React.useState(false);
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
      console.log('Using selected clusters:', selectedClusters);
      return selectedClusters;
    }

    // Otherwise, use only the current cluster
    if (currentCluster) {
      console.log('Using current cluster:', currentCluster);
      return [currentCluster];
    }

    // Fallback to all clusters (shouldn't happen in normal usage)
    console.log('Fallback to all clusters:', Object.keys(clusters));
    return Object.keys(clusters);
  }, [selectedClusters, clusters]);

  // Use the custom hook to get warnings for clusters
  const clusterWarnings = useClusterWarnings(clusterNames);

  const [activeConfig, setActiveConfig] = useState<StoredProviderConfig | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<StoredProviderConfig[]>([]);
  const [defaultProviderIndex, setDefaultProviderIndex] = useState<number | undefined>(undefined);

  // Test mode detection
  const isTestMode = pluginSettings?.testMode || false;

  const [showEditor, setShowEditor] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState('');
  const [editorTitle, setEditorTitle] = React.useState('');
  const [resourceType, setResourceType] = React.useState('');
  const [isDelete, setIsDelete] = React.useState(false);

  // Use the Kubernetes tool UI hook
  const { state: kubernetesUI, callbacks: kubernetesCallbacks } = useKubernetesToolUI();

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
    setDefaultProviderIndex(savedConfigs.defaultProviderIndex);

    // Always try to get the default provider first
    const active = getActiveConfig(savedConfigs);

    if (active) {
      setActiveConfig(active);
      // Set the default model for the active provider
      const defaultModel = getProviderModels(active)[0] || 'default';
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
    setDefaultProviderIndex(savedConfigs.defaultProviderIndex);

    // Check if the current active config still exists
    if (activeConfig) {
      const stillExists = newProviders.find(
        (p) =>
          p.providerId === activeConfig.providerId &&
          p.config.apiKey === activeConfig.config.apiKey
      );

      if (!stillExists) {
        // Active provider was deleted, switch to a new one or clear
        const newActive = getActiveConfig(savedConfigs);

        if (newActive) {
          // Switch to the new default provider
          setActiveConfig(newActive);
          _pluginSetting.setActiveProvider(newActive);

          // Set the default model for the new provider
          const defaultModel = getProviderModels(newActive)[0] || 'default';
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

  const handleChangeConfig = (config: StoredProviderConfig, model?: string) => {
    if (!config) return;
    if (
      !activeConfig ||
      activeConfig.providerId !== config.providerId ||
      activeConfig.config.apiKey !== config.config.apiKey ||
      JSON.stringify(activeConfig.config) !== JSON.stringify(config.config) ||
      selectedModel !== model
    ) {
      setPromptHistory([]);
      setPromptVal('');
      setApiError(null);
      setActiveConfig(config);
      setSelectedModel(model || (getProviderModels(config)[0] || 'default'));
      _pluginSetting.setActiveProvider(config);
      if (aiManager) {
        aiManager.reset();
        setAiManager(null);
        setTimeout(() => {
          const providerName = config.displayName || getProviderById(config.providerId)?.name || config.providerId;
          setPromptHistory([
            {
              role: 'system',
              content: `Switched to ${providerName}${model ? ' / ' + model : ''}. History has been cleared.`,
            },
          ]);
        }, 100);
      } else {
        const providerName = config.displayName || getProviderById(config.providerId)?.name || config.providerId;
        setPromptHistory([
          {
            role: 'system',
            content: `Using ${providerName}${model ? ' / ' + model : ''}.`,
          },
        ]);
      }
    }
  };

  React.useEffect(() => {
    if (!aiManager && pluginSettings) {
      // If we have an active config from the new format, use it
      if (activeConfig) {
        try {
          // Create config with selected model
          const configWithModel = {
            ...activeConfig.config,
            model: selectedModel
          };
          const newManager = new LangChainManager(activeConfig.providerId, configWithModel);
          setAiManager(newManager);
          return;
        } catch (error) {
          setApiError(`Failed to initialize AI model: ${error.message}`);
        }
      }
    }
  }, [pluginSettings, activeConfig, selectedModel]);

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
  }, [aiManager]);

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

    // If in test mode, just add the user prompt to history and return
    if (isTestMode) {
      const userPrompt: Prompt = {
        role: 'user',
        content: prompt,
      };
      setPromptHistory(prev => [...prev, userPrompt]);
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

      // Update history
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
      resourceInfo
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
  const kubernetesContext = useMemo(() => ({
    ui: kubernetesUI,
    callbacks: {
      ...kubernetesCallbacks,
      handleActualApiRequest: (url, method, body, onClose, aiManagerParam, resourceInfo, targetCluster) => {
        // If no specific cluster is provided, use the first available cluster
        const clusterToUse = targetCluster || 
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
          clusterToUse
        );
      },
    },
    selectedClusters,
    aiManager, // Add the AI manager to the context
  }), [kubernetesUI, kubernetesCallbacks, selectedClusters, aiManager, clusters]);

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
  }, [
    _pluginSetting.event,
    aiManager,
    clusterWarnings,
    selectedClusters,
    kubernetesContext,
  ]);

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

  // Helper function to suggest safe Kubernetes prompts when content filters are triggered
  const getSafePromptSuggestions = () => {
    return [
      "How do I troubleshoot a Pod that's in CrashLoopBackOff state?",
      'Explain Kubernetes resource limits and requests',
      'How do I set up an Ingress controller for my application?',
      "What's the difference between a Deployment and a StatefulSet?",
      'Show me an example of a ConfigMap',
    ];
  };

  // Get provider display name from the active configuration
  const getProviderDisplayName = () => {
    return 'AI';
  };

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
    return !hasConversationMessages && !loading;
  }, [hasValidConfig, activeConfig, promptHistory, loading]);

  // Memoize the history array to prevent unnecessary re-renders of TextStreamContainer
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
        <Box
          sx={{
            padding: 1,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              {getProviderDisplayName()} Assistant (beta)
              {isTestMode && (
                <Chip
                  label="TEST MODE"
                  color="warning"
                  size="small"
                  sx={{ ml: 1, fontSize: '0.7rem' }}
                />
              )}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ActionButton
              description="Settings"
              onClick={() => {
                history.push(getSettingsURL());
              }}
              icon="mdi:settings"
              iconButtonProps={{
                disabled: disableSettingsButton,
              }}
            />
            <ActionButton
              description="Close"
              onClick={() => {
                setOpenPopup(false);
              }}
              icon="mdi:close"
            />
          </Box>
        </Box>

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
            {apiError && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" size="small">
                    <Link
                      routeName="pluginDetails"
                      params={{
                        name: '@headlamp-k8s/headlamp-ai',
                      }}
                    >
                      Settings
                    </Link>
                  </Button>
                }
              >
                {apiError}
              </Alert>
            )}

            <TextStreamContainer
              history={memoizedHistory}
              isLoading={loading}
              apiError={apiError}
              onOperationSuccess={handleOperationSuccess}
              onYamlAction={handleYamlAction}
            />
          </Grid>
          <Grid
            item
            sx={{
              paddingY: 1,
            }}
          >
            {!loading && (
              <Box>
                {/* Show safe suggestions when there was a content filter error */}
                {apiError && apiError.includes('content filter') ? (
                  <>
                    <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                      Try one of these safe Kubernetes questions instead:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {getSafePromptSuggestions().map((prompt, i) => (
                        <Chip
                          key={i}
                          label={prompt}
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => {
                            setPromptVal(prompt);
                          }}
                          onDelete={() => {
                            setApiError(null);
                            AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                              setApiError(error.message);
                            });
                          }}
                          deleteIcon={<Icon icon="mdi:send" width="20px" />}
                          sx={{
                            height: 'auto',
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              textAlign: 'left',
                              display: 'block',
                              padding: '4px 8px',
                              minHeight: '16px',
                              fontSize: '0.92em',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </>
                ) : (
                  // Regular suggestions
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} mb={1}>
                    {suggestions.map(prompt => {
                      return (
                        <Chip
                          key={prompt}
                          label={prompt}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setPromptVal(prompt);
                          }}
                          onDelete={() => {
                            AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                              setApiError(error.message);
                            });
                          }}
                          deleteIcon={<Icon icon="mdi:send" width="20px" />}
                          sx={{
                            height: 'auto',
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              textAlign: 'left',
                              display: 'block',
                              padding: '4px 8px',
                              minHeight: '16px',
                              fontSize: '0.92em',
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}
            <Box>
              {/* Test Mode Input Component */}
              <TestModeInput onAddTestResponse={handleTestModeResponse} isTestMode={isTestMode} />

              <TextField
                id="deployment-ai-prompt"
                onChange={event => {
                  setPromptVal(event.target.value);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const prompt = promptVal;
                    setPromptVal('');

                    AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                      setApiError(error.message);
                    });
                  }
                }}
                variant="outlined"
                value={promptVal}
                label={isTestMode ? 'Type user message (Test Mode)' : 'Ask AI'}
                multiline
                fullWidth
                minRows={2}
                sx={{
                  width: '100%',
                  '& .MuiInputBase-root': {
                    wordWrap: 'break-word',
                    overflowX: 'hidden',
                  },
                }}
                error={promptError}
                helperText={
                  promptError ? 'Please select from one of the provided prompts above' : ''
                }
              />
              <Grid container justifyContent="space-between" alignItems="center">
                <Grid item sx={{ display: 'flex', alignItems: 'center' }}>
                  <ActionButton
                    description="Clear History"
                    onClick={() => {
                      if (isTestMode) {
                        setPromptHistory([]);
                      } else {
                        aiManager?.reset();
                        updateHistory();
                      }
                    }}
                    icon="mdi:broom"
                  />

                  {/* Provider Selection Dropdown */}
                  {availableConfigs.length > 0 && !isTestMode && (
                    <Box ml={2} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Select
                        value={(() => {
                          if (!activeConfig) return 'default-default';
                          const providerId = activeConfig.providerId;
                          const modelName = selectedModel;
                          return `${providerId}-${modelName}`;
                        })()}
                        onChange={e => {
                          const [providerId, ...modelNameParts] = String(e.target.value).split('-');
                          const modelName = modelNameParts.join('-');
                          const newConfig = availableConfigs.find(c => c.providerId === providerId);
                          if (newConfig) {
                            setActiveConfig(newConfig);
                            setSelectedModel(modelName);
                            handleChangeConfig(newConfig, modelName);
                          }
                        }}
                        size="small"
                        sx={{ minWidth: 180, height: 32 }}
                        variant="outlined"
                        renderValue={selected => {
                          const [providerId, ...modelNameParts] = String(selected).split('-');
                          const modelName = modelNameParts.join('-');
                          const selectedConfig = availableConfigs.find(c => c.providerId === providerId);
                          const providerInfo = selectedConfig ? getProviderById(selectedConfig.providerId) : null;
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {providerInfo && (
                                <Icon icon={providerInfo.icon || 'mdi:robot'} width="16px" height="16px" style={{ marginRight: 4 }} />
                              )}
                              <Typography variant="body2" noWrap>
                                {getModelDisplayName(modelName)}
                              </Typography>
                            </Box>
                          );
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 320,
                            },
                          },
                        }}
                      >
                        {availableConfigs.map((config) => {
                          const providerInfo = getProviderById(config.providerId);
                          const models = getProviderModels(config);
                          return [
                            <ListSubheader key={`provider-header-${config.providerId}`}
                              sx={{ display: 'flex', alignItems: 'center', paddingLeft: 1 }}
                            >
                              <Icon icon={providerInfo?.icon || 'mdi:robot'} width="16px" height="16px" style={{ marginRight: 8 }} />
                              {config.displayName || providerInfo?.name || config.providerId}
                            </ListSubheader>,
                            ...models.map(model => (
                              <MenuItem
                                key={`${config.providerId}-${model}`}
                                value={`${config.providerId}-${model}`}
                                selected={
                                  activeConfig?.providerId === config.providerId &&
                                  selectedModel === model
                                }
                                sx={{ paddingLeft: 2 }}
                              >
                                <Typography variant="body2">
                                  {getModelDisplayName(model)}
                                </Typography>
                                {defaultProviderIndex !== undefined &&
                                  availableConfigs[defaultProviderIndex]?.providerId === config.providerId &&
                                  model === (getProviderModels(config)[0] || 'default') && (
                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: 'primary.main' }}>
                                      (Default)
                                    </Typography>
                                  )}
                              </MenuItem>
                            ))
                          ];
                        })}
                      </Select>
                    </Box>
                  )}
                </Grid>

                <Grid item>
                  {loading ? (
                    <Button
                      variant="contained"
                      color="secondary"
                      endIcon={<Icon icon="mdi:stop" width="20px" />}
                      onClick={handleStopRequest}
                      size="small"
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      endIcon={<Icon icon="mdi:send" width="20px" />}
                      onClick={() => {
                        updateHistory();
                        setPromptVal('');
                        const prompt = promptVal;
                        AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                          setApiError(error.message);
                        });
                      }}
                      size="small"
                      disabled={loading || !promptVal}
                    >
                      Send
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Box>
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

// Helper to get all models for a provider
const getProviderModels = (providerConfig: StoredProviderConfig) => {
  const providerInfo = getProviderById(providerConfig.providerId);

  // First try to use the models field, then fall back to options from the model field
  if (providerInfo?.models && providerInfo.models.length > 0) {
    return providerInfo.models;
  }

  // Fall back to options from the model field configuration
  const modelField = providerInfo?.fields?.find(field => field.name === 'model');
  if (modelField?.options && modelField.options.length > 0) {
    return modelField.options;
  }

  return ['default'];
};

// Helper to get display name for a model
const getModelDisplayName = (model: string) => {
  // You can customize this if you want more user-friendly names
  return model;
};
