import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoNamespaceQueue } from '../../resources/namespacequeue';
import { getQueueStatusColor } from '../../utils/status';
import { VolcanoNamespaceQueueInstallCheck } from '../common/CommonComponents';
import { formatKeyValueMap } from '../jobs/detailRows';

/**
 * Renders the Volcano NamespaceQueues list page.
 *
 * @returns NamespaceQueues resource list view.
 */
export default function NamespaceQueueList() {
  return (
    <VolcanoNamespaceQueueInstallCheck>
      <ResourceListView
        title="Volcano NamespaceQueues"
        resourceClass={VolcanoNamespaceQueue}
        columns={[
          'name',
          'namespace',
          {
            id: 'parent',
            label: 'Parent',
            getValue: (namespaceQueue: VolcanoNamespaceQueue) => namespaceQueue.spec.parent || '-',
          },
          {
            id: 'state',
            label: 'State',
            getValue: (namespaceQueue: VolcanoNamespaceQueue) => namespaceQueue.state,
            render: (namespaceQueue: VolcanoNamespaceQueue) => (
              <StatusLabel status={getQueueStatusColor(namespaceQueue.state)}>
                {namespaceQueue.state}
              </StatusLabel>
            ),
          },
          {
            id: 'capability',
            label: 'Capability',
            getValue: (namespaceQueue: VolcanoNamespaceQueue) =>
              formatKeyValueMap(namespaceQueue.spec.capability),
          },
          'age',
        ]}
      />
    </VolcanoNamespaceQueueInstallCheck>
  );
}
