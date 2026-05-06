import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

export function localQueueClass() {
  const group = 'kueue.x-k8s.io';
  const version = 'v1beta1';

  const LocalQueue = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    isNamespaced: true,
    singularName: 'LocalQueue',
    pluralName: 'localqueues',
    kind: 'LocalQueue',
    customResourceDefinition: {
      getMainAPIGroup: () => [group, version],
    } as any,
  });

  return class extends LocalQueue {
    static get detailsRoute() {
      return 'kueue-localqueue-detail';
    }
    static getMainAPIGroup() {
      return [group, version];
    }
  };
}

export function LocalQueues() {
  return (
    <ResourceListView
      title="LocalQueues"
      resourceClass={localQueueClass()}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster-queue',
          label: 'ClusterQueue',
          getValue: item => item.jsonData?.spec?.clusterQueue || '-',
        },
        {
          id: 'pending-workloads',
          label: 'Pending Workloads',
          getValue: item => item.jsonData?.status?.pendingWorkloads ?? '-',
        },
        {
          id: 'admitted-workloads',
          label: 'Admitted Workloads',
          getValue: item => item.jsonData?.status?.admittedWorkloads ?? '-',
        },
        {
          id: 'status',
          label: 'Status',
          getValue: item => {
            const conditions = item.jsonData?.status?.conditions || [];
            const active = conditions.find((c: any) => c.type === 'Active');
            return active?.status === 'True' ? 'Active' : 'Inactive';
          },
        },
        'age',
      ]}
    />
  );
}
