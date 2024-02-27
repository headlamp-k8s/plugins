import { Icon } from '@iconify/react';
import {
  ConfigStore,
  registerAppBarAction,
  registerHeadlampEventCallback,
  registerPluginSettings,
} from '@kinvolk/headlamp-plugin/lib';
import { Link, NameValueTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Backdrop,
  Box,
  MenuItem,
  Paper,
  Popper,
  Select,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import AIPrompt from './modal';
import { useGlobalState } from './utils';

function DeploymentAIPrompt() {
  const [openPopup, setOpenPopup] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const config = new ConfigStore<{ errorMessage?: string }>('@headlamp-k8s/headlamp-ai');
  const useConf = config.useConfig();
  const conf = useConf();
  console.log('conf', conf);
  const isAzureOpenAI = conf?.API_TYPE === 'azure';
  const apiName = conf?.API_NAME;
  const apiKey = conf?.API_KEY;
  const gptModel = conf?.GPT_MODEL;
  const endpoint = conf?.ENDPOINT;
  const deploymentName = conf?.DEPLOYMENT_NAME;

  const isAzureOpenAICredentialsAvailable = isAzureOpenAI && deploymentName && apiKey && gptModel;
  const isOpenAICredentialsAvailable = !isAzureOpenAI && apiKey && gptModel;
  console.log(
    'isAzureOpenAICredentialsAvailable',
    isAzureOpenAICredentialsAvailable,
    'isOpenAICredentialsAvailable',
    isOpenAICredentialsAvailable
  );
  return (
    <>
      <Tooltip title="AI Assistant">
        <ToggleButton
          aria-label={'description'}
          onClick={event => {
            // Add the event parameter here
            setOpenPopup(prev => !prev);
            setAnchorEl(event.currentTarget);
          }}
          selected={openPopup}
          size="small"
        >
          <Icon icon="mdi:message-flash" width="24px" />
        </ToggleButton>
      </Tooltip>
      {!isAzureOpenAICredentialsAvailable && !isOpenAICredentialsAvailable ? (
        <>
          <Popper
            placement="bottom-start"
            anchorEl={anchorEl}
            disablePortal={false}
            open={openPopup && Boolean(anchorEl)} // Ensure anchorEl exists
            style={{
              zIndex: 2000,
              marginTop: '8px', // Add some spacing from the button
            }}
            modifiers={[
              {
                name: 'preventOverflow',
                enabled: true,
                options: {
                  boundary: 'viewport',
                },
              },
            ]}
          >
            <Paper>
              <Box
                style={{
                  padding: '16px', // Increased padding
                  fontSize: '16px',
                  maxWidth: '300px',
                }}
              >
                To set up credentials for AI Analysis tool to work, please go to the{' '}
                <Link
                  routeName="pluginDetails"
                  params={{
                    name: '@headlamp-k8s/headlamp-ai',
                  }}
                  onClick={() => {
                    setOpenPopup(false);
                  }}
                >
                  Settings
                </Link>{' '}
                page.
              </Box>
            </Paper>
          </Popper>
          <Backdrop
            open={openPopup}
            onClick={() => {
              setOpenPopup(false);
            }}
          />
        </>
      ) : (
        <AIPrompt
          openPopup={openPopup}
          setOpenPopup={setOpenPopup}
          isAzureOpenAI={isAzureOpenAI}
          openApiName={apiName}
          openApiKey={apiKey}
          gptModel={gptModel}
          endpoint={endpoint}
          deploymentName={deploymentName}
        />
      )}
    </>
  );
}

registerAppBarAction(DeploymentAIPrompt);

registerAppBarAction(() => {
  const _pluginState = useGlobalState();
  registerHeadlampEventCallback(event => {
    if (event.type === 'headlamp.object-events') {
      _pluginState.setEvent({
        ..._pluginState.event,
        objectEvent: event.data,
      });
    }
    if (event.type === 'headlamp.list-view') {
      const slashCount = location.pathname.split('/').length - 1;
      if (slashCount <= 3) {
        _pluginState.setEvent({
          title: event.data.resourceKind || event.data.title,
          items: event.data.resources,
        });
      }
    } else if (event.type === 'headlamp.details-view') {
      _pluginState.setEvent({
        title: event.data.title,
        resource: event.data.resource,
        objectEvent: _pluginState?.event?.objectEvent,
      });
    }
    return null;
  });
  return null;
});

/**
 * A component for displaying and editing plugin settings, specifically for customizing error messages.
 * It renders a text input field that allows users to specify a custom error message.
 * This message is intended to be displayed when a specific error condition occurs (e.g., pod count cannot be retrieved).
 *
 * @param {PluginSettingsDetailsProps} props - Properties passed to the Settings component.
 * @param {Object} props.data - The current configuration data for the plugin, including the current error message.
 * @param {function(Object): void} props.onDataChange - Callback function to handle changes to the data, specifically the error message.
 */
function Settings(props) {
  const { data, onDataChange } = props;
  // Track the API type to conditionally render fields
  const [apiType, setApiType] = React.useState(data?.API_TYPE || 'openai');

  // Define model options for each API type
  const openAiModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'o1-mini',
    'o1',
    'o1-preview',
    'o3-mini',
    'gpt-4-turbo',
    'gpt-4-0125-preview',
    'gpt-4-1106-preview',
    'gpt-4',
    'gpt-4-32k',
    'gpt-3.5-turbo-0125',
    'gpt-35-turbo',
    'gpt-35-turbo-16k',
    'gpt-35-turbo-instruct',
  ];

  const azureOpenAiModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'o1-mini',
    'o1',
    'o1-preview',
    'o3-mini',
    'gpt-4',
    'gpt-4-32k',
    'gpt-4-turbo',
    'gpt-35-turbo',
    'gpt-35-turbo-16k',
    'gpt-35-turbo-instruct',
  ];

  /**
   * Handles changes to the error message input field by invoking the onDataChange callback
   * with the new error message.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event from the input field.
   */
  const handleApiKeyChange = event => {
    onDataChange({ ...data, API_KEY: event.target.value });
  };

  const handleApiNameChange = event => {
    console.log('event.target.value', event.target.value);
    onDataChange({ ...data, API_NAME: event.target.value });
  };

  const handleEndpointChange = event => {
    onDataChange({ ...data, ENDPOINT: event.target.value });
  };

  const handleDeploymentNameChange = event => {
    onDataChange({ ...data, DEPLOYMENT_NAME: event.target.value });
  };

  const handleApiModelChange = event => {
    onDataChange({ ...data, GPT_MODEL: event.target.value });
  };

  const handleApiTypeChange = event => {
    setApiType(event.target.value);
    onDataChange({ ...data, API_TYPE: event.target.value });
  };

  const settingsRows = [
    {
      name: 'API_KEY',
      value: (
        <TextField
          onChange={handleApiKeyChange}
          value={data?.API_KEY}
          label="API_KEY"
          fullWidth
          defaultValue={data?.API_KEY}
        />
      ),
    },
    ...(apiType === 'azure'
      ? [
          {
            name: 'ENDPOINT',
            value: (
              <TextField
                onChange={handleEndpointChange}
                value={data?.ENDPOINT}
                label="ENDPOINT"
                fullWidth
                defaultValue={data?.ENDPOINT}
              />
            ),
          },
          {
            name: 'DEPLOYMENT_NAME',
            value: (
              <TextField
                onChange={handleDeploymentNameChange}
                value={data?.DEPLOYMENT_NAME}
                label="DEPLOYMENT_NAME"
                fullWidth
                defaultValue={data?.DEPLOYMENT_NAME}
              />
            ),
          },
        ]
      : [
          {
            name: 'API_NAME',
            value: (
              <TextField
                onChange={handleApiNameChange}
                value={data?.API_NAME}
                label="API_NAME"
                fullWidth
                defaultValue={data?.API_NAME}
              />
            ),
          },
        ]),
    {
      name: 'GPT_MODEL',
      value: (
        <Select
          onChange={handleApiModelChange}
          value={data?.GPT_MODEL || ''}
          label="GPT_MODEL"
          fullWidth
          displayEmpty
        >
          <MenuItem value="" disabled>
            <em>Select a model</em>
          </MenuItem>
          {(apiType === 'azure' ? azureOpenAiModels : openAiModels).map(model => (
            <MenuItem key={model} value={model}>
              {model}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      name: 'API_TYPE',
      value: (
        <Select
          label="API_TYPE"
          onChange={handleApiTypeChange}
          fullWidth
          value={apiType}
          defaultValue={data?.API_TYPE || 'openai'}
        >
          <MenuItem value={'openai'}>OpenAI</MenuItem>
          <MenuItem value={'azure'}>Azure OpenAI</MenuItem>
        </Select>
      ),
    },
  ];

  return (
    <Box width={'80%'}>
      <Typography variant="body1">
        This plugin is in early development and is not yet ready for production use. Using it may
        incur in costs from the AI provider! Use at your own risk.
      </Typography>
      <NameValueTable rows={settingsRows} />
    </Box>
  );
}

registerPluginSettings('@headlamp-k8s/headlamp-ai', Settings, true);
