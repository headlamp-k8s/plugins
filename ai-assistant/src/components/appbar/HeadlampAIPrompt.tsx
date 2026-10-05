import { getSavedConfigurations } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import { AiUiI18nProvider } from '@headlamp-k8s/ai-ui/AiUiI18nProvider';
import AIAssistantToggle from '@headlamp-k8s/ai-ui/components/appbar/AIAssistantToggle';
import { isAksDesktopHost } from '@headlamp-k8s/ai-ui/mcp/host';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { checkHolmesAgentHealth } from '../../holmesClient';
import { getSettingsURL, pluginStore, useGlobalState, usePluginConfig } from '../../pluginState';

/**
 * App-bar button for the AI Assistant.
 *
 * Renders a toggle button in the Headlamp top bar that opens/closes the AI
 * panel. When no AI model provider has been configured (and the Holmes agent
 * is unavailable), it shows a one-time configuration popover prompting the
 * user to open settings.
 */
export default function HeadlampAIPrompt() {
  const pluginState = useGlobalState();
  const savedConfigs = usePluginConfig();
  const { t, i18n } = useTranslation();
  const history = useHistory();
  const theme = useTheme();
  const [showPopover, setShowPopover] = React.useState(false);

  // Match the color the Headlamp AppBar uses for its own text/icons so the
  // logo is legible on any navbar background (light or dark theme).
  const navbarPalette = (theme.palette as { navbar?: { background?: string; color?: string } })
    .navbar;
  const navbarBackground = navbarPalette?.background ?? theme.palette.background.default;
  const iconColor = navbarPalette?.color ?? theme.palette.getContrastText(navbarBackground);

  const hasShownPopover = savedConfigs?.configPopoverShown || false;

  const savedConfigData = React.useMemo(() => {
    return getSavedConfigurations(savedConfigs);
  }, [savedConfigs]);

  const hasAnyValidConfig = savedConfigData.providers && savedConfigData.providers.length > 0;

  const [isAgentAvailable, setIsAgentAvailable] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    if (isAksDesktopHost()) {
      setIsAgentAvailable(false);
      return;
    }
    const cluster = getCluster();
    if (!cluster) {
      setIsAgentAvailable(false);
      return;
    }
    checkHolmesAgentHealth(cluster, savedConfigs).then(available => {
      if (!cancelled) setIsAgentAvailable(available);
    });
    return () => {
      cancelled = true;
    };
  }, [savedConfigs]);

  React.useEffect(() => {
    if (hasAnyValidConfig && hasShownPopover) {
      const currentConf = pluginStore.get() || {};
      pluginStore.update({
        ...currentConf,
        configPopoverShown: false,
      });
    }
  }, [hasAnyValidConfig, hasShownPopover]);

  // Show popover only if no valid config AND no Holmes agent
  React.useEffect(() => {
    if (!hasAnyValidConfig && !hasShownPopover && !pluginState.isUIPanelOpen && !isAgentAvailable) {
      const timer = setTimeout(() => {
        setShowPopover(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowPopover(false);
    }
  }, [hasAnyValidConfig, hasShownPopover, pluginState.isUIPanelOpen, isAgentAvailable]);

  const handleClosePopover = () => {
    setShowPopover(false);
    const currentConf = pluginStore.get() || {};
    pluginStore.update({
      ...currentConf,
      configPopoverShown: true,
    });
  };

  const handleConfigureClick = () => {
    handleClosePopover();
    history.push(getSettingsURL());
  };

  // Don't render the app bar button if preview is not enabled
  const previewEnabled = savedConfigs?.previewEnabled ?? true;
  if (!previewEnabled) {
    return null;
  }

  return (
    <AiUiI18nProvider i18n={i18n}>
      <AIAssistantToggle
        isOpen={pluginState.isUIPanelOpen}
        onToggle={() => pluginState.setIsUIPanelOpen(!pluginState.isUIPanelOpen)}
        showConfigPrompt={showPopover}
        onDismissPrompt={handleClosePopover}
        onConfigure={handleConfigureClick}
        icon="ai-assistant:logo"
        iconColor={iconColor}
        tooltipTitle={t('AI Assistant')}
      />
    </AiUiI18nProvider>
  );
}
