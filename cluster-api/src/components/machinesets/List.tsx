import {
  Link,
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { getCondition } from '../../resources/common';
import { MachineSet } from '../../resources/machineset';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { ScaleButton } from '../common/index';
import { renderConditionStatus } from '../common/util';

interface MachineSetsListWithDataProps {
  MachineSetClass: typeof MachineSet;
}

function MachineSetsListWithData({ MachineSetClass }: MachineSetsListWithDataProps) {
  return (
    <ResourceListView
      title="Machine Sets"
      resourceClass={MachineSetClass}
      actions={[{ id: 'scale', action: (item: any) => <ScaleButton item={item} /> }]}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: ms => ms.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] ?? '-',
          render: ms => {
            const cluster = ms.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
            if (!cluster) return '-';
            return (
              <Link
                routeName="capicluster"
                params={{ name: cluster, namespace: ms.metadata?.namespace ?? '' }}
              >
                {cluster}
              </Link>
            );
          },
        },
        {
          id: 'desired',
          label: 'Desired',
          getValue: ms => ms.spec?.replicas ?? 0,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: ms => `${ms.status?.readyReplicas ?? 0}/${ms.spec?.replicas ?? 0}`,
          render: ms => {
            const ready = ms.status?.readyReplicas ?? 0;
            const desired = ms.spec?.replicas ?? 0;
            const isReady = ready === desired && desired > 0;
            return (
              <StatusLabel status={isReady ? 'success' : 'warning'}>
                {ready}/{desired}
              </StatusLabel>
            );
          },
        },
        {
          id: 'available',
          label: 'Available',
          getValue: ms => ms.status?.availableReplicas ?? 0,
        },
        {
          id: 'uptodate',
          label: 'Up-to-date',
          getValue: ms => ms.upToDateReplicas ?? '-',
        },
        {
          id: 'Paused',
          label: 'Paused',
          getValue: (ms: MachineSet) => {
            const cond = getCondition(ms.conditions, 'Paused');
            if (!cond) return 'Unknown';
            return cond?.status;
          },
          render: (ms: MachineSet) =>
            renderConditionStatus(undefined, getCondition(ms.conditions, 'Paused'), {
              trueLabel: 'true',
              falseLabel: 'false',
              trueStatus: 'warning',
              falseStatus: 'success',
            }),
        },
        {
          id: 'version',
          label: 'Version',
          getValue: ms => ms.spec?.template?.spec?.version ?? '-',
        },
        'age',
      ]}
    />
  );
}

export function MachineSetsList() {
  const version = useCapiApiVersion(MachineSet.crdName, 'v1beta1');
  const VersionedMachineSet = useMemo(
    () => (version ? MachineSet.withApiVersion(version) : MachineSet),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;
  return <MachineSetsListWithData MachineSetClass={VersionedMachineSet} />;
}
