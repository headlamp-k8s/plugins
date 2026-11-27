import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Loader, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { KubeadmControlPlaneTemplate } from '../../resources/kubeadmcontrolplanetemplate';
import { useCapiApiVersion } from '../../utils/capiVersion';

interface KubeadmControlPlaneTemplatesListWithDataProps {
  KCPTClass: typeof KubeadmControlPlaneTemplate;
}

function KubeadmControlPlaneTemplatesListWithData({
  KCPTClass,
}: KubeadmControlPlaneTemplatesListWithDataProps) {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Kubeadm Control Plane Templates')}
      resourceClass={KCPTClass}
      columns={['name', 'namespace', 'age']}
    />
  );
}

export function KubeadmControlPlaneTemplatesList() {
  const { t } = useTranslation();
  const version = useCapiApiVersion(KubeadmControlPlaneTemplate.crdName, 'v1beta1');
  const VersionedKCPT = useMemo(
    () =>
      version ? KubeadmControlPlaneTemplate.withApiVersion(version) : KubeadmControlPlaneTemplate,
    [version]
  );
  if (!version) return <Loader title={t('Detecting KCP Template version')} />;
  return <KubeadmControlPlaneTemplatesListWithData KCPTClass={VersionedKCPT} />;
}
