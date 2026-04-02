import {
  Link,
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import React, { useMemo } from 'react';
import { getCondition } from '../../resources/common';
import { KubeadmConfig } from '../../resources/kubeadmconfig';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { renderConditionStatus } from '../common/util';

interface KubeadmConfigsListWithDataProps {
  KubeadmConfigClass: typeof KubeadmConfig;
}

/**
 * Data-fetching wrapper for the KubeadmConfig list.
 *
 * @param props - Component properties.
 * @param props.KubeadmConfigClass - The KubeadmConfig resource class bound to a specific API version.
 */
function KubeadmConfigsListWithData({ KubeadmConfigClass }: KubeadmConfigsListWithDataProps) {
  return (
    <ResourceListView
      title="Kubeadm Configs"
      resourceClass={KubeadmConfigClass}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: (kc: KubeadmConfig) =>
            kc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] ?? '-',
          render: (kc: KubeadmConfig) => {
            const name = kc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
            if (!name) return <>-</>;

            return (
              <Link routeName="capicluster" params={{ name, namespace: kc.metadata?.namespace }}>
                {name}
              </Link>
            );
          },
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: (kc: KubeadmConfig) => {
            const cond = getCondition(kc.conditions, 'Ready');
            if (!cond) return 'Unknown';
            return cond?.status;
          },
          render: (kc: KubeadmConfig) =>
            renderConditionStatus(undefined, getCondition(kc.conditions, 'Ready'), {
              trueLabel: 'true',
              falseLabel: 'false',
              trueStatus: 'success',
              falseStatus: 'error',
            }),
        },
        {
          id: 'dataSecret',
          label: 'Data Secret',
          getValue: (kc: KubeadmConfig) => kc.status?.dataSecretName ?? '-',
          render: (kc: KubeadmConfig) => {
            const secretName = kc.status?.dataSecretName;
            if (!secretName) return '-';
            return (
              <Link
                routeName="secret"
                params={{ name: secretName, namespace: kc.metadata?.namespace }}
              >
                {secretName}
              </Link>
            );
          },
        },
        {
          id: 'format',
          label: 'Format',
          getValue: (kc: KubeadmConfig) => kc.spec?.format ?? '-',
          render: (kc: KubeadmConfig) => {
            const format = kc.spec?.format;
            if (!format) return '-';
            return <StatusLabel status="info">{format}</StatusLabel>;
          },
        },
        'age',
      ]}
    />
  );
}

/**
 * Main entry point for the KubeadmConfigs list view.
 * Detects the CAPI version and renders the list with the correct resource class.
 */
export function KubeadmConfigsList() {
  const version = useCapiApiVersion(KubeadmConfig.crdName, 'v1beta1');
  const VersionedKubeadmConfig = useMemo(
    () => (version ? KubeadmConfig.withApiVersion(version) : KubeadmConfig),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;
  return <KubeadmConfigsListWithData KubeadmConfigClass={VersionedKubeadmConfig} />;
}
