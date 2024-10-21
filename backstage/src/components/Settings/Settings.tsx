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
    if (selectedClusterData.backstageUrl) {
      setValidUrl(validateUrl(selectedClusterData.backstageUrl));
    } else {
      setValidUrl(false);
    }
  }, [data, selectedCluster]);

  const handleUrlChange = useCallback(
    (newURL: string) => {
      onDataChange({
        ...data,
        [selectedCluster]: {
          ...data?.[selectedCluster],
          backstageUrl: newURL,
        },
      });
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
