import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { KubeadmControlPlaneTemplate } from '../../resources/kubeadmcontrolplanetemplate';

export function KubeadmControlPlaneTemplateDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={KubeadmControlPlaneTemplate}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
      />
    </>
  );
}
