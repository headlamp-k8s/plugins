import {
  Link,
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import {
  getKCPAvailableReplicas,
  getKCPInitialized,
  getKCPUpToDateReplicas,
  KubeadmControlPlane,
} from '../../resources/kubeadmcontrolplane';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { ScaleButton } from '../common/index';

interface KubeadmControlPlanesListWithDataProps {
  KubeadmControlPlaneClass: typeof KubeadmControlPlane;
}

function KubeadmControlPlanesListWithData({
  KubeadmControlPlaneClass,
}: KubeadmControlPlanesListWithDataProps) {
  return (
    <ResourceListView
      title="Kubeadm Control Planes"
      resourceClass={KubeadmControlPlaneClass}
      actions={[{ id: 'scale', action: (item: any) => <ScaleButton item={item} /> }]}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: kcp => kcp.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] ?? '-',
          render: kcp => {
            const cluster = kcp.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
            if (!cluster) return '-';
            return (
              <Link
                routeName="capicluster"
                params={{ name: cluster, namespace: kcp.metadata?.namespace ?? '' }}
              >
                {cluster}
              </Link>
            );
          },
        },
        {
          id: 'initialized',
          label: 'Initialized',
          // v1beta1: status.initialized / v1beta2: status.initialization.controlPlaneInitialized
          getValue: kcp => {
            const init = getKCPInitialized(kcp.jsonData);
            return init === undefined ? '-' : init ? 'True' : 'False';
          },
          render: kcp => {
            const init = getKCPInitialized(kcp.jsonData);
            if (init === undefined) return '-';
            return (
              <StatusLabel status={init ? 'success' : 'warning'}>
                {init ? 'True' : 'False'}
              </StatusLabel>
            );
          },
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: kcp => {
            const ready = kcp.status?.readyReplicas ?? 0;
            const desired = kcp.spec?.replicas ?? 0;
            return `${ready}/${desired}`;
          },
          render: kcp => {
            const ready = kcp.status?.readyReplicas ?? 0;
            const desired = kcp.spec?.replicas ?? 0;
            const isReady = desired > 0 && ready === desired;
            return (
              <StatusLabel status={isReady ? 'success' : 'warning'}>
                {ready}/{desired}
              </StatusLabel>
            );
          },
        },
        {
          id: 'availableReplicas',
          label: 'Available',
          getValue: kcp => {
            const val = getKCPAvailableReplicas(kcp.jsonData);
            return val !== undefined ? String(val) : '-';
          },
        },
        {
          id: 'uptodate',
          label: 'Up-to-date',
          getValue: kcp => {
            const val = getKCPUpToDateReplicas(kcp.jsonData);
            return val !== undefined ? String(val) : '-';
          },
        },
        {
          id: 'failure',
          label: 'Failure',
          getValue: kcp => kcp.failure?.failureReason ?? '-',
          render: kcp => {
            if (!kcp.failure) return '-';
            return <StatusLabel status="error">{kcp.failure.failureReason || 'Error'}</StatusLabel>;
          },
        },
        {
          id: 'version',
          label: 'Version',
          getValue: kcp => kcp.spec?.version ?? '-',
        },
        'age',
      ]}
    />
  );
}

export function KubeadmControlPlanesList() {
  const version = useCapiApiVersion(KubeadmControlPlane.crdName, 'v1beta1');
  const VersionedKubeadmControlPlane = useMemo(
    () => (version ? KubeadmControlPlane.withApiVersion(version) : KubeadmControlPlane),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;

  return (
    <KubeadmControlPlanesListWithData KubeadmControlPlaneClass={VersionedKubeadmControlPlane} />
  );
}
