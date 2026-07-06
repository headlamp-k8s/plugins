import type Deployment from '@kinvolk/headlamp-plugin/lib/K8s/deployment';
import type Namespace from '@kinvolk/headlamp-plugin/lib/K8s/namespace';
import type PersistentVolumeClaim from '@kinvolk/headlamp-plugin/lib/K8s/persistentVolumeClaim';
import type StatefulSet from '@kinvolk/headlamp-plugin/lib/K8s/statefulSet';
import type { WorkloadTarget } from '../coverage';
import { useVeleroData } from '../hooks/useVeleroData';
import { useVeleroInstalled } from '../hooks/useVeleroInstalled';
import { BackupCoveragePanelPure } from './BackupCoveragePanelPure';

export { BackupCoveragePanelPure } from './BackupCoveragePanelPure';
export type { BackupCoveragePanelPureProps } from './BackupCoveragePanelPure';

function VeleroInstalledGate(props: { children: React.ReactElement }) {
  const { installed, loading: installLoading } = useVeleroInstalled();

  if (installed !== true) {
    return <BackupCoveragePanelPure installed={installed} loading={installLoading} coverage={[]} />;
  }

  return props.children;
}

function workloadTarget(
  namespace: string,
  labels: Record<string, string> | undefined,
  resourceKind: WorkloadTarget['resourceKind']
): WorkloadTarget {
  return {
    namespace,
    labels: labels ?? {},
    resourceKind,
  };
}

function WorkloadBackupCoveragePanel(props: { target: WorkloadTarget }) {
  const { loading, error, getCoverageForWorkload } = useVeleroData();
  const coverage = getCoverageForWorkload(props.target);

  return (
    <BackupCoveragePanelPure
      installed
      loading={loading}
      error={error}
      coverage={coverage}
      emptyMessage="No Velero schedule covers this workload."
    />
  );
}

function NamespaceBackupCoveragePanel(props: { namespace: string }) {
  const { loading, error, getSchedulesForNamespace } = useVeleroData();
  const coverage = getSchedulesForNamespace(props.namespace);

  return (
    <BackupCoveragePanelPure
      installed
      loading={loading}
      error={error}
      coverage={coverage}
      emptyMessage="No Velero schedule covers this namespace."
      sectionTitle="Velero backup schedules"
    />
  );
}

export function DeploymentBackupCoveragePanel(props: { resource: Deployment }) {
  const target = workloadTarget(
    props.resource.metadata.namespace,
    props.resource.metadata.labels,
    'deployments'
  );

  return (
    <VeleroInstalledGate>
      <WorkloadBackupCoveragePanel target={target} />
    </VeleroInstalledGate>
  );
}

export function StatefulSetBackupCoveragePanel(props: { resource: StatefulSet }) {
  const target = workloadTarget(
    props.resource.metadata.namespace,
    props.resource.metadata.labels,
    'statefulsets'
  );

  return (
    <VeleroInstalledGate>
      <WorkloadBackupCoveragePanel target={target} />
    </VeleroInstalledGate>
  );
}

export function PersistentVolumeClaimBackupCoveragePanel(props: {
  resource: PersistentVolumeClaim;
}) {
  const target = workloadTarget(
    props.resource.metadata.namespace,
    props.resource.metadata.labels,
    'persistentvolumeclaims'
  );

  return (
    <VeleroInstalledGate>
      <WorkloadBackupCoveragePanel target={target} />
    </VeleroInstalledGate>
  );
}

export function NamespaceVeleroBackupCoveragePanel(props: { resource: Namespace }) {
  return (
    <VeleroInstalledGate>
      <NamespaceBackupCoveragePanel namespace={props.resource.metadata.name} />
    </VeleroInstalledGate>
  );
}
