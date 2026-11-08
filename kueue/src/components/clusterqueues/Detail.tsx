import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ClusterQueue, FlavorUsage } from '../../resources/clusterQueue';
import { getResourceGroupRows, ResourceGroupRow } from '../../resources/clusterQueueFormatters';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import {
  renderAdmissionCheckLink,
  renderCohortLink,
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
function getResourceGroupsSection(clusterQueue: ClusterQueue, t: (key: string) => string) {
  const rows = getResourceGroupRows(clusterQueue.resourceGroups);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'resource-groups',
    section: (
      <SectionBox title={t('Resource Groups')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Group'),
              getter: (row: ResourceGroupRow) => row.group,
            },
            {
              label: t('Covered Resources'),
              getter: (row: ResourceGroupRow) => row.coveredResources,
            },
            {
              label: t('ResourceFlavor'),
              getter: (row: ResourceGroupRow) =>
                row.flavor === '-' ? '-' : renderResourceFlavorLink(row.flavor),
            },
            {
              label: t('Resource'),
              getter: (row: ResourceGroupRow) => row.resource,
            },
            {
              label: t('Nominal Quota'),
              getter: (row: ResourceGroupRow) => row.nominalQuota,
            },
            {
              label: t('Borrowing Limit'),
              getter: (row: ResourceGroupRow) => row.borrowingLimit ?? '-',
            },
            {
              label: t('Lending Limit'),
              getter: (row: ResourceGroupRow) => row.lendingLimit ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a table section for ClusterQueue status flavor reservations or usage. */
function getFlavorUsageSection(
  title: string,
  id: string,
  flavorUsage: FlavorUsage[] | undefined,
  t: (key: string) => string
) {
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
              label: t('ResourceFlavor'),
              getter: (row: FlavorUsageRow) =>
                row.flavor === '-' ? '-' : renderResourceFlavorLink(row.flavor),
            },
            {
              label: t('Resource'),
              getter: (row: FlavorUsageRow) => row.resource,
            },
            {
              label: t('Total'),
              getter: (row: FlavorUsageRow) => row.total ?? '-',
            },
            {
              label: t('Borrowed'),
              getter: (row: FlavorUsageRow) => row.borrowed ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build the extra detail section for configured admission checks. */
function getAdmissionChecksSection(clusterQueue: ClusterQueue, t: (key: string) => string) {
  const rows = getAdmissionCheckRows(clusterQueue);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'admission-checks',
    section: (
      <SectionBox title={t('Admission Checks')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Name'),
              getter: (row: AdmissionCheckRow) => renderAdmissionCheckLink(row.name),
            },
            {
              label: t('ResourceFlavors'),
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
                  t('All flavors')
                ),
            },
          ]}
        />
      </SectionBox>
    ),
  };
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
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={ClusterQueue}
      resourceLabel={t('ClusterQueues')}
      verb="get"
    >
      <DetailsGrid
        resourceType={ClusterQueue}
        name={name}
        withEvents
        extraInfo={clusterQueue =>
          clusterQueue
            ? [
                {
                  name: t('Cohort'),
                  value: renderCohortLink(clusterQueue.spec.cohortName),
                },
                {
                  name: t('Queueing Strategy'),
                  value: clusterQueue.queueingStrategy,
                },
                {
                  name: t('Stop Policy'),
                  value: clusterQueue.stopPolicy,
                },
                {
                  name: t('Namespace Selector'),
                  value: clusterQueue.namespaceSelectorDisplay,
                },
                {
                  name: t('Pending Workloads'),
                  value: clusterQueue.pendingWorkloads,
                },
                {
                  name: t('Admitted Workloads'),
                  value: clusterQueue.admittedWorkloads,
                },
                {
                  name: t('Reserving Workloads'),
                  value: clusterQueue.reservingWorkloads,
                },
                {
                  name: t('Status'),
                  value: clusterQueue.statusDisplay,
                },
                {
                  name: t('Referenced ResourceFlavors'),
                  value: clusterQueue.referencedFlavorNamesDisplay,
                },
                {
                  name: t('Preemption'),
                  value: clusterQueue.preemptionDisplay,
                },
                {
                  name: t('Flavor Fungibility'),
                  value: clusterQueue.flavorFungibilityDisplay,
                },
                {
                  name: t('Fair Sharing'),
                  value: clusterQueue.fairSharingDisplay,
                },
                {
                  name: t('Admission Scope'),
                  value: clusterQueue.admissionScopeDisplay,
                },
                {
                  name: t('Concurrent Admission'),
                  value: clusterQueue.concurrentAdmissionPolicyDisplay,
                },
              ]
            : []
        }
        extraSections={clusterQueue =>
          clusterQueue
            ? [
                getConditionsSection(clusterQueue),
                getResourceGroupsSection(clusterQueue, t),
                getAdmissionChecksSection(clusterQueue, t),
                getFlavorUsageSection(
                  t('Flavor Reservations'),
                  'flavor-reservations',
                  clusterQueue.status.flavorsReservation,
                  t
                ),
                getFlavorUsageSection(
                  t('Flavor Usage'),
                  'flavor-usage',
                  clusterQueue.status.flavorsUsage,
                  t
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
