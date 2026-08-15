import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { MultiKueueConfig } from '../../resources/multiKueueConfig';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function MultiKueueConfigDetail(props: { name?: string; cluster?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name, cluster } = props;

  return (
    <KueueAdminResourceAccess
      resourceClass={MultiKueueConfig}
      resourceLabel="MultiKueueConfigs"
      verb="get"
      cluster={cluster}
    >
      <DetailsGrid
        resourceType={MultiKueueConfig}
        name={name}
        cluster={cluster}
        withEvents
        extraInfo={config =>
          config
            ? [
                {
                  name: 'Clusters (priority order)',
                  value: config.clustersDisplay,
                },
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
