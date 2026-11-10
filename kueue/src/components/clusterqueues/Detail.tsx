import {
  ConditionsSection,
  DateLabel,
  DetailsGrid,
  Link,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ClusterQueue, FlavorUsage } from '../../resources/clusterQueue';
import { getResourceGroupRows, ResourceGroupRow } from '../../resources/clusterQueueFormatters';
import type { PendingWorkloadSummaryItem } from '../../resources/workloadFormatters';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import { usePendingWorkloads } from '../../utils/kueueVisibility';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import {
  renderAdmissionCheckLink,
  renderCohortLink,
  renderLocalQueueLink,
  renderResourceFlavorLink,
} from '../common/KueueResourceLinks';
import { RelatedLocalQueuesSection, RelatedWorkloadsSection } from '../common/RelatedResources';

/** Flattened row rendered for status flavor reservations or flavor usage. */
interface FlavorUsageRow {
  /** ResourceFlavor name reported by ClusterQueue status. */
  flavor: string;
  /** Resource name reported under the flavor. */
  resource: string;
  /** Total reserved or used quantity for the resource. */
  total?: string | number;
  /** Quantity currently borrowed from the cohort. */
  borrowed?: string | number;
}

/** Admission check row from spec.admissionChecksStrategy. */
interface AdmissionCheckRow {
  /** AdmissionCheck resource name. */
  name: string;
  /** Flavor names this AdmissionCheck applies to; empty means all flavors. */
  flavors: string[];
}

/** Convert status flavor usage or reservation entries into table rows. */
function getFlavorUsageRows(flavorUsage: FlavorUsage[] = []): FlavorUsageRow[] {
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
      borrowed: resource.borrowed,
    }));
  });
}

/** Extract admission checks and their flavor scope from the ClusterQueue spec. */
function getAdmissionCheckRows(clusterQueue: ClusterQueue): AdmissionCheckRow[] {
  return (
    clusterQueue.spec.admissionChecksStrategy?.admissionChecks?.map(check => ({
      name: check.name,
      flavors: check.onFlavors || [],
    })) || []
  );
}

/** Build the extra detail section that shows spec.resourceGroups as a table. */
function getResourceGroupsSection(clusterQueue: ClusterQueue) {
  const rows = getResourceGroupRows(clusterQueue.resourceGroups);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'resource-groups',
    section: (
      <SectionBox title="Resource Groups">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Group',
              getter: (row: ResourceGroupRow) => row.group,
            },
            {
              label: 'Covered Resources',
              getter: (row: ResourceGroupRow) => row.coveredResources,
            },
            {
              label: 'ResourceFlavor',
              getter: (row: ResourceGroupRow) =>
                row.flavor === '-' ? '-' : renderResourceFlavorLink(row.flavor),
            },
            {
              label: 'Resource',
              getter: (row: ResourceGroupRow) => row.resource,
            },
            {
              label: 'Nominal Quota',
              getter: (row: ResourceGroupRow) => row.nominalQuota,
            },
            {
              label: 'Borrowing Limit',
              getter: (row: ResourceGroupRow) => row.borrowingLimit ?? '-',
            },
            {
              label: 'Lending Limit',
              getter: (row: ResourceGroupRow) => row.lendingLimit ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a table section for ClusterQueue status flavor reservations or usage. */
function getFlavorUsageSection(title: string, id: string, flavorUsage?: FlavorUsage[]) {
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
                row.flavor === '-' ? '-' : renderResourceFlavorLink(row.flavor),
            },
            {
              label: 'Resource',
              getter: (row: FlavorUsageRow) => row.resource,
            },
            {
              label: 'Total',
              getter: (row: FlavorUsageRow) => row.total ?? '-',
            },
            {
              label: 'Borrowed',
              getter: (row: FlavorUsageRow) => row.borrowed ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for configured admission checks. */
function getAdmissionChecksSection(clusterQueue: ClusterQueue) {
  const rows = getAdmissionCheckRows(clusterQueue);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'admission-checks',
    section: (
      <SectionBox title="Admission Checks">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Name',
              getter: (row: AdmissionCheckRow) => renderAdmissionCheckLink(row.name),
            },
            {
              label: 'ResourceFlavors',
              getter: (row: AdmissionCheckRow) =>
                row.flavors.length ? (
                  <>
                    {row.flavors.map((flavor, index) => (
                      <span key={flavor}>
                        {index > 0 ? ', ' : ''}
                        {renderResourceFlavorLink(flavor)}
                      </span>
                    ))}
                  </>
                ) : (
                  'All flavors'
                ),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Pending Workloads in the order Kueue will try them, from the visibility API.
 * Renders nothing when the API is not served, access is denied, or nothing is pending.
 */
function PendingWorkloadsSection(props: { clusterQueue: ClusterQueue }) {
  const { clusterQueue } = props;
  const items = usePendingWorkloads(
    `clusterqueues/${clusterQueue.metadata.name}/pendingworkloads`,
    clusterQueue.cluster
  );

  if (!items?.length) {
    return null;
  }

  return (
    <SectionBox title="Pending Workloads in Admission Order">
      <SimpleTable
        data={items}
        columns={[
          {
            label: 'Position',
            getter: (item: PendingWorkloadSummaryItem) => item.positionInClusterQueue + 1,
          },
          {
            label: 'Workload',
            getter: (item: PendingWorkloadSummaryItem) => (
              <Link
                routeName={kueueRouteNames.workloadDetail}
                params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
              >
                {item.metadata.name}
              </Link>
            ),
          },
          {
            label: 'Namespace',
            getter: (item: PendingWorkloadSummaryItem) => item.metadata.namespace || '-',
          },
          {
            label: 'LocalQueue',
            getter: (item: PendingWorkloadSummaryItem) =>
              renderLocalQueueLink(item.localQueueName, item.metadata.namespace),
          },
          {
            label: 'Priority',
            getter: (item: PendingWorkloadSummaryItem) => item.priority ?? '-',
          },
          {
            label: 'Age',
            getter: (item: PendingWorkloadSummaryItem) =>
              item.metadata.creationTimestamp ? (
                <DateLabel date={item.metadata.creationTimestamp} format="mini" />
              ) : (
                '-'
              ),
          },
        ]}
      />
    </SectionBox>
  );
}

/** Build the standard Headlamp conditions section for ClusterQueue status. */
function getConditionsSection(clusterQueue: ClusterQueue) {
  if (!clusterQueue.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={clusterQueue.jsonData} />,
  };
}

/** Detail view for a cluster-scoped Kueue ClusterQueue resource. */
export default function ClusterQueueDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess resourceClass={ClusterQueue} resourceLabel="ClusterQueues" verb="get">
      <DetailsGrid
        resourceType={ClusterQueue}
        name={name}
        withEvents
        extraInfo={clusterQueue =>
          clusterQueue
            ? [
                {
                  name: 'Cohort',
                  value: renderCohortLink(clusterQueue.spec.cohortName),
                },
                {
                  name: 'Queueing Strategy',
                  value: clusterQueue.queueingStrategy,
                },
                {
                  name: 'Stop Policy',
                  value: clusterQueue.stopPolicy,
                },
                {
                  name: 'Namespace Selector',
                  value: clusterQueue.namespaceSelectorDisplay,
                },
                {
                  name: 'Pending Workloads',
                  value: clusterQueue.pendingWorkloads,
                },
                {
                  name: 'Admitted Workloads',
                  value: clusterQueue.admittedWorkloads,
                },
                {
                  name: 'Reserving Workloads',
                  value: clusterQueue.reservingWorkloads,
                },
                {
                  name: 'Status',
                  value: clusterQueue.statusDisplay,
                },
                {
                  name: 'Referenced ResourceFlavors',
                  value: clusterQueue.referencedFlavorNamesDisplay,
                },
                {
                  name: 'Preemption',
                  value: clusterQueue.preemptionDisplay,
                },
                {
                  name: 'Flavor Fungibility',
                  value: clusterQueue.flavorFungibilityDisplay,
                },
                {
                  name: 'Fair Sharing',
                  value: clusterQueue.fairSharingDisplay,
                },
                {
                  name: 'Admission Scope',
                  value: clusterQueue.admissionScopeDisplay,
                },
                {
                  name: 'Concurrent Admission',
                  value: clusterQueue.concurrentAdmissionPolicyDisplay,
                },
              ]
            : []
        }
        extraSections={clusterQueue =>
          clusterQueue
            ? [
                getConditionsSection(clusterQueue),
                getResourceGroupsSection(clusterQueue),
                getAdmissionChecksSection(clusterQueue),
                {
                  id: 'pending-workloads-order',
                  section: <PendingWorkloadsSection clusterQueue={clusterQueue} />,
                },
                getFlavorUsageSection(
                  'Flavor Reservations',
                  'flavor-reservations',
                  clusterQueue.status.flavorsReservation
                ),
                getFlavorUsageSection(
                  'Flavor Usage',
                  'flavor-usage',
                  clusterQueue.status.flavorsUsage
                ),
                {
                  id: 'related-local-queues',
                  section: (
                    <RelatedLocalQueuesSection clusterQueueName={clusterQueue.metadata.name} />
                  ),
                },
                {
                  id: 'related-workloads',
                  section: (
                    <RelatedWorkloadsSection clusterQueueName={clusterQueue.metadata.name} />
                  ),
                },
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
