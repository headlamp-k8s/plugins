import { Icon } from '@iconify/react';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { Tooltip } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import React from 'react';
import { ChartEnabledKinds, usePluginSettings } from './util';

export interface VisibilityButtonProps {
  resource?: KubeObject;
}

export default function VisibilityButton(props: VisibilityButtonProps) {
  const { resource } = props;
  const pluginSettings = usePluginSettings();

  const [description, icon] = React.useMemo(() => {
    if (pluginSettings.isVisible) {
      return ['Hide Prometheus metrics', 'mdi:chart-box-outline'];
    }
    return ['Show Prometheus metrics', 'mdi:chart-box'];
  }, [pluginSettings]);

  if (!ChartEnabledKinds.includes(resource?.jsonData?.kind)) {
    return null;
  }

  return (
    <Tooltip title={description}>
      <ToggleButton
        aria-label={'description'}
        onClick={() => pluginSettings.setIsVisible(visible => !visible)}
        selected={pluginSettings.isVisible}
        size="small"
      >
        <Icon icon={icon} width="24px" />
      </ToggleButton>
    </Tooltip>
  );
}
