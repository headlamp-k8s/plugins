import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

export function workloadClass() {
  const group = 'kueue.x-k8s.io';
  const version = 'v1beta1';

  const Workload = makeCustomResourceClass({
    apiInfo: [{ group, version }],
    isNamespaced: true,
    singularName: 'Workload',
    pluralName: 'workloads',
    kind: 'Workload',
    customResourceDefinition: {
      getMainAPIGroup: () => [group, version],
    } as any,
  });

  return class extends Workload {
    static get detailsRoute() {
      return 'kueue-workload-detail';
    }
    static getMainAPIGroup() {
      return [group, version];
    }
  };
}

export function Workloads() {
  return (
    <ResourceListView
      title="Workloads"
      resourceClass={workloadClass()}
      columns={[
        'name',
        'namespace',
        {
          id: 'queue',
          label: 'Queue',
          getValue: item => item.jsonData?.spec?.queueName || '-',
        },
        {
          id: 'cluster-queue',
          label: 'ClusterQueue',
          getValue: item => item.jsonData?.status?.admission?.clusterQueue || '-',
        },
        {
          id: 'status',
          label: 'Status',
          getValue: item => {
            const conditions = item.jsonData?.status?.conditions || [];
            const admitted = conditions.find((c: any) => c.type === 'Admitted');
            if (admitted?.status === 'True') return 'Admitted';
            const quotaReserved = conditions.find((c: any) => c.type === 'QuotaReserved');
            if (quotaReserved?.status === 'True') return 'QuotaReserved';
            return 'Pending';
          },
        },
        'age',
      ]}
    />
  );
}
