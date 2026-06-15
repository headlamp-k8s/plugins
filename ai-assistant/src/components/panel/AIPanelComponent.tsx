import { getSavedConfigurations } from '@headlamp-k8s/ai-common/providers/savedConfigs';
import AIPanelBase from '@headlamp-k8s/ai-ui/components/panel/AIPanelComponent';
import React from 'react';
import { ClusterChangeNotifier } from '../../hooks/useClusterChangeNotifier';
import AIPrompt from '../../modal';
import { useGlobalState, usePluginConfig } from '../../pluginState';

/**
 * Thin wrapper around the ai-ui AIPanelComponent that injects
 * headlamp-plugin-dependent values (global state, config store,
 * cluster change notifier, and the main AI prompt).
 */
const AIPanelComponent = React.memo(() => {
  const pluginState = useGlobalState();
  const conf = usePluginConfig();

  const savedConfigData = React.useMemo(() => {
    return getSavedConfigurations(conf);
  }, [conf]);

  const hasAnyValidConfig = savedConfigData.providers && savedConfigData.providers.length > 0;

  return (
    <AIPanelBase
      isOpen={pluginState.isUIPanelOpen}
      hasValidConfig={!!hasAnyValidConfig}
      clusterNotifier={<ClusterChangeNotifier />}
    >
      <AIPrompt
        openPopup={pluginState.isUIPanelOpen}
        setOpenPopup={pluginState.setIsUIPanelOpen}
        pluginSettings={conf}
        width="100%"
      />
    </AIPanelBase>
  );
});

AIPanelComponent.displayName = 'AIPanelComponent';

export default AIPanelComponent;
