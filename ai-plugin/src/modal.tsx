import { Icon } from '@iconify/react';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, Button, Chip, Drawer, Grid, Paper, TextField, Typography } from '@mui/material';
import React from 'react';
import AIManager, { Prompt } from './ai/manager';
import OpenAIManager from './openai/manager';
import LangChainManager from './langchain/LangChainManager';
import TextStreamContainer from './textstream';
import { useGlobalState } from './utils';
import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { getProviderById } from './config/modelConfig';

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

  React.useEffect(() => {
    // Create appropriate AI Manager based on settings
    if (!aiManager && pluginSettings) {
      console.log("Initializing AI manager with settings:", JSON.stringify({
        ...pluginSettings,
        API_KEY: pluginSettings.API_KEY ? "[REDACTED]" : undefined,
        config: pluginSettings.config ? {
          ...pluginSettings.config,
          apiKey: pluginSettings.config.apiKey ? "[REDACTED]" : undefined
        } : undefined
      }));
      
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
          console.error("Error initializing LangChainManager:", error);
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
            console.error("Error initializing OpenAIManager for Azure:", error);
            setApiError(`Failed to initialize Azure OpenAI model: ${error.message}`);
          }
        } else if (!isAzure && pluginSettings.GPT_MODEL) {
          try {
            setAiManager(new OpenAIManager(pluginSettings.API_KEY, pluginSettings.GPT_MODEL));
          } catch (error) {
            console.error("Error initializing OpenAIManager:", error);
            setApiError(`Failed to initialize OpenAI model: ${error.message}`);
          }
        } else {
          console.error("Incomplete OpenAI configuration:", 
            isAzure ? "Missing DEPLOYMENT_NAME or ENDPOINT" : "Missing GPT_MODEL");
          setApiError(
            isAzure 
              ? "Missing Azure OpenAI configuration. Please check your settings."
              : "Missing OpenAI configuration. Please check your settings."
          );
        }
      } else {
        console.error("No valid API configuration found in settings");
        setApiError("No valid API configuration found. Please check your settings.");
      }
    }
  }, [aiManager, pluginSettings]);

  const updateHistory = React.useCallback(() => {
    setPromptHistory(aiManager?.history ?? []);
  }, [aiManager]);

  // Function to make requests to Kubernetes API
  const makeKubeRequest = async (url: string, method: string, body?: string) => {
    try {
      const cluster = getCluster();
      if (!cluster) {
        console.error("No cluster selected.");
        return JSON.stringify({ error: true, message: 'No cluster selected' });
      }
  
      console.log("Making Kubernetes API request:", { url, method, body });
  
      const response = await clusterRequest(url, {
        method,
        cluster,
        body: body === '' ? undefined : body,
        headers: {
          'Content-Type': method === 'PATCH' ? 'application/merge-patch+json' : 'application/json',
          accept: 'application/json',
        },
      });
  
      console.log("Kubernetes API Response:", response);
  
      if (typeof response === 'object') {
        return JSON.stringify(response);
      }
  
      return response || 'ok';
    } catch (error) {
      console.error("Error in makeKubeRequest:", error);
      return JSON.stringify({ error: true, message: error.message });
    }
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
    if (promptResponse.error) {
      throw new Error(promptResponse.content);
    }

    // This is a bit hacky but it does ensure that the TextStreamContainer is updated.
    setAiManager(aiManager);
    updateHistory();
  }

  // Get provider display name
  const getProviderDisplayName = () => {
    if (!pluginSettings) return "AI";
    
    if (pluginSettings.provider) {
      const provider = getProviderById(pluginSettings.provider);
      return provider ? `${provider.name} AI` : "AI";
    }
    
    // Legacy support
    return pluginSettings.API_TYPE === 'azure' ? "Azure OpenAI" : "OpenAI";
  };

  // const context = `${_pluginSetting.event?.title || _pluginSetting.event?.type || 'Loading...'}`;
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
            <Typography variant="h6">
              {getProviderDisplayName()} Assistant (beta)
            </Typography>
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
            <TextStreamContainer history={promptHistory} isLoading={loading} apiError={apiError} />
          </Grid>
          <Grid
            item
            sx={{
              paddingY: 1,
            }}
          >
            {!loading && (
              <Box>
                {suggestions.map(prompt => {
                  return (
                    <Box m={1}>
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
                })}
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
                  }
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
    </div>
  ) : null;
}
