import {
  Link,
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { getKCTFailure, KubeadmConfigTemplate } from '../../resources/kubeadmconfigtemplate';
import { useCapiApiVersion } from '../../utils/capiVersion';

interface KCTListWithDataProps {
  KCTClass: typeof KubeadmConfigTemplate;
}
export function KCTListWithData({ KCTClass }: KCTListWithDataProps) {
  return (
    <ResourceListView
      title="Kubeadm Config Templates"
      resourceClass={KCTClass}
      columns={[
        'name',
        'namespace',

        {
          id: 'cluster',
          label: 'Cluster',
          getValue: (item: KubeadmConfigTemplate) =>
            item.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] ?? '-',
          render: (item: KubeadmConfigTemplate) => {
            const name = item.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
            if (!name) return <>—</>;

            return (
              <Link routeName="capicluster" params={{ name, namespace: item.metadata?.namespace }}>
                {name}
              </Link>
            );
          },
        },

        {
          id: 'format',
          label: 'Format',
          getValue: (item: KubeadmConfigTemplate) => item.configSpec?.format ?? '—',
        },

        {
          id: 'status',
          label: 'Status',
          getValue: (item: KubeadmConfigTemplate) => {
            const failure = getKCTFailure(item.jsonData);
            return failure?.failureReason ? 0 : 1;
          },
          render: (item: KubeadmConfigTemplate) => {
            const failure = getKCTFailure(item.jsonData);

            if (failure?.failureReason) {
              return <StatusLabel status="error">{failure.failureReason}</StatusLabel>;
            }

            return <StatusLabel status="success">OK</StatusLabel>;
          },
        },

        'age',
      ]}
    />
  );
}
export function KubeadmConfigTemplatesList() {
  const version = useCapiApiVersion(KubeadmConfigTemplate.crdName, 'v1beta1');
  const VersionedKCT = useMemo(
    () => (version ? KubeadmConfigTemplate.withApiVersion(version) : KubeadmConfigTemplate),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;
  return <KCTListWithData KCTClass={VersionedKCT} />;
}
