import {
  Drawer,
  Box,
  Chip,
  Button,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/styles';
import React from 'react';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import OpenAI from 'openai';
import { useGlobalState } from './utils';
import { prompt, promptHelpers } from './config/prompt';
import { formatString } from './helper';
import TextStreamContainer from './textstream';

export default function AIPrompt(props: {
  openPopup: boolean;
  setOpenPopup: (...args) => void;
  isAzureOpenAI: boolean;
}) {
  const { openPopup, setOpenPopup, isAzureOpenAI } = props;
  const openApiName = localStorage.getItem('openApiName');
  const openApiKey = localStorage.getItem('openApiKey');
  const gptModel = localStorage.getItem('gptModel');
  const [promptError, setPromptError] = React.useState(false);
  const theme = useTheme();
  const rootRef = React.useRef(null);
  let availablePrompts: string[] = [];
  const [promptVal, setPromptVal] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [textStream, setTextStream] = React.useState();
  const [apiError, setApiError] = React.useState(null);
  const [textStreamHistoryClear, setTextStreamHistoryClear] = React.useState(false);

  let client;

  function preparePrompt(event, promptValue) {
    const items = event?.items;
    const resource = event?.resource;
    if (resource) {
      if (promptVal.toLowerCase().includes(`Explain ${resource.kind}`.toLowerCase())) {
        console.log('inside here ');
        return (
          prompt.base_prompt +
          'Q: ' +
          promptValue +
          ' ' +
          'The complete resource json for this resource is ' +
          JSON.stringify(resource) +
          '\n'
        );
      }

      if (promptVal.toLowerCase().includes(`Scale When`.toLowerCase())) {
        return (
          prompt.base_prompt +
          'Q: ' +
          promptValue +
          ' ' +
          'The complete resource json for this resource is ' +
          JSON.stringify(resource) +
          '\n' +
          'Please provide a HPA which handles the scaling of this deployment when the metrics goes up as mentioned'
        );
      }
      if (promptVal.toLowerCase().includes(`Scale Deployment`.toLowerCase())) {
        return (
          prompt.base_prompt +
          'Q: ' +
          promptValue +
          ' ' +
          'The complete resource json for this resource is ' +
          JSON.stringify(resource) +
          '\n' +
          'Please provide an updated resource where this deployment is scaled by the amount of replicas user wants it to'
        );
      }
      return (
        prompt.base_prompt +
        'Q: ' +
        promptValue +
        ' ' +
        'The complete resource json for this resource is ' +
        JSON.stringify(resource) +
        '\n'
      );
    }

    if (items[0].kind) {
      return (
        prompt.base_prompt +
        'Q: ' +
        promptValue +
        'The items are ' +
        items.map(item => {
          return `kind: ${item.kind} name: ${item.metadata.name} ${item.metadata.namespace || ''} ${
            item.message || ''
          }\n`;
        }) +
        '\n'
      );
    }
    if (items) {
      return (
        prompt.base_prompt + 'Q: ' + promptValue + 'The items are ' + JSON.stringify(items) + '\n'
      );
    }
    return prompt.base_prompt + 'Q: ' + promptValue + '\n';
  }

  if (isAzureOpenAI) {
    client = new OpenAIClient(
      `https://${openApiName}.openai.azure.com/`,
      new AzureKeyCredential(openApiKey)
    );
  } else {
    client = new OpenAI({ apiKey: openApiKey, dangerouslyAllowBrowser: true });
  }

  const _pluginSetting = useGlobalState();

  if (_pluginSetting.event?.resource) {
    const finalPrompts = promptHelpers.details_view_loaded_with_resource.map(prompt => {
      return formatString(
        prompt,
        _pluginSetting.event?.resource.kind,
        _pluginSetting.event?.resource.metadata.name
      );
    });
    availablePrompts = availablePrompts.concat(finalPrompts);
    if (_pluginSetting.event?.resource.kind === 'Deployment') {
      availablePrompts = availablePrompts.concat(
        promptHelpers.Deployment.map(prompt => {
          return formatString(prompt, _pluginSetting.event?.resource.metadata.name);
        })
      );
    }
  }

  if (_pluginSetting.event?.items?.[0]?.kind) {
    const finalPrompts = promptHelpers.list_view_loaded_with_resource
      .concat(promptHelpers.list_view_loaded_without_resource)
      .map(prompt => {
        const resource = _pluginSetting.event?.items[0];
        if (!resource.kind) {
          return formatString(prompt, _pluginSetting.event?.title || _pluginSetting.event?.type);
        }
        return formatString(prompt, _pluginSetting.event?.items[0].kind);
      });
    availablePrompts = availablePrompts.concat(finalPrompts);
  }

  if (_pluginSetting.event?.items && !_pluginSetting.event?.items?.[0]?.kind) {
    const finalPrompts = promptHelpers.list_view_loaded_without_resource.map(prompt => {
      return formatString(prompt, _pluginSetting.event?.title || _pluginSetting.event?.type);
    });
    availablePrompts = availablePrompts.concat(finalPrompts);
  }

  async function AnalyzeResourceBasedOnPrompt() {
    setOpenPopup(true);
    setLoading(true);
    let events;
    if (isAzureOpenAI) {
      events = await client.listChatCompletions(gptModel, [
        {
          role: 'user',
          content: `${preparePrompt(_pluginSetting.event, promptVal)}`,
        },
      ]);
    } else {
      events = await client.chat.completions
        .create({
          messages: [
            {
              role: 'user',
              content: `${preparePrompt(_pluginSetting.event, promptVal)}}`,
            },
          ],
          model: gptModel,
        })
        .withResponse().catch((error) => {
          setApiError(error.message);
        });
    }
    let stream = '';
    try {
      for await (const event of events) {
        for (const choice of event.choices) {
          const delta = choice.delta?.content;
          if (delta !== undefined) {
            stream += delta;
          }
        }
      }
    setLoading(false);  
    setTextStream(stream);
    } catch (error) {
      setLoading(false); 
      throw new Error(error);
    }
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
            flexDirection: 'column-reverse',
            padding: '1rem',
            width: '25%',
            maxWidth: '50%',
            height: '95vh',
            top: '6.7vh',
          },
        }}
      >
        <Box
          display="flex"
          mb={2}
          flexWrap="wrap"
          justifyContent="flex-end"
          flexDirection="column-reverse"
        >
          <Box>
            <TextField
              id="deployment-ai-prompt"
              onChange={event => {
                setPromptVal(event.target.value);
              }}
              variant="outlined"
              value={promptVal}
              label="Enter your prompt here"
              fullWidth
              error={promptError}
              helperText={promptError ? 'Please select from one of the provided prompts above' : ''}
            />
            <Box display={"flex"}>
            <Box mt={1} mr={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  AnalyzeResourceBasedOnPrompt().catch((error) => {
                    console.log(error)
                    setApiError(error.message);
                  });
                }}
                style={{
                  color: theme.palette.clusterChooser.button.color,
                  backgroundColor: theme.palette.clusterChooser.button.background,
                }}
              >
                Check
              </Button>
            </Box>
            <Box mt={1} mr={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setTextStreamHistoryClear(true);
                }}
                style={{
                  color: theme.palette.clusterChooser.button.color,
                  backgroundColor: theme.palette.clusterChooser.button.background,
                }}
              >
                Clear History
              </Button>
              </Box>
            </Box>
          </Box>
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
          <Box>

            <TextStreamContainer
              incomingText={textStream}
              callback={() => {
                setOpenPopup(false);
              }}
              loading={loading}
              context={context}
              resource={_pluginSetting.event?.resource}
              apiError={apiError}
              textStreamHistoryClear={textStreamHistoryClear}
            />
          </Box>
        </Box>
      </Drawer>
    </div>
  ) : null;
}
