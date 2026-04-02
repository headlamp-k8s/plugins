import {
  Link,
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { MachineDeployment } from '../../resources/machinedeployment';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { ScaleButton } from '../common/index';
import { getPhaseStatus, renderConditionStatus } from '../common/util';

interface MachineDeploymentsListWithDataProps {
  MachineDeploymentClass: typeof MachineDeployment;
}

function MachineDeploymentsListWithData({
  MachineDeploymentClass,
}: MachineDeploymentsListWithDataProps) {
  return (
    <ResourceListView
      title="Machine Deployments"
      resourceClass={MachineDeploymentClass}
      actions={[{ id: 'scale', action: (item: any) => <ScaleButton item={item} /> }]}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: deployment =>
            deployment.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] ?? '-',
          render: deployment => {
            const cluster = deployment.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
            if (!cluster) return '-';
            return (
              <Link
                routeName="capicluster"
                params={{
                  name: cluster,
                  namespace: deployment.metadata?.namespace ?? '',
                }}
              >
                {cluster}
              </Link>
            );
          },
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: deployment =>
            `${deployment.status?.readyReplicas ?? 0}/${deployment.spec?.replicas ?? 0}`,
          render: deployment => {
            const ready = deployment.status?.readyReplicas ?? 0;
            const desired = deployment.spec?.replicas ?? 0;
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
          getValue: deployment => deployment.status?.availableReplicas ?? 0,
        },
        {
          id: 'uptodate',
          label: 'Up-to-date',
          getValue: deployment => deployment.upToDateReplicas ?? '-',
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: deployment => deployment.status?.phase,
          render: deployment => {
            const phase = deployment.status?.phase;
            if (!phase) return '-';
            return <StatusLabel status={getPhaseStatus(phase)}>{phase}</StatusLabel>;
          },
        },
        {
          id: 'paused',
          label: 'Paused',
          getValue: deployment => (deployment.spec?.paused ? 'true' : 'false'),
          render: deployment =>
            renderConditionStatus(deployment.spec?.paused ? 'true' : 'false', undefined, {
              trueLabel: 'true',
              falseLabel: 'false',
              trueStatus: 'warning',
              falseStatus: 'success',
            }),
        },
        {
          id: 'version',
          label: 'Version',
          getValue: deployment => deployment.spec?.template?.spec?.version ?? '-',
        },
        'age',
      ]}
    />
  );
}

export function MachineDeploymentsList() {
  const version = useCapiApiVersion(MachineDeployment.crdName, 'v1beta1');
  const VersionedMachineDeployment = useMemo(
    () => (version ? MachineDeployment.withApiVersion(version) : MachineDeployment),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;

  return <MachineDeploymentsListWithData MachineDeploymentClass={VersionedMachineDeployment} />;
}
