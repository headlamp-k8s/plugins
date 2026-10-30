import { ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  useSelectedNamespaces,
  useVolcanoNamespaceQueueClusters,
} from '../../hooks/useVolcanoInstallChecks';
import { VolcanoNamespaceQueue } from '../../resources/namespacequeue';
import { getQueueStatusColor } from '../../utils/status';
import { namespaceQueueNotInstalledMessage, NotInstalledBanner } from '../common/CommonComponents';
import { formatKeyValueMap } from '../jobs/detailRows';

/**
 * Renders the Volcano NamespaceQueues list page.
 *
 * @returns NamespaceQueues resource list view.
 */
export default function NamespaceQueueList() {
  // Probe each selected cluster separately and list only from the ones that serve the CRD, so a
  // cluster without it does not hide the NamespaceQueues of another selected cluster.
  const { servingClusters, isCheckLoading } = useVolcanoNamespaceQueueClusters();
  const namespaces = useSelectedNamespaces();
  const [namespaceQueues, namespaceQueuesError] = VolcanoNamespaceQueue.useList({
    clusters: servingClusters ?? [],
    namespace: namespaces,
  });

  if (!servingClusters?.length) {
    return (
      <NotInstalledBanner
        isLoading={isCheckLoading}
        message={namespaceQueueNotInstalledMessage}
        linkText="Volcano"
      />
    );
  }

  return (
    <>
      <ResourceListView
        title="Volcano NamespaceQueues"
        // Data mode does not show the namespace filter on its own, and the list above already
        // applies the selected namespaces.
        headerProps={{ noNamespaceFilter: false }}
        data={namespaceQueues}
        errors={namespaceQueuesError ? [namespaceQueuesError] : null}
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
    </>
  );
}
