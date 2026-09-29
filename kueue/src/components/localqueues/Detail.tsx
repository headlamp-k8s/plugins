import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { LocalQueue } from '../../resources/localQueue';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { renderClusterQueueLink } from '../common/KueueResourceLinks';
import QueueMaintenanceControl from '../common/QueueMaintenanceControl';
import { RelatedWorkloadsSection } from '../common/RelatedResources';

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

/** Build the queue maintenance control section for LocalQueue. */
function getMaintenanceControlSection(localQueue: LocalQueue) {
  return {
    id: 'maintenance-controls',
    section: <QueueMaintenanceControl queue={localQueue} queueClass={LocalQueue} queueType="LocalQueue" />,
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
                  value: renderClusterQueueLink(localQueue.clusterQueueName),
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
          localQueue
            ? [
                getMaintenanceControlSection(localQueue),
                getConditionsSection(localQueue),
                {
                  id: 'related-workloads',
                  section: (
                    <RelatedWorkloadsSection
                      namespace={localQueue.metadata.namespace}
                      localQueueName={localQueue.metadata.name}
                    />
                  ),
                },
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
