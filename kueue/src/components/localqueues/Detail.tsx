import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link as MuiLink } from '@mui/material';
import { useParams } from 'react-router-dom';
import { LocalQueue } from '../../resources/localQueue';
import { openClusterQueueActivity } from '../clusterqueues/Detail';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Render a ClusterQueue reference as a link that opens its details in a side panel. */
function renderClusterQueueLink(localQueue: LocalQueue) {
  const clusterQueueName = localQueue.clusterQueueName;

  if (!clusterQueueName) {
    return '-';
  }

  return (
    <MuiLink
      component="button"
      sx={{ textAlign: 'left' }}
      onClick={() => openClusterQueueActivity(clusterQueueName, localQueue.cluster)}
    >
      {clusterQueueName}
    </MuiLink>
  );
}

/** Open a LocalQueue's details in a side panel instead of navigating away. */
export function openLocalQueueActivity(namespace: string, name: string, cluster?: string) {
  Activity.launch({
    id: `kueue-localqueue-${cluster ?? ''}-${namespace}-${name}`,
    location: 'split-right',
    icon: <Icon icon="mdi:format-list-bulleted" />,
    title: `${namespace}/${name}`,
    cluster,
    content: <LocalQueueDetail namespace={namespace} name={name} />,
  });
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

export default function LocalQueueDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const namespace = props.namespace ?? params.namespace;
  const name = props.name ?? params.name;

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
