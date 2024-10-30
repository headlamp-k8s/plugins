import { Icon } from '@iconify/react';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { Tooltip } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import React, { useEffect, useState } from 'react';
import { ChartEnabledKinds } from '../../util';
import { disableMetrics, enableMetrics, getConfigStore } from '../../util';

export interface VisibilityButtonProps {
  resource?: KubeObject;
}

export function VisibilityButton(props: VisibilityButtonProps) {
  const { resource } = props;
  const cluster = useCluster();
  const [isEnabled, setIsEnabled] = useState(false);
  const configStore = getConfigStore();
  const useClusterConfig = configStore.useConfig();
  const clusterConfig = useClusterConfig();

  useEffect(() => {
    if (clusterConfig?.[cluster]?.isMetricsEnabled !== isEnabled) {
      setIsEnabled(clusterConfig?.[cluster]?.isMetricsEnabled || false);
    }
  }, [clusterConfig]);

  const [description, icon] = React.useMemo(() => {
    if (isEnabled) {
      return ['Hide Prometheus metrics', 'mdi:chart-box-outline'];
    }
    return ['Show Prometheus metrics', 'mdi:chart-box'];
  }, [isEnabled]);

  if (!ChartEnabledKinds.includes(resource?.jsonData?.kind)) {
    return null;
  }

  const handleToggle = () => {
    if (isEnabled) {
      disableMetrics(cluster);
    } else {
      enableMetrics(cluster);
    }
  };

  return (
    <Tooltip title={description}>
      <ToggleButton
        value="toggle-metrics"
        aria-label={description}
        onClick={handleToggle}
        selected={isEnabled}
        size="small"
      >
        <Icon icon={icon} width="24px" />
      </ToggleButton>
    </Tooltip>
  );
}
