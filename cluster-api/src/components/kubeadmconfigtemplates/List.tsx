import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeadmConfigTemplate } from '../../resources/kubeadmconfigtemplate';

export function KubeadmConfigTemplatesList() {
  return (
    <ResourceListView
      title="Kubeadm Config Templates"
      resourceClass={KubeadmConfigTemplate}
      columns={['name', 'namespace', 'age']}
    />
  );
}
