import { registerAppBarAction, registerHeadlampEventCallback, ConfigStore, registerPluginSettings } from '@kinvolk/headlamp-plugin/lib';
import {
  TextField,
  Box,
  Backdrop,
  Select,
  MenuItem,
  Popper,
  Paper
} from '@mui/material';
import { ActionButton, Link, NameValueTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import AIPrompt from './modal';
import { useGlobalState } from './utils';

function DeploymentAIPrompt() {
  const [openPopup, setOpenPopup] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const config = new ConfigStore<{ errorMessage?: string }>('@kinvolk/headlamp-ai');
  const useConf = config.useConfig();
  const conf = useConf();
  const isAzureOpenAI = conf.API_TYPE === 'azure';
  const apiName = conf.API_NAME;
  const apiKey = conf.API_KEY;
  const gptModel = conf.GPT_MODEL;

  // console.log('>>>>>>>>>>>>>>>>>>>>>>>>>CONF', conf)

  // console.log(apiName, apiKey, gptModel, isAzureOpenAI)
  const isAzureOpenAICredentialsAvailable = isAzureOpenAI && apiName && apiKey && gptModel;
  const isOpenAICredentialsAvailable = !isAzureOpenAI  && apiKey && gptModel;
  return !isAzureOpenAICredentialsAvailable && !isOpenAICredentialsAvailable ? (
    <>
      <ActionButton
        icon="mdi:brain"
        description="AI Assistant"
        color="secondary"
        onClick={event => {
          setOpenPopup(prev => !prev);
          setAnchorEl(event.currentTarget);
        }}
      />
      <Popper
         placement="bottom"
         anchorEl={anchorEl}
         disablePortal={false}
         open={openPopup}
         style={{
           zIndex: 2000,
         }}
      >
        <Paper>
          <Box style={{
            padding: '10px',
            fontSize: '16px',
          }}>
        To set up credentials for AI Analysis tool to work, please go to the <Link routeName="pluginDetails" params={{
          name: '@headlamp-k8s/headlamp-ai',
        }} onClick={() => {
          setOpenPopup(false);
        }}>Settings</Link> page.
        </Box>
        </Paper>
      </Popper>
      <Backdrop
        open={openPopup}
        onClick={() => {
          setOpenPopup(false);
        }}
      ></Backdrop>
    </>
  ) : (
    <>
      <ActionButton
        icon="mdi:message-flash"
        description="AI Analysis"
        color="secondary"
        onClick={event => {
          setOpenPopup(prev => !prev);
          setAnchorEl(event.currentTarget);
        }}
      />
      <AIPrompt
        openPopup={openPopup}
        setOpenPopup={setOpenPopup}
        isAzureOpenAI={isAzureOpenAI}
        openApiName={apiName}
        openApiKey={apiKey}
        gptModel={gptModel}
      />
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
    console.log("event.target.value",event.target.value)
    onDataChange({ ...data, API_NAME: event.target.value });
  }

  const handleApiModelChange = event => {
    onDataChange({ ...data, GPT_MODEL: event.target.value });
  }

  const handleApiTypeChange = event => {
    onDataChange({ ...data, API_TYPE: event.target.value });
  }

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
    }, {
      name: 'API_NAME',
      value: (
        <TextField
        onChange={handleApiNameChange}
        value={data?.API_NAME}
        label="API_NAME"
        fullWidth
        defaultValue={data?.API_NAME}
        />
      )
    },
    {
      name: 'GPT_MODEL',
      value: (
        <TextField
        onChange={handleApiModelChange}
        value={data?.GPT_MODEL}
        label="GPT_MODEL"
        fullWidth
        defaultValue={data?.GPT_MODEL}
        />
      )
    },
    {
      name: 'API_TYPE',
      value: <Select label="API_TYPE" onChange={handleApiTypeChange} fullWidth defaultValue={data?.API_TYPE}>
        <MenuItem value={'openai'}>OpenAI</MenuItem>
        <MenuItem value={'azure'}>Azure</MenuItem>
      </Select>
    }
  ];

  return (
    <Box width={'80%'}>
      <NameValueTable rows={settingsRows} />
    </Box>
  );
}

registerPluginSettings('@kinvolk/headlamp-ai', Settings, true);
