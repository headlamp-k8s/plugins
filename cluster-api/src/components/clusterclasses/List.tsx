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
  return (
    <ResourceListView
      title="Cluster Classes"
      resourceClass={ClusterClassType}
      columns={[
        'name',
        'namespace',
        {
          id: 'controlplane',
          label: 'Control Plane',
          getValue: (cc: ClusterClass) => (cc.spec?.controlPlane ? 'Defined' : 'Missing'),
          render: (cc: ClusterClass) => (
            <StatusLabel status={cc.spec?.controlPlane ? 'success' : 'warning'}>
              {cc.spec?.controlPlane ? 'Defined' : 'Missing'}
            </StatusLabel>
          ),
        },
        {
          id: 'workers',
          label: 'Workers',
          getValue: (cc: ClusterClass) => {
            const md = cc.spec?.workers?.machineDeployments?.length ?? 0;
            const mp = cc.spec?.workers?.machinePools?.length ?? 0;
            return md + mp;
          },
        },
        {
          id: 'variables',
          label: 'Variables',
          getValue: (cc: ClusterClass) => cc.spec?.variables?.length ?? 0,
        },
        {
          id: 'patches',
          label: 'Patches',
          getValue: (cc: ClusterClass) => cc.spec?.patches?.length ?? 0,
        },
        {
          id: 'variablesReady',
          label: 'Variables Ready',
          getValue: (cc: ClusterClass) => {
            const cond = getCondition(cc.conditions, 'VariablesReady');
            if (!cond) return 'Unknown';
            return cond.status === 'True' ? 'Ready' : 'Not Ready';
          },
          render: (cc: ClusterClass) =>
            renderConditionStatus(undefined, getCondition(cc.conditions, 'VariablesReady'), {
              trueLabel: 'Ready',
              falseLabel: 'Not Ready',
              trueStatus: 'success',
              falseStatus: 'error',
            }),
        },
        {
          id: 'paused',
          label: 'Paused',
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
  const version = useCapiApiVersion(ClusterClass.crdName, 'v1beta1');

  const VersionedClusterClass = useMemo(
    () => (version ? ClusterClass.withApiVersion(version) : ClusterClass),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;
  return <ClusterClassesListWithData ClusterClassType={VersionedClusterClass} />;
}
