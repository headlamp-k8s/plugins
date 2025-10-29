import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeadmControlPlaneTemplate } from '../../resources/kubeadmcontrolplanetemplate';

export function KubeadmControlPlaneTemplatesList() {
  return (
    <ResourceListView
      title="Kubeadm Control Plane Templates"
      resourceClass={KubeadmControlPlaneTemplate}
      columns={['name', 'namespace', 'age']}
    />
  );
}
