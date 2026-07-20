import {
  ConditionsSection,
  DetailsGrid,
  Link,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { LocalQueue } from '../../resources/localQueue';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Render a ClusterQueue reference as a detail-page link. */
function renderClusterQueueLink(localQueue: LocalQueue) {
  const clusterQueueName = localQueue.clusterQueueName;

  if (!clusterQueueName) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.clusterQueueDetail} params={{ name: clusterQueueName }}>
      {clusterQueueName}
    </Link>
  );
}

/** Build the standard Headlamp conditions section for LocalQueue status. */
function getConditionsSection(localQueue: LocalQueue) {
  if (!localQueue.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={localQueue.jsonData} />,
  };
}

export default function LocalQueueDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={LocalQueue}
      resourceLabel="LocalQueues"
      verb="get"
      accessDescription="Kueue LocalQueues are namespaced user queue resources."
    >
      <DetailsGrid
        resourceType={LocalQueue}
        name={name}
        namespace={namespace}
        withEvents
        extraInfo={localQueue =>
          localQueue
            ? [
                {
                  name: 'ClusterQueue',
                  value: renderClusterQueueLink(localQueue),
                },
                {
                  name: 'Stop Policy',
                  value: localQueue.stopPolicyDisplay,
                },
                {
                  name: 'Pending Workloads',
                  value: localQueue.pendingWorkloads,
                },
                {
                  name: 'Admitted Workloads',
                  value: localQueue.admittedWorkloads,
                },
                {
                  name: 'Reserving Workloads',
                  value: localQueue.reservingWorkloads,
                },
                {
                  name: 'Status',
                  value: localQueue.statusDisplay,
                },
              ]
            : []
        }
        extraSections={localQueue =>
          localQueue ? [getConditionsSection(localQueue)].filter(Boolean) : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
