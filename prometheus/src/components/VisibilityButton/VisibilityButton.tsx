import { Icon } from '@iconify/react';
import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import { Tooltip } from '@mui/material';
import ToggleButton from '@mui/material/ToggleButton';
import React from 'react';
import {
  disableMetrics,
  enableMetrics,
  getConfigStore,
  supportsPrometheusMetrics,
} from '../../util';

interface VisibilityButtonProps {
  /** The resource whose page shows the button. */
  resource?: KubeObject;
  /** The cluster whose metrics the button turns on and off, when it is not the current one. */
  cluster?: string;
}

/**
 * Shows a button that turns Prometheus metrics on or off for a cluster, on the page of a resource
 * that has Prometheus charts.
 *
 * @param props - The resource and the cluster.
 * @returns The button, or nothing for a resource without Prometheus charts.
 */
export function VisibilityButton(props: VisibilityButtonProps) {
  const { t } = useTranslation();
  const { resource } = props;
  const currentCluster = K8s.useCluster();
  const cluster = props.cluster || currentCluster;
  const configStore = getConfigStore();
  const useClusterConfig = configStore.useConfig();
  const clusterConfig = useClusterConfig();
  const isEnabled = clusterConfig?.[cluster]?.isMetricsEnabled || false;

  const [description, icon] = React.useMemo(() => {
    if (isEnabled) {
      return [t('Hide Prometheus metrics'), 'mdi:chart-box-outline'];
    }
    return [t('Show Prometheus metrics'), 'mdi:chart-box'];
  }, [isEnabled, t]);

  if (!supportsPrometheusMetrics(resource)) {
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
