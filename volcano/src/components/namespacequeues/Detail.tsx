import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { NamespaceQueueCondition, VolcanoNamespaceQueue } from '../../resources/namespacequeue';
import { getResourceNames } from '../../utils/namespaceQueue';
import { getQueueStatusColor } from '../../utils/status';
import { VolcanoNamespaceQueueInstallCheck } from '../common/CommonComponents';
import { formatKeyValueMap } from '../jobs/detailRows';

/**
 * Builds the PodGroup counters section for a NamespaceQueue.
 *
 * @param namespaceQueue NamespaceQueue shown in the details page.
 * @returns Status section descriptor.
 */
function getQueueStatusSection(namespaceQueue: VolcanoNamespaceQueue) {
  return {
    id: 'namespacequeue-status',
    section: (
      <SectionBox title="Queue Status">
        <NameValueTable
          rows={[
            { name: 'Inqueue', value: namespaceQueue.inqueue },
            { name: 'Pending', value: namespaceQueue.pending },
            { name: 'Running', value: namespaceQueue.running },
            { name: 'Unknown', value: namespaceQueue.unknown },
            { name: 'Completed', value: namespaceQueue.completed },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the per-resource table of capability, deserved, guarantee and allocated amounts.
 *
 * @param namespaceQueue NamespaceQueue shown in the details page.
 * @returns Section descriptor or `null` when no resource data is available.
 */
function getResourcesSection(namespaceQueue: VolcanoNamespaceQueue) {
  const capability = namespaceQueue.spec.capability || {};
  const deserved = namespaceQueue.deservedResources || {};
  const guarantee = namespaceQueue.guaranteedResources || {};
  const allocated = namespaceQueue.allocatedResources || {};
  const resourceRows = getResourceNames(capability, deserved, guarantee, allocated).map(
    resource => ({ resource })
  );

  if (!resourceRows.length) {
    return null;
  }

  return {
    id: 'namespacequeue-resources',
    section: (
      <SectionBox title="Resources">
        <SimpleTable
          data={resourceRows}
          columns={[
            {
              label: 'Resource',
              getter: (row: { resource: string }) => row.resource,
              sort: true,
            },
            {
              label: 'Capability',
              getter: (row: { resource: string }) => capability[row.resource] ?? '-',
            },
            {
              label: 'Deserved',
              getter: (row: { resource: string }) => deserved[row.resource] ?? '-',
            },
            {
              label: 'Guarantee',
              getter: (row: { resource: string }) => guarantee[row.resource] ?? '-',
            },
            {
              label: 'Allocated',
              getter: (row: { resource: string }) => allocated[row.resource] ?? '-',
            },
          ]}
          showPagination={false}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the reservation section for a NamespaceQueue.
 *
 * @param namespaceQueue NamespaceQueue shown in the details page.
 * @returns Section descriptor or `null` when nothing is reserved.
 */
function getReservationSection(namespaceQueue: VolcanoNamespaceQueue) {
  const reservedResources = namespaceQueue.reservedResources || {};
  const reservedNodes = namespaceQueue.reservedNodes;
  const resourceNames = Object.keys(reservedResources);

  if (!resourceNames.length && !reservedNodes.length) {
    return null;
  }

  return {
    id: 'namespacequeue-reservation',
    section: (
      <SectionBox title="Reservation">
        <NameValueTable
          rows={[
            ...resourceNames.map(resource => ({
              name: resource,
              value: reservedResources[resource],
            })),
            {
              name: 'Reserved Nodes',
              value: reservedNodes.length ? reservedNodes.join(', ') : '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/**
 * Builds the conditions section for a NamespaceQueue.
 *
 * @param namespaceQueue NamespaceQueue shown in the details page.
 * @returns Section descriptor or `null` when the status has no conditions.
 */
function getConditionsSection(namespaceQueue: VolcanoNamespaceQueue) {
  const conditions = namespaceQueue.status?.conditions;

  if (!conditions?.length) {
    return null;
  }

  return {
    id: 'namespacequeue-conditions',
    section: (
      <SectionBox title="Conditions">
        <SimpleTable
          data={conditions}
          columns={[
            {
              label: 'Type',
              getter: (condition: NamespaceQueueCondition) => condition.type,
              sort: true,
            },
            {
              label: 'Status',
              getter: (condition: NamespaceQueueCondition) => condition.status,
            },
            {
              label: 'Reason',
              getter: (condition: NamespaceQueueCondition) => condition.reason || '-',
            },
            {
              label: 'Message',
              getter: (condition: NamespaceQueueCondition) => condition.message || '-',
            },
          ]}
          showPagination={false}
        />
      </SectionBox>
    ),
  };
}

/**
 * Renders the Volcano NamespaceQueue details page.
 *
 * @returns NamespaceQueue details view with extra sections and events.
 */
export default function NamespaceQueueDetail(props: {
  name?: string;
  namespace?: string;
  cluster?: string;
}) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name, namespace = params.namespace, cluster } = props;

  return (
    <VolcanoNamespaceQueueInstallCheck>
      <DetailsGrid
        resourceType={VolcanoNamespaceQueue}
        name={name}
        namespace={namespace}
        cluster={cluster}
        withEvents
        extraInfo={(namespaceQueue: VolcanoNamespaceQueue) =>
          namespaceQueue && [
            {
              name: 'State',
              value: (
                <StatusLabel status={getQueueStatusColor(namespaceQueue.state)}>
                  {namespaceQueue.state}
                </StatusLabel>
              ),
            },
            { name: 'Parent', value: namespaceQueue.spec.parent || '-' },
            { name: 'Capability', value: formatKeyValueMap(namespaceQueue.spec.capability) },
            { name: 'Deserved', value: formatKeyValueMap(namespaceQueue.deservedResources) },
            { name: 'Guarantee', value: formatKeyValueMap(namespaceQueue.guaranteedResources) },
            { name: 'Priority', value: namespaceQueue.priority },
            { name: 'Reclaimable', value: namespaceQueue.reclaimable ? 'Yes' : 'No' },
            { name: 'Dequeue Strategy', value: namespaceQueue.dequeueStrategy },
          ]
        }
        extraSections={(namespaceQueue: VolcanoNamespaceQueue) =>
          namespaceQueue &&
          [
            getQueueStatusSection(namespaceQueue),
            getResourcesSection(namespaceQueue),
            getReservationSection(namespaceQueue),
            getConditionsSection(namespaceQueue),
          ].filter(Boolean)
        }
      />
    </VolcanoNamespaceQueueInstallCheck>
  );
}
