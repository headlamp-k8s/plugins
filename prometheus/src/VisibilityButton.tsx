import { Icon } from '@iconify/react';
import { Tooltip } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import React from 'react';
import { usePluginSettings } from './util';

export default function VisibilityButton() {
  const pluginSettings = usePluginSettings();

  const [description, icon] = React.useMemo(() => {
    if (pluginSettings.isVisible) {
      return ['Hide Prometheus metrics', 'mdi:chart-box-outline'];
    }
    return ['Show Prometheus metrics', 'mdi:chart-box'];
  }, [pluginSettings]);

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
