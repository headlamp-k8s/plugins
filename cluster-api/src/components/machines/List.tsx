import {
  CreateResourceButton,
  Link,
  Loader,
  ResourceListView,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import { useMemo } from 'react';
import { getCondition } from '../../resources/common';
import { Machine } from '../../resources/machine';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { getPhaseStatus } from '../common/util';
import { renderConditionStatus } from '../common/util';

const OWNER_ROUTE: Record<string, string> = {
  KubeadmControlPlane: 'kubeadmcontrolplane',
  MachineSet: 'machineset',
  MachineDeployment: 'machinedeployment',
  MachinePool: 'machinepool',
};

function getOwnerLink(machine: {
  metadata?: { ownerReferences?: Array<{ kind?: string; name?: string }>; namespace?: string };
}) {
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

export interface MachineListRendererProps {
  MachineClass: typeof Machine;
  machines: Machine[] | null;
  errors?: ApiError[] | null;
  hideColumns?: ('namespace' | 'owner' | 'version')[];
  showCreateButton?: boolean;
}

export function MachineListRenderer(props: MachineListRendererProps) {
  const { MachineClass, machines, errors, hideColumns = [], showCreateButton = false } = props;
  return (
    <ResourceListView
      title="Machines"
      hideColumns={hideColumns}
      data={machines}
      headerProps={
        showCreateButton
          ? {
              titleSideActions: [
                <CreateResourceButton key="create" resourceClass={MachineClass} />,
              ],
            }
          : undefined
      }
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
          id: 'providerID',
          label: 'Provider ID',
          getValue: machine => machine.spec?.providerID ?? '-',
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: machine => machine.status?.phase ?? '-',
          render: machine => {
            const phase = machine.status?.phase;
            if (!phase) return '-';
            return <StatusLabel status={getPhaseStatus(phase)}>{phase}</StatusLabel>;
          },
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: (m: Machine) => {
            const cond = getCondition(m.conditions, 'Ready');
            if (!cond) return '0/1';
            return cond?.status;
          },
          render: (m: Machine) =>
            renderConditionStatus(undefined, getCondition(m.conditions, 'Ready'), {
              trueLabel: '1/1',
              falseLabel: '0/1',
              trueStatus: 'success',
              falseStatus: 'error',
              unknownLabel: '0/1',
              unknownStatus: 'error',
            }),
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
          getValue: machine => machine.spec?.version ?? '-',
        },
        'age',
      ]}
      errors={errors}
    />
  );
}

interface MachinesListWithDataProps {
  MachineClass: typeof Machine;
}

function MachinesListWithData({ MachineClass }: MachinesListWithDataProps) {
  const [machines, error] = MachineClass.useList();
  return (
    <MachineListRenderer
      MachineClass={MachineClass}
      machines={machines}
      errors={error ? [error] : null}
      showCreateButton
    />
  );
}

export function MachinesList() {
  const version = useCapiApiVersion(Machine.crdName, 'v1beta1');
  const VersionedMachine = useMemo(
    () => (version ? Machine.withApiVersion(version) : Machine),
    [version]
  );
  if (!version) return <Loader title="Detecting Cluster API version" />;

  return <MachinesListWithData MachineClass={VersionedMachine} />;
}
