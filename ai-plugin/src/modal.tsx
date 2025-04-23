import { Icon } from '@iconify/react';
import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Button, Chip, Drawer, Grid, Paper, TextField, Typography } from '@mui/material';
import React from 'react';
import YAML from 'yaml';
import AIManager, { Prompt } from './ai/manager';
import ApiConfirmationDialog from './components/ApiConfirmationDialog';
import { getProviderById } from './config/modelConfig';
import EditorDialog from './editordialog';
import LangChainManager from './langchain/LangChainManager';
import OpenAIManager from './openai/manager';
import TextStreamContainer from './textstream';
import { useGlobalState } from './utils';

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

  const [promptError] = React.useState(false);
  const rootRef = React.useRef(null);
  const [promptVal, setPromptVal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);
  const [aiManager, setAiManager] = React.useState<AIManager | null>(null);
  const _pluginSetting = useGlobalState();
  const [promptHistory, setPromptHistory] = React.useState<Prompt[]>([]);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);

  // Editor dialog state
  const [showEditor, setShowEditor] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState('');
  const [editorTitle, setEditorTitle] = React.useState('');
  const [resourceType, setResourceType] = React.useState('');
  const [isDelete, setIsDelete] = React.useState(false);

  // API confirmation dialog state
  const [showApiConfirmation, setShowApiConfirmation] = React.useState(false);
  const [apiRequest, setApiRequest] = React.useState<{
    url: string;
    method: string;
    body?: string;
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

  const handleExamplePrompt = (kind: string) => {
    const prompt = `Show me an example of a Kubernetes ${kind} and explain how it works`;
    AnalyzeResourceBasedOnPrompt(prompt).catch(error => {
      console.log(error);
      setApiError(error.message);
    });
  };

  React.useEffect(() => {
    // Create appropriate AI Manager based on settings
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
          setApiError(`Failed to initialize AI model: ${error.message}`);
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
            setApiError(`Failed to initialize Azure OpenAI model: ${error.message}`);
          }
        } else if (!isAzure && pluginSettings.GPT_MODEL) {
          try {
            setAiManager(new OpenAIManager(pluginSettings.API_KEY, pluginSettings.GPT_MODEL));
          } catch (error) {
            console.error('Error initializing OpenAIManager:', error);
            setApiError(`Failed to initialize OpenAI model: ${error.message}`);
          }
        } else {
          console.error(
            'Incomplete OpenAI configuration:',
            isAzure ? 'Missing DEPLOYMENT_NAME or ENDPOINT' : 'Missing GPT_MODEL'
          );
          setApiError(
            isAzure
              ? 'Missing Azure OpenAI configuration. Please check your settings.'
              : 'Missing OpenAI configuration. Please check your settings.'
          );
        }
      } else {
        console.error('No valid API configuration found in settings');
        setApiError('No valid API configuration found. Please check your settings.');
      }
    }
  }, [aiManager, pluginSettings]);

  const updateHistory = React.useCallback(() => {
    setPromptHistory(aiManager?.history ?? []);
  }, [aiManager]);

  // Modified function to make requests to Kubernetes API with confirmation
  const makeKubeRequest = async (
    url: string,
    method: string,
    body?: string,
    toolCallId?: string,
    pendingPrompt?: Prompt
  ) => {
    // For GET requests, proceed immediately
    if (method.toUpperCase() === 'GET') {
      return handleActualApiRequest(url, method, body);
    }

    // For POST, DELETE, PUT, PATCH - show confirmation dialog
    setApiRequest({
      url,
      method,
      body,
      toolCallId,
      pendingPrompt,
    });
    setShowApiConfirmation(true);
    setApiResponse(null);
    setApiRequestError(null);

    // Return a promise that will be resolved when the user confirms or rejects
    return new Promise(resolve => {
      // The actual request will be made when the user confirms in the dialog
      // For now, just indicate that this is pending confirmation
      resolve({
        status: 'pending_confirmation',
        message: `This ${method.toUpperCase()} request requires your confirmation.`,
      });
    });
  };

  // Function to handle the actual API request after confirmation
  const handleActualApiRequest = async (url: string, method: string, body?: string) => {
    try {
      setApiLoading(true);

      const cluster = getCluster();
      if (!cluster) {
        console.error('No cluster selected.');
        setApiRequestError('No cluster selected');
        return JSON.stringify({ error: true, message: 'No cluster selected' });
      }

      console.log('Making Kubernetes API request:', { url, method, body });

      const response = await clusterRequest(url, {
        method,
        cluster,
        body: body === '' ? undefined : body,
        headers: {
          'Content-Type': method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
          accept: 'application/json;as=Table;g=meta.k8s.io;v=v1',
        },
      });

      console.log('Kubernetes API Response:', response);

      let formattedResponse = response;
      if (typeof response === 'object' && response?.kind === 'Table') {
        formattedResponse = [
          [...response.columnDefinitions.map((it: any) => it.name), 'namespace'].join(','),
          ...response.rows.map((row: any) =>
            [...row.cells, 'Important! namespace = ' + row.object.metadata.namespace].join(',')
          ),
        ].join('\n');
      }

      setApiResponse(formattedResponse);
      setApiLoading(false);

      // If there's a pending tool call, add the response to the history
      if (apiRequest?.toolCallId && aiManager) {
        const toolResponse: Prompt = {
          role: 'tool',
          content:
            typeof formattedResponse === 'string'
              ? formattedResponse
              : JSON.stringify(formattedResponse),
          toolCallId: apiRequest.toolCallId,
          name: 'kubernetes_api_request',
        };

        aiManager.history.push(toolResponse);
        updateHistory();

        // If there was a pending prompt from the tool call, process it now
        if (apiRequest.pendingPrompt) {
          await aiManager.processToolResponses();
          updateHistory();
        }
      }

      return formattedResponse ?? 'ok';
    } catch (error) {
      console.error('Error in makeKubeRequest:', error);
      setApiRequestError(error.message);
      setApiLoading(false);

      // If there's a pending tool call, add the error response
      if (apiRequest?.toolCallId && aiManager) {
        const errorResponse: Prompt = {
          role: 'tool',
          content: JSON.stringify({ error: true, message: error.message }),
          toolCallId: apiRequest.toolCallId,
          name: 'kubernetes_api_request',
        };

        aiManager.history.push(errorResponse);
        updateHistory();

        // If there was a pending prompt from the tool call, process it now
        if (apiRequest.pendingPrompt) {
          await aiManager.processToolResponses();
          updateHistory();
        }
      }

      return JSON.stringify({ error: true, message: error.message });
    }
  };

  // Function to handle API confirmation dialog confirmation
  const handleApiConfirmation = async () => {
    if (!apiRequest) return;

    const { url, method, body } = apiRequest;
    await handleActualApiRequest(url, method, body);
    // Don't close the dialog automatically - let the user see the response
  };

  // Function to handle API confirmation dialog close
  const handleApiDialogClose = () => {
    setShowApiConfirmation(false);
    setApiRequest(null);
    setApiResponse(null);
    setApiRequestError(null);
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

    const events = event?.objectEvent?.events;
    if (!!events) {
      const [contextId, warnings] = getWarningsContext(events);
      aiManager.addContext(contextId, warnings);
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
                'HTTP Request to a kubernetes API server, kube-apiserver. Make sure to provide proper namespace!',
              parameters: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                    description:
                      'URL to request, example: /api/v1/pods, /apis/apps/v1/replicasets, /api/v1/namespaces/default/pods/podinfo-123/log?container=podinfod',
                  },
                  method: {
                    type: 'string',
                    description: 'GET, POST, PATCH, DELETE',
                  },
                  body: {
                    type: 'string',
                    description: 'HTTP request body, optional',
                  },
                },
                required: ['url', 'method'],
                additionalProperties: false,
              },
            },
          },
        ],
        makeKubeRequest
      );
    }

    setSuggestions(aiManager.getPromptSuggestions());
  }, [_pluginSetting.event, aiManager]);

  async function AnalyzeResourceBasedOnPrompt(prompt: string) {
    setOpenPopup(true);
    setLoading(true);
    // @todo: Needs to be cancellable.
    const promptResponse = await aiManager.userSend(prompt);
    console.log('Prompt response:', promptResponse);
    setLoading(false);

    // Handle content filter errors specifically
    if (promptResponse.error) {
      if (promptResponse.contentFilterError) {
        setApiError(promptResponse.content || 'Your request was blocked by content filters.');
      } else {
        setApiError(promptResponse.content || 'An error occurred processing your request.');
      }

      // Still update the history so the user can see the error message
      setAiManager(aiManager);
      updateHistory();
      return;
    }

    // This is a bit hacky but it does ensure that the TextStreamContainer is updated.
    setAiManager(aiManager);
    updateHistory();
  }

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

  // Extract YAML from content - This function is still useful for the TextStreamContainer
  const extractYamlContent = (content: string) => {
    if (!content) return null;

    // Check for YAML code blocks
    const yamlRegex = /```(?:yaml|yml)([\s\S]*?)```/g;
    const matches = [];
    let match;

    while ((match = yamlRegex.exec(content)) !== null) {
      if (match[1] && match[1].trim()) {
        matches.push(match[1].trim());
      }
    }

    // If no code blocks found, look for YAML with horizontal separators
    if (matches.length === 0) {
      const separatorPattern = /[-]{3,}/g;
      const lines = content.split('\n');
      const separatorLines = [];

      // Find all separator lines
      lines.forEach((line, index) => {
        if (line.match(separatorPattern)) {
          separatorLines.push(index);
        }
      });

      // If we have at least 2 separators, extract content between them
      if (separatorLines.length >= 2) {
        for (let i = 0; i < separatorLines.length - 1; i++) {
          const startLine = separatorLines[i] + 1;
          const endLine = separatorLines[i + 1];

          const potentialYaml = lines.slice(startLine, endLine).join('\n').trim();
          if (potentialYaml) {
            try {
              // Verify it's valid YAML
              const parsed = YAML.parse(potentialYaml);
              if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
                matches.push(potentialYaml);
              }
            } catch (e) {
              // Not valid YAML, continue
              console.debug('Not valid YAML between separators:', e);
            }
          }
        }
      }
    }

    return matches.length > 0 ? matches : null;
  };

  // Get provider display name
  const getProviderDisplayName = () => {
    if (!pluginSettings) return 'AI';

    if (pluginSettings.provider) {
      const provider = getProviderById(pluginSettings.provider);
      return provider ? `${provider.name} AI` : 'AI';
    }

    // Legacy support
    return pluginSettings.API_TYPE === 'azure' ? 'Azure OpenAI' : 'OpenAI';
  };

  return openPopup ? (
    <div ref={rootRef}>
      <Drawer
        open={openPopup}
        anchor={'right'}
        transitionDuration={{ enter: 2000, exit: 2000 }}
        BackdropProps={{ invisible: true }}
        variant="persistent"
        PaperProps={{
          style: {
            width: '25%',
            maxWidth: '50%',
            height: '95vh',
            top: '60px',
          },
        }}
      >
        <Box
          sx={{
            padding: 1,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6">{getProviderDisplayName()} Assistant (beta)</Typography>
          </Box>
          <Box>
            <ActionButton
              description="Close"
              onClick={() => {
                setOpenPopup(false);
              }}
              icon="mdi:chevron-right-box-outline"
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
                        />
                      </Box>
                    );
                  })
                )}
              </Box>
            )}
            <Paper component="form" elevation={0}>
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
                <Grid item>
                  <ActionButton
                    description="Clear History"
                    onClick={() => {
                      aiManager.reset();
                      updateHistory();
                    }}
                    icon="mdi:broom"
                  />
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
                        console.log(error);
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
            </Paper>
          </Grid>
        </Grid>
      </Drawer>

      {/* Editor Dialog */}
      <EditorDialog
        open={showEditor}
        onClose={() => setShowEditor(false)}
        yamlContent={editorContent}
        title={editorTitle}
        resourceType={resourceType}
        isDelete={isDelete}
        onSuccess={handleOperationSuccess}
      />

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
  ) : null;
}
