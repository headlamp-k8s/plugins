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

  // Get cluster names for warning lookup
  const clusterNames = useMemo(() => {
    return Object.keys(clusters);
  }, [clusters]);

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

      // Update global state with all providers and active one
      _pluginSetting.setSavedProviders(savedConfigs.providers || []);
      _pluginSetting.setActiveProvider(active);
    }
  }, [pluginSettings]);

  // Handle changing the active configuration
  const handleChangeConfig = (config: StoredProviderConfig) => {
    if (!config) return;

    // Only reset if we're actually changing the configuration
    if (
      !activeConfig ||
      activeConfig.providerId !== config.providerId ||
      activeConfig.config.apiKey !== config.config.apiKey ||
      JSON.stringify(activeConfig.config) !== JSON.stringify(config.config)
    ) {
      // Immediately clear prompt history for better UX
      setPromptHistory([]);
      setPromptVal('');

      // Clear any errors when changing provider
      setApiError(null);

      // Update active config
      setActiveConfig(config);

      // Update the global state with the active provider
      _pluginSetting.setActiveProvider(config);

      // Reset the AI manager to reinitialize with new settings
      if (aiManager) {
        aiManager.reset();
        setAiManager(null);

        // Add a system message indicating the provider change
        setTimeout(() => {
          const providerName =
            config.displayName || getProviderById(config.providerId)?.name || config.providerId;

          setPromptHistory([
            {
              role: 'system',
              content: `Switched to ${providerName}. History has been cleared.`,
            },
          ]);
        }, 100);
      } else {
        // Even if there's no AI manager yet, still show the provider change message
        const providerName =
          config.displayName || getProviderById(config.providerId)?.name || config.providerId;

        setPromptHistory([
          {
            role: 'system',
            content: `Using ${providerName}.`,
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
          const newManager = new LangChainManager(activeConfig.providerId, activeConfig.config);
          setAiManager(newManager);
          return;
        } catch (error) {
          setApiError(`Failed to initialize AI model: ${error.message}`);
        }
      }
    }
  }, [pluginSettings, activeConfig]);

  const updateHistory = React.useCallback(() => {
    setPromptHistory(aiManager?.history ?? []);
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

      // Keep API error null since we're handling it in the prompt
      setApiError(null);
    } finally {
      setLoading(false);
    }
  }

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

  React.useEffect(() => {
    if (!aiManager) {
      return;
    }

    const event = _pluginSetting.event;
    const currentCluster = getCluster();
    const currentClusterGroup = getClusterGroup();

    // Generate a human-readable context description
    const contextDescription = generateContextDescription(event, currentCluster, clusterWarnings);

    // Add cluster group info if relevant
    let fullContext = contextDescription;
    if (currentClusterGroup && currentClusterGroup.length > 1) {
      fullContext = `Part of cluster group with ${currentClusterGroup.length} clusters\n${fullContext}`;
    }

    // Set the simplified context
    aiManager.setContext(fullContext);

    // Configure AI manager with tools
    if (aiManager.configureTools) {
      // Create the Kubernetes tool context
      const kubernetesContext = {
        ui: kubernetesUI,
        callbacks: {
          ...kubernetesCallbacks,
          handleActualApiRequest: (url, method, body, onClose, aiManagerParam, resourceInfo) =>
            kubernetesCallbacks.handleActualApiRequest(
              url,
              method,
              body,
              onClose,
              aiManagerParam || aiManager,
              resourceInfo
            ),
        },
        selectedClusters,
        aiManager, // Add the AI manager to the context
      };

      aiManager.configureTools(
        [], // No longer need to pass the tool definitions manually
        kubernetesContext
      );
    }
  }, [
    _pluginSetting.event,
    aiManager,
    clusterWarnings,
    kubernetesUI,
    kubernetesCallbacks,
    selectedClusters,
  ]);

  useEffect(() => {
    if (openPopup && aiManager) {
      // Use all context-aware prompts
      setSuggestions(dynamicPrompts);
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
                  {availableConfigs.length > 1 && !isTestMode && (
                    <Box ml={2} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Select
                        value={(() => {
                          if (!activeConfig) return 0;
                          const index = availableConfigs.findIndex(
                            c =>
                              c.providerId === activeConfig.providerId &&
                              c.config.apiKey === activeConfig.config.apiKey
                          );
                          return index >= 0 ? index : 0;
                        })()}
                        onChange={e => {
                          // Get configuration by index
                          const configIndex = e.target.value as number;
                          const newConfig = availableConfigs[configIndex];
                          if (newConfig) handleChangeConfig(newConfig);
                        }}
                        size="small"
                        sx={{ minWidth: 120, height: 32 }}
                        variant="outlined"
                        renderValue={selected => {
                          const selectedIndex = selected as number;
                          // Safety check to ensure the index is valid
                          if (selectedIndex < 0 || selectedIndex >= availableConfigs.length) {
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Icon
                                  icon="mdi:robot"
                                  width="16px"
                                  height="16px"
                                  style={{ marginRight: 4 }}
                                />
                                <Typography variant="body2" noWrap>
                                  Select Provider
                                </Typography>
                              </Box>
                            );
                          }

                          const selectedConfig = availableConfigs[selectedIndex];
                          const providerInfo = getProviderById(selectedConfig.providerId);
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Icon
                                icon={providerInfo?.icon || 'mdi:robot'}
                                width="16px"
                                height="16px"
                                style={{ marginRight: 4 }}
                              />
                              <Typography variant="body2" noWrap>
                                {selectedConfig.displayName ||
                                  providerInfo?.name ||
                                  selectedConfig.providerId}
                              </Typography>
                            </Box>
                          );
                        }}
                      >
                        {availableConfigs.map((config, index) => {
                          // Find provider info for icon
                          const providerInfo = getProviderById(config.providerId);

                          return (
                            <MenuItem
                              key={index}
                              value={index}
                              selected={
                                activeConfig?.providerId === config.providerId &&
                                activeConfig?.config.apiKey === config.config.apiKey
                              }
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Icon
                                  icon={providerInfo?.icon || 'mdi:robot'}
                                  width="16px"
                                  height="16px"
                                  style={{ marginRight: 8 }}
                                />
                                <Typography variant="body2">
                                  {config.displayName || providerInfo?.name || config.providerId}
                                </Typography>
                                {defaultProviderIndex === index && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ ml: 1, color: 'primary.main' }}
                                  >
                                    (Default)
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </Box>
                  )}
                </Grid>

                <Grid item>
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
