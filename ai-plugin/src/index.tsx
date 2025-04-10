import { Icon } from '@iconify/react';
import {
  ConfigStore,
  registerAppBarAction,
  registerHeadlampEventCallback,
  registerPluginSettings,
} from '@kinvolk/headlamp-plugin/lib';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Backdrop,
  Box,
  Paper,
  Popper,
  Tooltip,
  ToggleButton,
  Typography,
  Divider,
} from '@mui/material';
import React from 'react';
import AIPrompt from './modal';
import { useGlobalState } from './utils';
import ModelSelector from './components/ModelSelector';
import { getDefaultConfig, getProviderById } from './config/modelConfig';

function DeploymentAIPrompt() {
  const [openPopup, setOpenPopup] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const config = new ConfigStore<{ errorMessage?: string }>('@headlamp-k8s/headlamp-ai');
  const useConf = config.useConfig();
  const conf = useConf();

  // Check if configuration is valid - now supports both legacy and new format
  const hasLegacyConfig = 
    (conf?.API_TYPE === 'azure' && conf?.DEPLOYMENT_NAME && conf?.API_KEY && conf?.GPT_MODEL) ||
    (conf?.API_TYPE !== 'azure' && conf?.API_KEY && conf?.GPT_MODEL);
  
  const hasNewConfig = conf?.provider && conf?.config && Object.keys(conf.config).length > 0;
  const hasValidConfig = hasLegacyConfig || hasNewConfig;

  return (
    <>
      <Tooltip title="AI Assistant">
        <ToggleButton
          aria-label={'description'}
          onClick={event => {
            setOpenPopup(prev => !prev);
            setAnchorEl(event.currentTarget);
          }}
          selected={openPopup}
          size="small"
        >
          <Icon icon="mdi:message-flash" width="24px" />
        </ToggleButton>
      </Tooltip>
      
      {!hasValidConfig ? (
        <>
          <Popper
            placement="bottom-start"
            anchorEl={anchorEl}
            disablePortal={false}
            open={openPopup && Boolean(anchorEl)}
            style={{
              zIndex: 2000,
              marginTop: '8px',
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
                  padding: '16px',
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
          pluginSettings={conf}
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
  // Track the provider type
  const [selectedProvider, setSelectedProvider] = React.useState(data?.provider || 'openai');
  
  // Track the provider-specific configuration
  const [providerConfig, setProviderConfig] = React.useState<Record<string, any>>(() => {
    // Initialize with saved config or default values
    if (data?.provider === selectedProvider && data?.config) {
      return data.config;
    }
    return getDefaultConfig(selectedProvider);
  });

  // Handle provider change
  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    // Reset config to defaults when changing provider
    setProviderConfig(getDefaultConfig(providerId));
    
    // Update the global configuration
    onDataChange({
      ...data,
      provider: providerId,
      config: getDefaultConfig(providerId)
    });
  };

  // Handle configuration changes
  const handleConfigChange = (newConfig: Record<string, any>) => {
    setProviderConfig(newConfig);
    onDataChange({
      ...data,
      provider: selectedProvider,
      config: newConfig
    });
  };

  const provider = getProviderById(selectedProvider);
  const isConfigValid = provider?.fields.every(field => 
    !field.required || (providerConfig[field.name] && providerConfig[field.name] !== '')
  );

  return (
    <Box width={'80%'}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This plugin is in early development and is not yet ready for production use. Using it may
        incur in costs from the AI provider! Use at your own risk.
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <ModelSelector
        selectedProvider={selectedProvider}
        config={providerConfig}
        onProviderChange={handleProviderChange}
        onConfigChange={handleConfigChange}
      />
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color={isConfigValid ? 'success.main' : 'error.main'}>
          {isConfigValid 
            ? 'Configuration is valid. You can now use the AI assistant.' 
            : 'Please fill in all required fields to use the AI assistant.'}
        </Typography>
      </Box>
    </Box>
  );
}

registerPluginSettings('@headlamp-k8s/headlamp-ai', Settings, true);
