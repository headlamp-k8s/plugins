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
        },

        {
          id: 'format',
          label: 'Format',
          getValue: (kc: KubeadmConfig) => kc.spec?.format ?? '-',
        },

        {
          id: 'ntp',
          label: 'NTP',
          getValue: (kc: KubeadmConfig) => (kc.spec?.ntp?.enabled ? 1 : 0),
          render: (kc: KubeadmConfig) => {
            if (kc.spec?.ntp === undefined) return <>-</>;

            const enabled = kc.spec.ntp.enabled;

            return (
              <StatusLabel status={enabled ? 'success' : 'warning'}>
                {enabled ? 'Enabled' : 'Disabled'}
              </StatusLabel>
            );
          },
        },

        {
          id: 'users',
          label: 'Users',
          getValue: (kc: KubeadmConfig) => kc.spec?.users?.length ?? 0,
        },

        {
          id: 'files',
          label: 'Files',
          getValue: (kc: KubeadmConfig) => kc.spec?.files?.length ?? 0,
        },
        'age',
      ]}
    />
  );
}

export function KubeadmConfigsList() {
  const version = useCapiApiVersion(KubeadmConfig.crdName, 'v1beta1');
  const VersionedKubeadmConfig = useMemo(
    () => (version ? KubeadmConfig.withApiVersion(version) : KubeadmConfig),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;
  return <KubeadmConfigsListWithData KubeadmConfigClass={VersionedKubeadmConfig} />;
}
