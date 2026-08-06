import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { MultiKueueCluster } from '../../resources/multiKueueCluster';
import { renderMultiKueueConnectionStatus } from '../../resources/multiKueueClusterFormatters';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

function getConditionsSection(cluster: MultiKueueCluster) {
  if (!cluster.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={cluster.jsonData} />,
  };
}

export default function MultiKueueClusterDetail(props: { name?: string; cluster?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name, cluster } = props;

  return (
    <KueueAdminResourceAccess
      resourceClass={MultiKueueCluster}
      resourceLabel="MultiKueueClusters"
      verb="get"
      cluster={cluster}
    >
      <DetailsGrid
        resourceType={MultiKueueCluster}
        name={name}
        cluster={cluster}
        withEvents
        extraInfo={multiKueueCluster =>
          multiKueueCluster
            ? [
                {
                  name: 'KubeConfig Location',
                  value: multiKueueCluster.kubeConfigLocation,
                },
                {
                  name: 'Location Type',
                  value: multiKueueCluster.kubeConfigType,
                },
                {
                  name: 'Connection Status',
                  value: renderMultiKueueConnectionStatus(multiKueueCluster.activeCondition),
                },
              ]
            : []
        }
        extraSections={multiKueueCluster =>
          multiKueueCluster
            ? [getConditionsSection(multiKueueCluster)].filter(
                (s): s is NonNullable<typeof s> => s !== null
              )
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
