import {
  ConditionsSection,
  DetailsGrid,
  Link,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { LocalQueue, LocalQueueFlavorUsage } from '../../resources/localQueue';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Flattened row rendered for status flavor reservations or flavor usage. */
interface FlavorUsageRow {
  /** ResourceFlavor name reported by LocalQueue status. */
  flavor: string;
  /** Resource name reported under the flavor. */
  resource: string;
  /** Total reserved or used quantity for the resource. */
  total?: string | number;
}

/** Render a ResourceFlavor name as a Headlamp link to its detail page. */
function renderFlavorLink(flavorName: string) {
  return (
    <Link routeName={kueueRouteNames.resourceFlavorDetail} params={{ name: flavorName }}>
      {flavorName}
    </Link>
  );
}

/** Convert status flavor usage or reservation entries into table rows. */
function getFlavorUsageRows(flavorUsage: LocalQueueFlavorUsage[] = []): FlavorUsageRow[] {
  return flavorUsage.flatMap(flavor => {
    if (!flavor.resources?.length) {
      return [
        {
          flavor: flavor.name,
          resource: '-',
        },
      ];
    }

    return flavor.resources.map(resource => ({
      flavor: flavor.name,
      resource: resource.name,
      total: resource.total,
    }));
  });
}

/** Build the extra detail section for LocalQueue status flavor reservations or usage. */
function getFlavorUsageSection(title: string, id: string, flavorUsage?: LocalQueueFlavorUsage[]) {
  const rows = getFlavorUsageRows(flavorUsage);

  if (rows.length === 0) {
    return null;
  }

  return {
    id,
    section: (
      <SectionBox title={title}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'ResourceFlavor',
              getter: (row: FlavorUsageRow) =>
                row.flavor === '-' ? '-' : renderFlavorLink(row.flavor),
            },
            {
              label: 'Resource',
              getter: (row: FlavorUsageRow) => row.resource,
            },
            {
              label: 'Total',
              getter: (row: FlavorUsageRow) => row.total ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

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
                {
                  name: 'Fair Sharing',
                  value: localQueue.fairSharingDisplay,
                },
              ]
            : []
        }
        extraSections={localQueue =>
          localQueue
            ? [
                getConditionsSection(localQueue),
                getFlavorUsageSection(
                  'Flavor Reservations',
                  'flavor-reservations',
                  localQueue.status.flavorsReservation
                ),
                getFlavorUsageSection(
                  'Flavor Usage',
                  'flavor-usage',
                  localQueue.status.flavorsUsage
                ),
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
