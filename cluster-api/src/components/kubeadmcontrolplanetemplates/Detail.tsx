import { DetailsGrid, Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { KubeadmControlPlaneTemplate } from '../../resources/kubeadmcontrolplanetemplate';
import { useCapiApiVersion } from '../../utils/capiVersion';

export function KubeadmControlPlaneTemplateDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const apiVersion = useCapiApiVersion(KubeadmControlPlaneTemplate.crdName, 'v1beta1');
  const VersionedKCPT = useMemo(
    () =>
      apiVersion
        ? KubeadmControlPlaneTemplate.withApiVersion(apiVersion)
        : KubeadmControlPlaneTemplate,
    [apiVersion]
  );

  if (!apiVersion) return <Loader title="Detecting KCP Template version" />;

  return (
    <>
      <DetailsGrid
        resourceType={VersionedKCPT}
        withEvents
        name={name || node?.kubeObject?.metadata?.name}
        namespace={namespace || node?.kubeObject?.metadata?.namespace}
      />
    </>
  );
}
