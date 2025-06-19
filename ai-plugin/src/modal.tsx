import { Icon } from '@iconify/react';
import { ActionButton, Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster, getClusterGroup } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useClustersConf, useSelectedClusters } from '@kinvolk/headlamp-plugin/lib/k8s';
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
import { getProviderById } from './config/modelConfig';
import EditorDialog from './editordialog';
import { handleActualApiRequest } from './helper/apihelper';
import LangChainManager from './langchain/LangChainManager';
import OpenAIManager from './openai/manager';
import TextStreamContainer from './textstream';
import { getSettingsURL, useGlobalState } from './utils';
import { useDynamicPrompts } from './utils/promptGenerator';
import {
  getActiveConfig,
  getSavedConfigurations,
  StoredProviderConfig,
} from './utils/ProviderConfigManager';
const maxCharLimit = 3000;
function summarizeKubeObject(obj) {
  if (obj.kind === 'Event') {
    return {
      kind: obj.kind,
      metadata: {
        name: obj.metadata.name,
        namespace: obj.metadata.namespace,
      },
      involvedObject: {
        kind: obj.involvedObject.kind,
        name: obj.involvedObject.name,
        namespace: obj.involvedObject.namespace,
      },
      reason: obj.reason,
    };
  }

  const summarizedObj = {
    kind: obj.kind,
    metadata: {
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
    },
  };

  if (obj.metadata.namespace) {
    summarizedObj.metadata['namespace'] = obj.metadata.namespace;
  }

  return summarizedObj;
}

function summarizeKubeObjectIfNeeded(obj) {
  const objsData = {
    object: obj,
    summarized: false,
  };
  let objStr = JSON.stringify(obj);
  // @todo: We should measure the number of tokens, but we count the chars for now which
  // will "almost certainly" be less than the token count.
  if (objStr.length < maxCharLimit) {
    return objsData;
  }

  // Remove the annotations from this k8s object
  let simplifiedObj = {
    ...obj,
  };
  if (simplifiedObj.metadata?.annotations) {
    delete simplifiedObj.metadata.annotations;
  }
  if (simplifiedObj.metadata?.managedFields) {
    delete simplifiedObj.metadata.managedFields;
  }

  objStr = JSON.stringify(simplifiedObj);
  if (objStr.length >= maxCharLimit) {
    simplifiedObj = summarizeKubeObject(obj);
    // If the very simplified object is under the limit, try including
    // the spec (if it applies).
    if (JSON.stringify(simplifiedObj).length < maxCharLimit) {
      if (!!obj.spec) {
        const simplifiedObjWithSpec = { ...simplifiedObj };
        simplifiedObjWithSpec.spec = obj.spec;

        if (JSON.stringify(simplifiedObjWithSpec).length < maxCharLimit) {
          simplifiedObj = simplifiedObjWithSpec;
        }
      }
    }
  }

  objsData.object = simplifiedObj;
  objsData.summarized = true;
  return objsData;
}

function summarizeKubeObjectListIfNeeded(objList) {
  const objsListData = {
    list: objList,
    summarized: false,
  };
  const objListStr = JSON.stringify(objList);
  // @todo: We should measure the number of tokens, but we count the chars for now which
  // will "almost certainly" be less than the token count.
  if (objListStr.length < maxCharLimit) {
    return objsListData;
  }

  objsListData.list = objList.map(summarizeKubeObject);
  objsListData.summarized = true;
  return objsListData;
}

function getWarningsContext(events): [string, ReturnType<typeof summarizeKubeObjectListIfNeeded>] {
  const warnings = events.filter(e => e.type === 'Warning').map(e => e.jsonData);
  return ['clusterWarnings', summarizeKubeObjectListIfNeeded(warnings)];
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

  const [activeConfig, setActiveConfig] = useState<StoredProviderConfig | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<StoredProviderConfig[]>([]);

  const [showEditor, setShowEditor] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState('');
  const [editorTitle, setEditorTitle] = React.useState('');
  const [resourceType, setResourceType] = React.useState('');
  const [isDelete, setIsDelete] = React.useState(false);
  const [showApiConfirmation, setShowApiConfirmation] = React.useState(false);
  const [apiRequest, setApiRequest] = React.useState<{
    url: string;
    method: string;
    body?: string;
    cluster?: string;
    toolCallId?: string;
    pendingPrompt?: Prompt;
  } | null>(null);
  const [apiResponse, setApiResponse] = React.useState<any>(null);
  const [apiLoading, setApiLoading] = React.useState(false);
  const [apiRequestError, setApiRequestError] = React.useState<string | null>(null);

  const handleOperationSuccess = (response: any) => {
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
  };

  const handleYamlAction = (yaml: string, title: string, type: string, isDeleteOp: boolean) => {
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
  };

  // Initialize active configuration from plugin settings
  useEffect(() => {
    // If we already have an active config, no need to reinitialize
    if (activeConfig) return;
    if (!pluginSettings) return;

    const savedConfigs = getSavedConfigurations(pluginSettings);
    console.log('Saved configurations:', savedConfigs);
    setAvailableConfigs(savedConfigs.providers || []);

    // Always try to get the default provider first
    const defaultConfig = savedConfigs.providers.find(p => p.isDefault);
    const active = defaultConfig || getActiveConfig(savedConfigs);

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
      console.log(
        `Switching provider from ${activeConfig?.providerId || 'none'} to ${config.providerId}`
      );

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
      console.log(
        'Initializing AI manager with settings:',
        JSON.stringify({
          ...pluginSettings,
          API_KEY: pluginSettings.API_KEY ? '[REDACTED]' : undefined,
          config: pluginSettings.config
            ? {
                ...pluginSettings.config,
                apiKey: pluginSettings.config.apiKey ? '[REDACTED]' : undefined,
              }
            : undefined,
        })
      );

      // If we have an active config from the new format, use it
      if (activeConfig) {
        try {
          console.log(`Creating new LangChainManager with provider: ${activeConfig.providerId}`);
          const newManager = new LangChainManager(activeConfig.providerId, activeConfig.config);
          setAiManager(newManager);
          return;
        } catch (error) {
          console.error('Error initializing LangChainManager with active config:', error);
          setApiError(`Failed to initialize AI model: ${error.message}`);
        }
      }

      // Legacy support for OpenAI and Azure OpenAI
      const { provider, config } = pluginSettings;

      // If provider is set to langchain model
      if (provider && config) {
        try {
          console.log(`Creating new LangChainManager with provider: ${provider}`);
          // Make sure all required fields are present
          const newManager = new LangChainManager(provider, config);
          setAiManager(newManager);
          return;
        } catch (error) {
          console.error('Error initializing LangChainManager:', error);
          setApiError(
            `Failed to initialize ${provider} model: ${error.message}. Please check your settings.`
          );
        }
      }

      // Legacy support for OpenAI and Azure OpenAI
      if (pluginSettings.API_KEY) {
        const isAzure = pluginSettings.API_TYPE === 'azure';
        console.log(`Creating legacy OpenAIManager with isAzure=${isAzure}`);

        if (isAzure && pluginSettings.DEPLOYMENT_NAME && pluginSettings.ENDPOINT) {
          try {
            setAiManager(
              new OpenAIManager(
                pluginSettings.API_KEY,
                pluginSettings.GPT_MODEL,
                pluginSettings.ENDPOINT,
                pluginSettings.DEPLOYMENT_NAME
              )
            );
          } catch (error) {
            console.error('Error initializing OpenAIManager for Azure:', error);
            setApiError(
              `Failed to initialize Azure OpenAI model: ${error.message}. Please update your Azure OpenAI settings.`
            );
          }
        } else if (!isAzure && pluginSettings.GPT_MODEL) {
          try {
            setAiManager(new OpenAIManager(pluginSettings.API_KEY, pluginSettings.GPT_MODEL));
          } catch (error) {
            console.error('Error initializing OpenAIManager:', error);
            setApiError(
              `Failed to initialize OpenAI model: ${error.message}. Please update your OpenAI settings.`
            );
          }
        } else {
          console.error(
            'Incomplete OpenAI configuration:',
            isAzure ? 'Missing DEPLOYMENT_NAME or ENDPOINT' : 'Missing GPT_MODEL'
          );
          setApiError(
            isAzure
              ? 'Missing Azure OpenAI configuration. Please check your settings and provide all required fields.'
              : 'Missing OpenAI configuration. Please check your settings and provide all required fields.'
          );
        }
      }
    }
  }, [pluginSettings, activeConfig]);

  const updateHistory = React.useCallback(() => {
    setPromptHistory(aiManager?.history ?? []);
  }, [aiManager]);

  async function AnalyzeResourceBasedOnPrompt(prompt: string) {
    setOpenPopup(true);
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
    if (!apiRequest) return;

    const { url, method } = apiRequest;
    setApiRequest(null);

    await handleActualApiRequest(url, method, body, handleApiDialogClose, aiManager, resourceInfo);
  };

  const handleApiDialogClose = () => {
    setShowApiConfirmation(false);
    setApiRequest(null);
    setApiResponse(null);
    setApiRequestError(null);
    setApiLoading(false);
  };

  React.useEffect(() => {
    if (!aiManager) {
      return;
    }
    const ctx = {};

    const event = _pluginSetting.event;
    const items = event?.items;
    const resource = event?.resource;
    const title = event?.title || event?.type;
    const currentCluster = getCluster();
    const currentClusterGroup = getClusterGroup();
    const errors = event?.errors;
    const events = event?.objectEvent?.events;
    if (!!events) {
      const [contextId, warnings] = getWarningsContext(events);
      aiManager.addContext(contextId, warnings);
    }

    aiManager.addContext('configuredClusters', clusters);
    if (currentClusterGroup.length > 1) {
      aiManager.addContext('currentlyInAClusterGroup', currentClusterGroup);
    } else if (!!currentCluster) {
      aiManager.addContext('currentCluster', currentCluster);
    }

    if (!!errors) {
      aiManager.addContext('errors', {
        errors: errors,
      });
    }
    if (!!items) {
      const objList = summarizeKubeObjectListIfNeeded(items);
      aiManager.addContext('resourceList', {
        ...objList,
        listKind: title,
      });
    }

    if (!!resource) {
      const resourceName = !!title ? `${title} details` : 'resource details';
      ctx[resourceName] = resource;
      aiManager.addContext('resourceDetails', summarizeKubeObjectIfNeeded(resource));
    }

    // Configure AI manager with tools
    if (aiManager.configureTools) {
      aiManager.configureTools(
        [
          {
            type: 'function',
            function: {
              name: 'http_request',
              description:
                'HTTP Request to a kubernetes API server, kube-apiserver. Use for all operations including fetching pod logs and filtering resources. If cluster is not provided, the user will be prompted to select from available clusters.',
              parameters: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description:
                      'URL to request. Examples:\n' +
                      '- List all pods: /api/v1/pods\n' +
                      '- List pods in namespace: /api/v1/namespaces/default/pods\n' +
                      '- List pods with field selector: /api/v1/pods?fieldSelector=status.phase=Failed\n' +
                      '- List pods with label selector: /api/v1/pods?labelSelector=app=nginx\n' +
                      '- Get pod logs: /api/v1/namespaces/default/pods/podinfo-123/log?container=podinfod&tailLines=100\n' +
                      '- List deployments: /apis/apps/v1/deployments\n' +
                      '- List services: /api/v1/services',
                  },
                  method: {
                    type: 'string',
                    description: 'HTTP method to use. Common values: GET, POST, PATCH, DELETE',
                    enum: ['GET', 'POST', 'PATCH', 'DELETE'],
                  },
                  body: {
                    type: 'string',
                    description: 'HTTP request body, required for POST/PATCH operations',
                  },
                  cluster: {
                    type: 'string',
                    description:
                      'Kubernetes cluster identifier. Available clusters: ' +
                      JSON.stringify(selectedClusters),
                  },
                },
                required: ['url', 'method'],
                additionalProperties: false,
              },
            },
          },
        ],
        async (url, method, body = '', cluster = '') => {
          if (!cluster) {
            setApiError(
              'Cluster not specified. Please choose one from: ' + JSON.stringify(selectedClusters)
            );
            return;
          }
          setApiRequest({ url, method, body, cluster });
          setShowApiConfirmation(true);
        }
      );
    }
  }, [_pluginSetting.event, aiManager]);

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

  // If panel is not open, don't render
  if (!openPopup) return null;

  // Check if we have any valid configuration
  const hasLegacyConfig =
    (pluginSettings?.API_TYPE === 'azure' &&
      pluginSettings?.DEPLOYMENT_NAME &&
      pluginSettings?.API_KEY &&
      pluginSettings?.GPT_MODEL) ||
    (pluginSettings?.API_TYPE !== 'azure' && pluginSettings?.API_KEY && pluginSettings?.GPT_MODEL);

  const savedConfigs = getSavedConfigurations(pluginSettings);
  const hasAnyValidConfig = savedConfigs.providers && savedConfigs.providers.length > 0;
  const hasValidConfig = hasLegacyConfig || hasAnyValidConfig;

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
            <Typography variant="h6">{getProviderDisplayName()} Assistant (beta)</Typography>
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
              history={promptHistory}
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
                    {getSafePromptSuggestions().map((prompt, i) => (
                      <Box m={1} key={i}>
                        <Chip
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
                              console.log(error);
                              setApiError(error.message);
                            });
                          }}
                          deleteIcon={<Icon icon="mdi:send" width="20px" />}
                          sx={{
                            maxWidth: '100%',
                            height: 'auto',
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              textAlign: 'left',
                              padding: '8px 12px',
                              display: 'block',
                              minHeight: '24px',
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </>
                ) : (
                  // Regular suggestions
                  suggestions.map(prompt => {
                    return (
                      <Box m={1} key={prompt}>
                        <Chip
                          label={prompt}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setPromptVal(prompt);
                          }}
                          onDelete={() => {
                            AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
                              console.log(error);
                              setApiError(error.message);
                            });
                          }}
                          deleteIcon={<Icon icon="mdi:send" width="20px" />}
                          sx={{
                            maxWidth: '100%',
                            height: 'auto',
                            '& .MuiChip-label': {
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              textAlign: 'left',
                              padding: '8px 12px',
                              display: 'block',
                              minHeight: '24px',
                            },
                          }}
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
            )}
            <Box>
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
                      console.log(error);
                      setApiError(error.message);
                    });
                  }
                }}
                variant="outlined"
                value={promptVal}
                label="Ask AI"
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
                      aiManager?.reset();
                      updateHistory();
                    }}
                    icon="mdi:broom"
                  />

                  {/* Provider Selection Dropdown */}
                  {availableConfigs.length > 1 && (
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
                                {config.isDefault && (
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
        open={showApiConfirmation}
        onClose={handleApiDialogClose}
        method={apiRequest?.method || ''}
        url={apiRequest?.url || ''}
        body={apiRequest?.body}
        onConfirm={handleApiConfirmation}
        isLoading={apiLoading}
        result={apiResponse}
        error={apiRequestError}
      />
    </div>
  );
}
