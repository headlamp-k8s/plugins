import { Icon } from '@iconify/react';
import {
  registerAppBarAction,
  registerHeadlampEventCallback,
  registerPluginSettings,
  registerUIPanel,
} from '@kinvolk/headlamp-plugin/lib';
import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Backdrop,
  Box,
  Divider,
  Paper,
  Popper,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import ModelSelector from './components/ModelSelector';
import { getDefaultConfig, getProviderById } from './config/modelConfig';
import AIPrompt from './modal';
import { PLUGIN_NAME, pluginStore, useGlobalState, usePluginConfig } from './utils';
import {
  getActiveConfig,
  getSavedConfigurations,
  saveProviderConfig,
  StoredProviderConfig,
  deleteProviderConfig,
} from './utils/ProviderConfigManager';

// Register UI Panel component that uses the shared state to show/hide
registerUIPanel({
  id: 'headlamp-ai',
  side: 'right',
  component: () => {
    const pluginState = useGlobalState();
    const conf = usePluginConfig();
    const [width, setWidth] = React.useState('35vw');
    const [isResizing, setIsResizing] = React.useState(false);

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    };

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        // Calculate width based on mouse position
        const newWidth = window.innerWidth - e.clientX;
        // Set minimum and maximum width constraints
        const constrainedWidth = Math.max(300, Math.min(newWidth, window.innerWidth * 0.8));
        setWidth(`${constrainedWidth}px`);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing]);

    // Don't render anything if panel is closed
    if (!pluginState.isUIPanelOpen) {
      return null;
    }
    console.log('Rendering AI panel with width:', width);
    return (
      <Box
        flexShrink={0}
        sx={{
          height: '100%',
          width: width,
          border: '2px solid',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-8px', // moved left to enlarge interactive area
            bottom: 0,
            width: '16px', // increased width for better accessibility
            cursor: 'ew-resize',
            zIndex: 1,
          },
        }}
      >
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            position: 'absolute',
            top: 0,
            left: '-8px', // adjust position to match pseudo-element
            bottom: 0,
            width: '16px', // increased interactive width
            cursor: 'ew-resize',
            zIndex: 10,
          }}
        />
        <AIPrompt
          openPopup={pluginState.isUIPanelOpen}
          setOpenPopup={pluginState.setIsUIPanelOpen}
          pluginSettings={conf}
        />
      </Box>
    );
  },
});

function HeadlampAIPrompt() {
  const pluginState = useGlobalState();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const conf = usePluginConfig();

  // Check if configuration is valid - now supports both legacy and new format
  const hasLegacyConfig =
    (conf?.API_TYPE === 'azure' && conf?.DEPLOYMENT_NAME && conf?.API_KEY && conf?.GPT_MODEL) ||
    (conf?.API_TYPE !== 'azure' && conf?.API_KEY && conf?.GPT_MODEL);

  // Check for new format - any valid provider config
  const savedConfigs = getSavedConfigurations(conf);
  const hasAnyValidConfig = savedConfigs.providers && savedConfigs.providers.length > 0;

  const hasValidConfig = hasLegacyConfig || hasAnyValidConfig;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title="AI Assistant">
          <ToggleButton
            aria-label={'AI Assistant'}
            onClick={event => {
              // Toggle the UI panel state
              pluginState.setIsUIPanelOpen(!pluginState.isUIPanelOpen);
              setAnchorEl(event.currentTarget);
            }}
            selected={pluginState.isUIPanelOpen}
            size="small"
          >
            <Icon icon="mdi:sparkles" width="24px" />
          </ToggleButton>
        </Tooltip>
      </Box>

      {!hasValidConfig ? (
        <>
          <Popper
            placement="bottom-start"
            anchorEl={anchorEl}
            disablePortal={false}
            open={pluginState.isUIPanelOpen && Boolean(anchorEl)}
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
                    pluginState.setIsUIPanelOpen(false);
                  }}
                >
                  Settings
                </Link>{' '}
                page.
              </Box>
            </Paper>
          </Popper>
          <Backdrop
            open={pluginState.isUIPanelOpen}
            onClick={() => {
              pluginState.setIsUIPanelOpen(false);
            }}
          />
        </>
      ) : null}
    </>
  );
}

registerAppBarAction(HeadlampAIPrompt);

registerAppBarAction(() => {
  const _pluginState = useGlobalState();
  registerHeadlampEventCallback(event => {
    if(event.type === 'headlamp.home-page-loaded') {
      _pluginState.setEvent({
        ..._pluginState.event,
        clusters: event.data.clusters,
        errors: event.data.errors,
      })
    }
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
 */
function Settings() {
  const savedConfigs = usePluginConfig();

  // Track the active configuration in a single state object
  const [activeConfiguration, setActiveConfiguration] = React.useState<{
    providerId: string;
    config: Record<string, any>;
    displayName: string;
  }>(() => {
    // Initialize with active config or default values
    const activeConfig = getActiveConfig(savedConfigs);
    if (activeConfig) {
      return {
        providerId: activeConfig.providerId,
        config: { ...activeConfig.config },
        displayName: activeConfig.displayName || '',
      };
    }
    return { providerId: 'openai', config: getDefaultConfig('openai'), displayName: '' };
  });

  // Handle all changes from the ModelSelector in one place
  const handleModelSelectorChange = (changes: {
    providerId: string;
    config: Record<string, any>;
    displayName: string;
    savedConfigs?: SavedConfigurations;
  }) => {
    // Update active configuration
    setActiveConfiguration({
      providerId: changes.providerId,
      config: changes.config,
      displayName: changes.displayName,
    });

    // If savedConfigs were changed, update the store
    if (changes.savedConfigs) {
      pluginStore.update(changes.savedConfigs);
    }
  };

  const provider = getProviderById(activeConfiguration.providerId);

  return (
    <Box width={'80%'}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This plugin is in early development and is not yet ready for production use. Using it may
        incur in costs from the AI provider! Use at your own risk.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <ModelSelector
        selectedProvider={activeConfiguration.providerId}
        config={activeConfiguration.config}
        savedConfigs={savedConfigs}
        configName={activeConfiguration.displayName}
        isConfigView={true}
        onChange={handleModelSelectorChange}
      />
    </Box>
  );
}

registerPluginSettings(PLUGIN_NAME, Settings);
