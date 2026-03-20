import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useMemo } from 'react';
import { Machine } from '../../resources/machine';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { MachineListRenderer, MachineListRendererProps } from '../machines/List';

export interface OwnedMachinesSectionProps {
  resource: KubeObject;
  hideColumns?: MachineListRendererProps['hideColumns'];
  showCreateButton?: boolean;
}

function OwnedMachinesSectionWithData({
  resource,
  hideColumns,
  showCreateButton,
  namespace,
  MachineClass,
}: OwnedMachinesSectionProps & { namespace: string | undefined; MachineClass: typeof Machine }) {
  const ownerKind = resource.kind;
  const ownerName = resource.metadata?.name;
  const [machines, error] = MachineClass.useList(namespace ? { namespace } : undefined);
  const ownedMachines =
    machines?.filter(m =>
      m.jsonData?.metadata?.ownerReferences?.some(
        (ref: { kind: string; name: string }) => ref.kind === ownerKind && ref.name === ownerName
      )
    ) ?? null;
  return (
    <MachineListRenderer
      MachineClass={MachineClass}
      machines={ownedMachines}
      errors={error ? [error] : null}
      hideColumns={hideColumns}
      showCreateButton={showCreateButton}
    />
  );
}

export function OwnedMachinesSection({
  resource,
  hideColumns,
  showCreateButton = false,
}: OwnedMachinesSectionProps) {
  const version = useCapiApiVersion(Machine.crdName, 'v1beta1');
  const namespace =
    resource.kind === 'Namespace' ? resource.metadata?.name : resource.metadata?.namespace;

  if (!version) {
    return <Loader title="Detecting Cluster API version" />;
  }
  const VersionedMachine = useMemo(() => Machine.withApiVersion(version), [version]);
  return (
    <OwnedMachinesSectionWithData
      MachineClass={VersionedMachine}
      resource={resource}
      hideColumns={hideColumns}
      showCreateButton={showCreateButton}
      namespace={namespace}
    />
  );
}
