import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { useEffect, useState } from 'react';
import { getConfigStore } from '../../utils';
import { GrafanaButtonPure, GrafanaButtonPureProps } from './GrafanaButtonPure';

interface GrafanaButtonProps {
  dashboard: string;
}

/**
 * GrafanaButton serves as the smart container component that retrieves
 * the active cluster and configuration settings from Headlamp's ConfigStore.
 * It passes the resolved Grafana base URL and dashboard path down to the pure presentational component.
 *
 * @param dashboard - The relative path to the Grafana dashboard, extracted from the resource's annotation.
 */
export function GrafanaButton({ dashboard }: GrafanaButtonProps) {
  const cluster = useCluster();
  const [grafanaUrl, setGrafanaUrl] = useState('');

  const configStore = getConfigStore();
  const useConfig = configStore.useConfig();
  const conf = useConfig();

  useEffect(() => {
    setGrafanaUrl(conf?.[cluster]?.grafanaUrl || '');
  }, [conf, cluster]);

  const pureProps: GrafanaButtonPureProps = {
    dashboard,
    grafanaUrl,
  };

  return <GrafanaButtonPure {...pureProps} />;
}
