import {
  ConditionsSection,
  DetailsGrid,
  Link,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import {
  ClusterQueue,
  FlavorUsage,
  ResourceGroup,
  ResourceQuota,
} from '../../resources/clusterQueue';
import { kueueRouteNames } from '../../utils/kueueRoutes';

interface ResourceGroupRow {
  group: string;
  coveredResources: string;
  flavor: string;
  resource: string;
  nominalQuota: string | number;
  borrowingLimit?: string | number;
  lendingLimit?: string | number;
}

interface FlavorUsageRow {
  flavor: string;
  resource: string;
  total?: string | number;
  borrowed?: string | number;
}

interface AdmissionCheckRow {
  name: string;
  flavors: string[];
}

function renderFlavorLink(flavorName: string) {
  return (
    <Link routeName={kueueRouteNames.resourceFlavorDetail} params={{ name: flavorName }}>
      {flavorName}
    </Link>
  );
}

function getResourceGroupRows(resourceGroups: ResourceGroup[]): ResourceGroupRow[] {
  return resourceGroups.flatMap((group, groupIndex): ResourceGroupRow[] => {
    const groupLabel = `Group ${groupIndex + 1}`;
    const coveredResources = group.coveredResources?.join(', ') || '-';

    if (!group.flavors?.length) {
      return [
        {
          group: groupLabel,
          coveredResources,
          flavor: '-',
          resource: '-',
          nominalQuota: '-',
        },
      ];
    }

    return group.flavors.flatMap((flavor): ResourceGroupRow[] => {
      if (!flavor.resources?.length) {
        return [
          {
            group: groupLabel,
            coveredResources,
            flavor: flavor.name,
            resource: '-',
            nominalQuota: '-',
          },
        ];
      }

      return flavor.resources.map((resource: ResourceQuota) => ({
        group: groupLabel,
        coveredResources,
        flavor: flavor.name,
        resource: resource.name,
        nominalQuota: resource.nominalQuota,
        borrowingLimit: resource.borrowingLimit,
        lendingLimit: resource.lendingLimit,
      }));
    });
  });
}

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

function getAdmissionCheckRows(clusterQueue: ClusterQueue): AdmissionCheckRow[] {
  return (
    clusterQueue.spec.admissionChecksStrategy?.admissionChecks?.map(check => ({
      name: check.name,
      flavors: check.onFlavors || [],
    })) || []
  );
}

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
                row.flavor === '-' ? '-' : renderFlavorLink(row.flavor),
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
              getter: (row: AdmissionCheckRow) => row.name,
            },
            {
              label: 'ResourceFlavors',
              getter: (row: AdmissionCheckRow) =>
                row.flavors.length ? (
                  <>
                    {row.flavors.map((flavor, index) => (
                      <span key={flavor}>
                        {index > 0 ? ', ' : ''}
                        {renderFlavorLink(flavor)}
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

function getConditionsSection(clusterQueue: ClusterQueue) {
  if (!clusterQueue.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={clusterQueue.jsonData} />,
  };
}

export default function ClusterQueueDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <DetailsGrid
      resourceType={ClusterQueue}
      name={name}
      withEvents
      extraInfo={clusterQueue =>
        clusterQueue
          ? [
              {
                name: 'Cohort',
                value: clusterQueue.cohortName,
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
            ].filter(Boolean)
          : []
      }
    />
  );
}
