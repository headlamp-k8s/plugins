import { Icon } from '@iconify/react';
import {
  Drawer,
  Box,
  Grid,
  Chip,
  Paper,
  Button,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/styles';
import React from 'react';
import { useGlobalState } from './utils';
import TextStreamContainer from './textstream';
import OpenAIManager from './openai/manager';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import AIManager, { Prompt } from './ai/manager';
import {
  ActionButton,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

export default function AIPrompt(props: {
  openPopup: boolean;
  setOpenPopup: (...args) => void;
  isAzureOpenAI: boolean;
  openApiName: string;
  openApiKey: string;
  gptModel: string;
}) {
  const { openPopup, setOpenPopup, isAzureOpenAI, openApiName, openApiKey, gptModel } = props;

  const [promptError, setPromptError] = React.useState(false);
  const theme = useTheme();
  const rootRef = React.useRef(null);
  let availablePrompts: string[] = [];
  const [promptVal, setPromptVal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [apiError, setApiError] = React.useState(null);
  const [aiManager, setAiManager] = React.useState<AIManager | null>(null);
  const _pluginSetting = useGlobalState();
  const [history, setHistory] = React.useState<Prompt[]>([]);

  React.useEffect(() => {
    if (isAzureOpenAI && !aiManager) {
      setAiManager(new OpenAIManager());
  //   aiManager = new OpenAI({ apiKey: openApiKey, dangerouslyAllowBrowser: true });

    }
  },
  [isAzureOpenAI, aiManager])

  const updateHistory = React.useCallback(() => {
    setHistory(aiManager?.history ?? []);
  },
  [aiManager]);

  function summarizeResource(item: KubeObject) {
    const summarizedObj = {
      kind: item.kind,
      apiVersion: item.apiVersion,
      metadata: {
        name: item.metadata.name,
      },
    };

    if (item.metadata.namespace) {
      summarizedObj.metadata['namespace'] = item.metadata.namespace;
    }

    return summarizedObj;
  }

  React.useEffect(() => {
    if (!!aiManager) {
      const ctx = {};

      const event = _pluginSetting.event;
      const items = event?.items;
      const resource = event?.resource;
      const title = event?.title || event?.type;

      const events = event?.objectEvent?.events;
      if (!!events && !event?.objectEvent?.resource) {
        ctx['clusterEvents'] = JSON.stringify(events.map(e => e.jsonData));
      }

      if (!!items) {
        const itemListName = !!title ? `${title} list` : 'resource list';
        let itemsAreSummarized = false;
        let itemList = items.map(i => i?.jsonData);
        if (JSON.stringify(itemList).length > 1000) {
          itemsAreSummarized = true;
          itemList = itemList.map(summarizeResource);
          if (JSON.stringify(itemList).length > 1000) {
            itemList = [];
          }
        }

        ctx[itemListName] = {
          items: itemList,
          listLength: items.length,
          listIsSummarized: itemsAreSummarized,
        };
      }

      if (!!resource) {
        const resourceName = !!title ? `${title} details` : 'resource details';
        ctx[resourceName] = resource;
        if (JSON.stringify(resource).length > 1000) {
          ctx[resourceName] = summarizeResource(resource);
          ctx[resourceName + ' is summarized'] = true;
        }
      }
      aiManager.context = JSON.stringify(ctx);
    }
  },
  [_pluginSetting.event, aiManager]);

  async function AnalyzeResourceBasedOnPrompt() {
    setOpenPopup(true);
    setLoading(true);
    // @todo: Needs to be cancellable.
    let promptResponse = await aiManager.userSend(promptVal)

    setLoading(false);
    if (promptResponse.error) {
      throw new Error(promptResponse.content);
    }

    // This is a bit hacky but it does ensure that the TextStreamContainer is updated.
    setAiManager(aiManager);
    updateHistory();
  }

  function handleChange(event) {
    setPromptVal(event.target.value);
  }

  const context = `${_pluginSetting.event?.title || _pluginSetting.event?.type || 'Loading...'}`;
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
            // flexDirection: 'column-reverse',
            // padding: '1rem',
            width: '25%',
            maxWidth: '50%',
            height: '95vh',
            top: '6.7vh',
          },
        }}
      >
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
              history={history}
              callback={() => {
                setOpenPopup(false);
              }}
              isLoading={loading}
              context={context}
              apiError={apiError}
            />
          </Grid>
          <Grid
            item
            sx={{
              paddingY: 1,
            }}
          >
            {
              <Box>
                {availablePrompts.map(prompt => {
                  return (
                    <Box m={1}>
                      <Chip
                        label={prompt}
                        onClick={() => {
                          setPromptVal(prompt);
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            }
            <Paper
              component="form"
              elevation={0}
            >
              <TextField
                id="deployment-ai-prompt"
                onChange={event => {
                  setPromptVal(event.target.value);
                }}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setPromptVal('');

                    AnalyzeResourceBasedOnPrompt().catch((error) => {
                      console.log(error)
                      setApiError(error.message);
                    });
                  }
                }}
                variant="outlined"
                value={promptVal}
                label="Ask AI"
                fullWidth
                multiline
                error={promptError}
                helperText={promptError ? 'Please select from one of the provided prompts above' : ''}
              />
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
              >
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
                      AnalyzeResourceBasedOnPrompt().catch((error) => {
                        console.log(error)
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
