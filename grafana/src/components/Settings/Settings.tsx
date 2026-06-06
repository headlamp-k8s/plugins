import { useClustersConf } from '@kinvolk/headlamp-plugin/lib/k8s';
import React, { useCallback, useEffect, useState } from 'react';
import { SettingsData, SettingsPure } from './SettingsPure';

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

interface SettingsProps {
  data: SettingsData;
  onDataChange: (newData: SettingsData) => void;
}

/**
 * Settings provides the logical wrapper for the Grafana configuration UI.
 * It manages the local state for selecting a cluster and validating the user's URL input,
 * before persisting the per-cluster URL mappings to the ConfigStore.
 */
export const Settings: React.FC<SettingsProps> = ({ data, onDataChange }) => {
  const clusters = useClustersConf() || {};
  const [selectedCluster, setSelectedCluster] = useState('');
  const [validUrl, setValidUrl] = useState(false);

  useEffect(() => {
    if (Object.keys(clusters).length > 0 && !selectedCluster) {
      setSelectedCluster(Object.keys(clusters)[0]);
    }
  }, [clusters, selectedCluster]);

  useEffect(() => {
    const selectedClusterData = data?.[selectedCluster] || {};
    if (selectedClusterData.grafanaUrl) {
      setValidUrl(validateUrl(selectedClusterData.grafanaUrl));
    } else {
      setValidUrl(false);
    }
  }, [data, selectedCluster]);

  const handleUrlChange = useCallback(
    (newURL: string) => {
      const updatedData = {
        ...data,
        [selectedCluster]: {
          ...data?.[selectedCluster],
          grafanaUrl: newURL,
        },
      };

      const cleanData = Object.fromEntries(
        Object.entries(updatedData).filter(([_, clusterData]) => !!clusterData.grafanaUrl)
      );

      onDataChange(cleanData);
      setValidUrl(validateUrl(newURL));
    },
    [data, onDataChange, selectedCluster]
  );

  return (
    <SettingsPure
      data={data}
      clusters={clusters}
      selectedCluster={selectedCluster}
      validUrl={validUrl}
      onClusterChange={setSelectedCluster}
      onUrlChange={handleUrlChange}
    />
  );
};
