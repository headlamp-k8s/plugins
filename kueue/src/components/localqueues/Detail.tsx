import { DetailsGrid, Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { LocalQueue } from '../../resources/localQueue';
import { kueueRouteNames } from '../../utils/kueueRoutes';

export default function LocalQueueDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <DetailsGrid
      resourceType={LocalQueue}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={lq =>
        lq
          ? [
              {
                name: 'ClusterQueue',
                value: lq.clusterQueue && lq.clusterQueue !== '-' ? (
                  <Link routeName={kueueRouteNames.clusterQueueDetail} params={{ name: lq.clusterQueue }}>
                    {lq.clusterQueue}
                  </Link>
                ) : (
                  '-'
                ),
              },
              {
                name: 'Pending Workloads',
                value: lq.pendingWorkloads,
              },
              {
                name: 'Admitted Workloads',
                value: lq.admittedWorkloads,
              },
              {
                name: 'Status',
                value: lq.statusMessage,
              },
            ]
          : []
      }
    />
  );
}
