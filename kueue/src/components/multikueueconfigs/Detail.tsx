import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { MultiKueueConfig } from '../../resources/multiKueueConfig';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function MultiKueueConfigDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={MultiKueueConfig}
      resourceLabel="MultiKueueConfigs"
      verb="get"
    >
      <DetailsGrid
        resourceType={MultiKueueConfig}
        name={name}
        withEvents
        extraInfo={config =>
          config
            ? [
                {
                  name: 'Clusters',
                  value: config.clustersDisplay,
                },
                {
                  name: 'Cluster Count',
                  value: config.clusterCount,
                },
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}