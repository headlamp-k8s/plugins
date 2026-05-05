import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

export function clusterQueueClass() {
  const group = 'kueue.x-k8s.io';
  const version = 'v1beta1';

  const ClusterQueue = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    isNamespaced: false,
    singularName: 'ClusterQueue',
    pluralName: 'clusterqueues',
    kind: 'ClusterQueue',
    customResourceDefinition: {
      getMainAPIGroup: () => [group, version],
    } as any,
  });

  return class extends ClusterQueue {
    static get detailsRoute() {
      return 'kueue-clusterqueue-detail';
    }
    static getMainAPIGroup() {
      return [group, version];
    }
  };
}

export function ClusterQueues() {
  return (
    <ResourceListView
      title="ClusterQueues"
      resourceClass={clusterQueueClass()}
      columns={[
        'name',
        {
          id: 'cohort',
          label: 'Cohort',
          getValue: item => item.jsonData?.spec?.cohortName || '-',
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
