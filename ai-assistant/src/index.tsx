import { Icon } from '@iconify/react';
import {
  registerAppBarAction,
  registerHeadlampEventCallback,
  registerPluginSettings,
  registerUIPanel,
} from '@kinvolk/headlamp-plugin/lib';
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Popper,
  Switch,
  ToggleButton,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { ModelSelector } from './components';
import { MCPSettings } from './components/settings';
import { getDefaultConfig } from './config/modelConfig';
import { PromptWidthProvider } from './contexts/PromptWidthContext';
import { isTestModeCheck } from './helper';
import AIPrompt from './modal';
import {
  getAllAvailableTools,
  getSettingsURL,
  isToolEnabled,
  PLUGIN_NAME,
  pluginStore,
  toggleTool,
  useGlobalState,
  usePluginConfig,
} from './utils';
import {
  getActiveConfig,
  getSavedConfigurations,
  SavedConfigurations,
} from './utils/ProviderConfigManager';

// Memoized UI Panel component to prevent unnecessary re-renders
const AIPanelComponent = React.memo(() => {
  const pluginState = useGlobalState();
  const conf = usePluginConfig();
  const [width, setWidth] = React.useState('35vw');
  const [isResizing, setIsResizing] = React.useState(false);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

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
  return (
    <Box
      flexShrink={0}
      sx={{
        height: '100%',
        width: width,
        borderLeft: '2px solid',
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
      <PromptWidthProvider initialWidth={width}>
        <AIPrompt
          openPopup={pluginState.isUIPanelOpen}
          setOpenPopup={pluginState.setIsUIPanelOpen}
          pluginSettings={conf}
          width={width}
        />
      </PromptWidthProvider>
    </Box>
  );
});

AIPanelComponent.displayName = 'AIPanelComponent';

// Register UI Panel component that uses the shared state to show/hide
registerUIPanel({
  id: 'headlamp-ai',
  side: 'right',
  component: () => <AIPanelComponent />,
});

function HeadlampAIPrompt() {
  const pluginState = useGlobalState();
  const savedConfigs = usePluginConfig();
  const history = useHistory();
  const [popoverAnchor, setPopoverAnchor] = React.useState<HTMLElement | null>(null);
  const [showPopover, setShowPopover] = React.useState(false);
  const theme = useTheme();

  const hasShownPopover = savedConfigs?.configPopoverShown || false;

  const savedConfigData = React.useMemo(() => {
    return getSavedConfigurations(savedConfigs);
  }, [savedConfigs]);

  const hasAnyValidConfig = savedConfigData.providers && savedConfigData.providers.length > 0;

  // Reset popover shown state when configurations change from none to some
  React.useEffect(() => {
    if (hasAnyValidConfig && hasShownPopover) {
      // User now has configurations, reset the popover shown state
      // so it can show again if they remove all configurations later
      const currentConf = pluginStore.get() || {};
      pluginStore.update({
        ...currentConf,
        configPopoverShown: false,
      });
    }
  }, [hasAnyValidConfig, hasShownPopover]);

  // Show popover automatically if no configurations and hasn't been shown before
  React.useEffect(() => {
    if (!hasAnyValidConfig && !hasShownPopover && !pluginState.isUIPanelOpen) {
      // Show popover after a short delay to ensure component is mounted
      const timer = setTimeout(() => {
        if (!!popoverAnchor) {
          setShowPopover(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // Close popover if conditions are not met
      setShowPopover(false);
    }
  }, [hasAnyValidConfig, popoverAnchor, hasShownPopover, pluginState.isUIPanelOpen]);

  const handleClosePopover = () => {
    setShowPopover(false);
    // Save the popover shown state to plugin settings
    const currentConf = pluginStore.get() || {};
    pluginStore.update({
      ...currentConf,
      configPopoverShown: true,
    });
  };

  const handleConfigureClick = () => {
    handleClosePopover();
    // Navigate to settings page
    history.push(getSettingsURL());
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title="AI Assistant">
        <ToggleButton
          ref={el => {
            setPopoverAnchor(el);
          }}
          aria-label={'AI Assistant'}
          onClick={() => {
            // Toggle the UI panel state
            pluginState.setIsUIPanelOpen(!pluginState.isUIPanelOpen);
          }}
          selected={pluginState.isUIPanelOpen}
          size="small"
        >
          <Icon icon="ai-assistant:logo" width="24px" />
        </ToggleButton>
      </Tooltip>

      <Popper
        open={showPopover}
        anchorEl={popoverAnchor}
        placement="bottom"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
        sx={{
          zIndex: theme.zIndex.modal,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 2,
            maxWidth: 300,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Configure AI Assistant
            </Typography>
            <IconButton size="small" onClick={handleClosePopover} sx={{ ml: 1, mt: -0.5 }}>
              <Icon icon="mdi:close" />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            To use the AI Assistant, you need to configure at least one AI model provider in the
            settings.
          </Typography>
          <Button variant="contained" size="small" onClick={handleConfigureClick} fullWidth>
            Open Settings
          </Button>
        </Paper>
      </Popper>
    </Box>
  );
}

registerAppBarAction(HeadlampAIPrompt);

registerAppBarAction(() => {
  const _pluginState = useGlobalState();
  registerHeadlampEventCallback(event => {
    if (event.type === 'headlamp.home-page-loaded') {
      _pluginState.setEvent({
        ..._pluginState.event,
        clusters: (event.data as any).clusters,
        errors: (event.data as any).errors,
      });
    }
    if (event.type === 'headlamp.object-events') {
      _pluginState.setEvent({
        ..._pluginState.event,
        objectEvent: event.data,
      });
    }

    if (event.type === 'headlamp.details-view') {
      _pluginState.setEvent({
        title: (event.data as any).title,
        resource: (event.data as any).resource,
        objectEvent: _pluginState?.event?.objectEvent,
      });
    }
    if (event.type === 'headlamp.list-view') {
      _pluginState.setEvent({
        resources: event.data.resources,
        resourceKind: event.data.resourceKind,
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

  // Handle test mode toggle
  const handleTestModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isTestMode = event.target.checked;
    const currentConf = pluginStore.get() || {};
    pluginStore.update({
      ...currentConf,
      testMode: isTestMode,
    });
  };

  const handleResetPopover = () => {
    const currentConf = pluginStore.get() || {};
    pluginStore.update({
      ...currentConf,
      configPopoverShown: false,
    });
  };

  const isTestMode = isTestModeCheck();
  const hasShownConfigPopover = savedConfigs?.configPopoverShown || false;

  const toolsList = getAllAvailableTools();
  const pluginSettings = savedConfigs;

  const handleToolToggle = (toolId: string) => {
    const updatedSettings = toggleTool(pluginSettings, toolId);
    pluginStore.update(updatedSettings);
  };

  return (
    <Box width={'80%'}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This plugin is in early development and is not yet ready for production use. Using it may
        incur in costs from the AI provider! Use at your own risk.
      </Typography>

      <Divider sx={{ my: 3 }} />
      {isTestMode && (
        <>
          <Box sx={{ mb: 3, ml: 2 }}>
            <FormControlLabel
              control={
                <Switch checked={isTestMode} onChange={handleTestModeChange} color="primary" />
              }
              label={
                <Box>
                  <Typography variant="body1">Test Mode</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Enable test mode to manually input AI responses and see how they render in the
                    chat window
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Box sx={{ mb: 3, ml: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body1">Configuration Popover</Typography>
                <Typography variant="caption" color="text.secondary">
                  {hasShownConfigPopover
                    ? 'The configuration popover has been shown and dismissed'
                    : 'The configuration popover will show when no AI providers are configured'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetPopover}
                disabled={!hasShownConfigPopover}
              >
                Reset
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />
        </>
      )}
      <ModelSelector
        selectedProvider={activeConfiguration.providerId}
        config={activeConfiguration.config}
        savedConfigs={savedConfigs}
        configName={activeConfiguration.displayName}
        isConfigView
        onChange={handleModelSelectorChange}
        onTermsAccept={updatedConfigs => {
          pluginStore.update(updatedConfigs);
        }}
      />
      {/* AI Tools Section */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>
        AI Tools
      </Typography>
      <Box>
        {toolsList.map(tool => (
          <Box key={tool.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, ml: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isToolEnabled(pluginSettings, tool.id)}
                  onChange={() => handleToolToggle(tool.id)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1">{tool.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tool.description}
                  </Typography>
                </Box>
              }
            />
          </Box>
        ))}
      </Box>

      {/* MCP Servers Section */}
      <Divider sx={{ my: 3 }} />
      <MCPSettings />

      {/* MCP Tool Configuration Section */}
      <Divider sx={{ my: 3 }} />
    </Box>
  );
}

registerPluginSettings(PLUGIN_NAME, Settings);
