import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { ClusterClass } from '../../resources/clusterclass';
import { getCondition } from '../../resources/common';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { renderConditionStatus } from '../common/util';

interface ClusterClassesListWithDataProps {
  ClusterClassType: typeof ClusterClass;
}

function ClusterClassesListWithData({ ClusterClassType }: ClusterClassesListWithDataProps) {
  const { t } = useTranslation();
  return (
    <ResourceListView
      title={t('Cluster Classes')}
      resourceClass={ClusterClassType}
      columns={[
        'name',
        'namespace',
        {
          id: 'controlplane',
          label: t('Control Plane'),
          getValue: (cc: ClusterClass) => (cc.spec?.controlPlane ? 'Defined' : 'Missing'),
          render: (cc: ClusterClass) => (
            <StatusLabel status={cc.spec?.controlPlane ? 'success' : 'warning'}>
              {cc.spec?.controlPlane ? t('Defined') : t('Missing')}
            </StatusLabel>
          ),
        },
        {
          id: 'workers',
          label: t('Workers'),
          getValue: (cc: ClusterClass) => {
            const md = cc.spec?.workers?.machineDeployments?.length ?? 0;
            const mp = cc.spec?.workers?.machinePools?.length ?? 0;
            return md + mp;
          },
        },
        {
          id: 'variables',
          label: t('Variables'),
          getValue: (cc: ClusterClass) => cc.spec?.variables?.length ?? 0,
        },
        {
          id: 'patches',
          label: t('Patches'),
          getValue: (cc: ClusterClass) => cc.spec?.patches?.length ?? 0,
        },
        {
          id: 'variablesReady',
          label: t('Variables Ready'),
          getValue: (cc: ClusterClass) => {
            const cond = getCondition(cc.conditions, 'VariablesReady');
            if (!cond) return 'Unknown';
            return cond.status === 'True' ? 'Ready' : 'Not Ready';
          },
          render: (cc: ClusterClass) =>
            renderConditionStatus(undefined, getCondition(cc.conditions, 'VariablesReady'), {
              trueLabel: t('Ready'),
              falseLabel: t('Not Ready'),
              trueStatus: 'success',
              falseStatus: 'error',
            }),
        },
        {
          id: 'paused',
          label: t('Paused'),
          getValue: (cc: ClusterClass) => {
            const cond = getCondition(cc.conditions, 'Paused');
            if (!cond) return 'Unknown';
            return cond?.status;
          },
          render: (cc: ClusterClass) =>
            renderConditionStatus(undefined, getCondition(cc.conditions, 'Paused'), {
              trueLabel: 'true',
              falseLabel: 'false',
              trueStatus: 'warning',
              falseStatus: 'success',
            }),
        },
        'age',
      ]}
    />
  );
}

export function ClusterClassesList() {
  const { t } = useTranslation();
  const version = useCapiApiVersion(ClusterClass.crdName, 'v1beta1');

  const VersionedClusterClass = useMemo(
    () => (version ? ClusterClass.withApiVersion(version) : ClusterClass),
    [version]
  );
  if (!version) return <Loader title={t('Detecting Cluster API version')} />;
  return <ClusterClassesListWithData ClusterClassType={VersionedClusterClass} />;
}
