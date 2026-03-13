import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Machine } from '../../resources/machine';

const OWNER_ROUTE: Record<string, string> = {
  KubeadmControlPlane: 'kubeadmcontrolplane',
  MachineSet: 'machineset',
  MachineDeployment: 'machinedeployment',
  MachinePool: 'machinepool',
};

function getOwnerLink(machine: { metadata?: { ownerReferences?: Array<{ kind?: string; name?: string }>; namespace?: string } }) {
  const owner = machine.metadata?.ownerReferences?.[0];
  if (!owner?.kind || !owner?.name) return null;
  const routeName = OWNER_ROUTE[owner.kind];
  if (!routeName) return owner.name;
  return (
    <Link
      routeName={routeName}
      params={{
        name: owner.name,
        namespace: machine.metadata?.namespace ?? '',
      }}
    >
      {owner.name}
    </Link>
  );
}

function getHealth(machine: any): string {
  const conditions = machine.status?.conditions ?? machine.status?.v1beta2?.conditions ?? [];
  const readyCond = conditions.find((c: { type?: string }) => c.type === 'Ready');
  const ready = readyCond ? (readyCond as { status?: string }).status : null;
  const infraReady = machine.status?.infrastructureReady;
  if (ready === 'True' && infraReady === true) return 'Healthy';
  if (ready === 'False' || (infraReady === false && ready !== 'True')) return 'Unhealthy';
  return 'Unknown';
}


export function MachinesList() {
  return (
    <ResourceListView
      title="Machines"
      resourceClass={Machine}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: machine => machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
          render: machine => (
            <Link
              routeName="capicluster"
              params={{
                name: machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
                namespace: machine.metadata?.namespace,
              }}
            >
              {machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name']}
            </Link>
          ),
        },
        {
          id: 'role',
          label: 'Role',
          getValue: machine => {
            const owners = machine.metadata?.ownerReferences ?? [];
            const isControlPlane = owners.some(
              (ref: { kind?: string }) => ref.kind === 'KubeadmControlPlane'
            );
            return isControlPlane ? 'Control Plane' : 'Worker';
          },
        },
        {
          id: 'health',
          label: 'Health',
          getValue: machine => getHealth(machine),
        },
        {
          id: 'providerID',
          label: 'Provider ID',
          getValue: machine => machine.spec?.providerID ?? '-',
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: machine => machine.status?.phase ?? '-',
        },
        {
          id: 'owner',
          label: 'Owner',
          getValue: machine => machine.metadata?.ownerReferences?.[0]?.name ?? '-',
          render: machine => getOwnerLink(machine) ?? '-',
        },
        {
          id: 'version',
          label: 'Version',
          getValue: machine =>
            machine.spec?.version ?? machine.status?.nodeInfo?.kubeletVersion ?? '-',
        },
        'age',
      ]}
    />
  );
}
