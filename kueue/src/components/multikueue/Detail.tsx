import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { MultiKueueCluster } from '../../resources/multiKueueCluster';
import { renderMultiKueueConnectionStatus } from '../../resources/multiKueueClusterFormatters';

function getConditionsSection(cluster: MultiKueueCluster) {
  if (!cluster.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={cluster.jsonData} />,
  };
}

export default function MultiKueueClusterDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <DetailsGrid
      resourceType={MultiKueueCluster}
      name={name}
      withEvents
      extraInfo={cluster =>
        cluster
          ? [
              {
                name: 'KubeConfig Location',
                value: cluster.kubeConfigLocation,
              },
              {
                name: 'Location Type',
                value: cluster.kubeConfigType,
              },
              {
                name: 'Connection Status',
                value: renderMultiKueueConnectionStatus(cluster.activeCondition),
              },
            ]
          : []
      }
      extraSections={cluster =>
        cluster
          ? [getConditionsSection(cluster)].filter((s): s is NonNullable<typeof s> => s !== null)
          : []
      }
    />
  );
}
