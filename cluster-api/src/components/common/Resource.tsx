import {
  Loader,
  MetadataDictGrid,
  NameValueTable,
  type NameValueTableRow,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  EmptyContent,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useMemo } from 'react';
import { KubeReference } from '../../resources/common';
import { KubeadmConfigSpec } from '../../resources/kubeadmconfig';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { Machine } from '../../resources/machine';
import { MachineDeployment } from '../../resources/machinedeployment';
import { MachineSet } from '../../resources/machineset';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { MachineListRenderer, MachineListRendererProps } from '../machines/List';
import { type NameValueInput, renderReference, rowsToDict, toNameValueRows } from './util';

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
  MachineSetClass,
}: OwnedMachinesSectionProps & {
  namespace: string | undefined;
  MachineClass: typeof Machine;
  MachineSetClass: typeof MachineSet;
}) {
  const ownerKind = resource.kind;
  const ownerName = resource.metadata?.name;
  const [machines, error] = MachineClass.useList(namespace ? { namespace } : undefined);
  const [machineSets, setsError] = MachineSetClass.useList(namespace ? { namespace } : undefined);

  const ownedMachines = useMemo(() => {
    if (!machines) return null;

    if (resource.kind === 'Cluster') {
      const clusterName = resource.metadata?.name;
      if (!clusterName) return [];
      return machines.filter(
        m => m.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] === clusterName
      );
    }

    // Direct ownership: machines directly owned by this resource
    const directlyOwned = machines.filter(m =>
      m.jsonData?.metadata?.ownerReferences?.some(
        (ref: { kind: string; name: string }) => ref.kind === ownerKind && ref.name === ownerName
      )
    );

    // Indirect ownership through MachineSet (for MachineDeployment)
    if (ownerKind === 'MachineDeployment' && machineSets) {
      const ownedMachineSets = machineSets.filter(ms =>
        ms.jsonData?.metadata?.ownerReferences?.some(
          (ref: { kind: string; name: string }) => ref.kind === ownerKind && ref.name === ownerName
        )
      );

      // Find machines owned by those MachineSets
      const indirectlyOwned = machines.filter(m =>
        ownedMachineSets.some(ms =>
          m.jsonData?.metadata?.ownerReferences?.some(
            (ref: { kind: string; name: string }) =>
              ref.kind === 'MachineSet' && ref.name === ms.metadata?.name
          )
        )
      );

      return [...directlyOwned, ...indirectlyOwned];
    }

    return directlyOwned;
  }, [machines, machineSets, ownerKind, ownerName]);

  return (
    <MachineListRenderer
      MachineClass={MachineClass}
      machines={ownedMachines}
      errors={error || setsError ? [error, setsError].filter(Boolean) : null}
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
  const machineVersion = useCapiApiVersion(Machine.crdName, 'v1beta1');
  const machineSetVersion = useCapiApiVersion(MachineSet.crdName, 'v1beta1');
  const namespace =
    resource.kind === 'Namespace' ? resource.metadata?.name : resource.metadata?.namespace;
  const VersionedMachine = useMemo(
    () => (machineVersion ? Machine.withApiVersion(machineVersion) : Machine),
    [machineVersion]
  );
  const VersionedMachineSet = useMemo(
    () => (machineSetVersion ? MachineSet.withApiVersion(machineSetVersion) : MachineSet),
    [machineSetVersion]
  );
  if (!machineVersion || !machineSetVersion) {
    return <Loader title="Detecting Cluster API version" />;
  }
  return (
    <OwnedMachinesSectionWithData
      MachineClass={VersionedMachine}
      MachineSetClass={VersionedMachineSet}
      resource={resource}
      hideColumns={hideColumns}
      showCreateButton={showCreateButton}
      namespace={namespace}
    />
  );
}

type TemplateResource = MachineDeployment | MachineSet | KubeadmControlPlane;

export function TemplateSection({ item }: { item: TemplateResource }) {
  const spec = item.spec as Record<string, any> | undefined;
  const template = spec?.template ?? spec?.machineTemplate;
  const templateSpec = template?.spec ?? template;
  const metadata = template?.metadata;

  const labels = metadata?.labels ?? {};
  const annotations = metadata?.annotations ?? {};

  const bootstrap = templateSpec?.bootstrap?.configRef;
  const infrastructure = templateSpec?.infrastructureRef;

  const templateDeletion = templateSpec?.deletion;
  const nodeDrainTimeout =
    templateDeletion?.nodeDrainTimeoutSeconds !== undefined
      ? `${templateDeletion.nodeDrainTimeoutSeconds}s`
      : templateSpec?.nodeDrainTimeout !== undefined
      ? String(templateSpec.nodeDrainTimeout)
      : undefined;
  const nodeVolumeDetachTimeout =
    templateDeletion?.nodeVolumeDetachTimeoutSeconds !== undefined
      ? `${templateDeletion.nodeVolumeDetachTimeoutSeconds}s`
      : templateSpec?.nodeVolumeDetachTimeout !== undefined
      ? String(templateSpec.nodeVolumeDetachTimeout)
      : undefined;
  const nodeDeletionTimeout =
    templateDeletion?.nodeDeletionTimeoutSeconds !== undefined
      ? `${templateDeletion.nodeDeletionTimeoutSeconds}s`
      : templateSpec?.nodeDeletionTimeout !== undefined
      ? String(templateSpec.nodeDeletionTimeout)
      : undefined;

  const rows: NameValueTableRow[] = [
    {
      name: 'Version',
      value: templateSpec?.version ?? '-',
      hide: !templateSpec?.version,
    },
    {
      name: 'Provider ID',
      value: templateSpec?.providerID ?? '-',
      hide: !templateSpec?.providerID,
    },
    {
      name: 'Failure Domain',
      value: templateSpec?.failureDomain ?? '-',
      hide: !templateSpec?.failureDomain,
    },

    {
      name: 'Labels',
      value:
        Object.keys(labels).length > 0 ? (
          <MetadataDictGrid dict={labels as Record<string, string>} />
        ) : (
          '-'
        ),
    },

    {
      name: 'Annotations',
      value:
        Object.keys(annotations).length > 0 ? (
          <MetadataDictGrid dict={annotations as Record<string, string>} />
        ) : (
          '-'
        ),
      hide: Object.keys(annotations).length === 0,
    },

    {
      name: 'Node Drain Timeout',
      value: nodeDrainTimeout ?? '-',
      hide: !nodeDrainTimeout,
    },
    {
      name: 'Node Volume Detach Timeout',
      value: nodeVolumeDetachTimeout ?? '-',
      hide: !nodeVolumeDetachTimeout,
    },
    {
      name: 'Node Deletion Timeout',
      value: nodeDeletionTimeout ?? '-',
      hide: !nodeDeletionTimeout,
    },

    {
      name: 'Bootstrap Ref',
      value: renderReference(bootstrap as KubeReference),
      hide: !bootstrap,
    },

    {
      name: 'Infrastructure Ref',
      value: renderReference(infrastructure as KubeReference),
      hide: !infrastructure,
    },
  ];

  return <NameValueTable rows={rows} />;
}

interface KubeadmConfigSectionProps {
  kubeadmConfigSpec: KubeadmConfigSpec;
  title?: string;
}

export function KubeadmConfigSection({
  kubeadmConfigSpec,
  title = 'Kubeadm Config',
}: KubeadmConfigSectionProps) {
  const apiServer = kubeadmConfigSpec?.clusterConfiguration?.apiServer;
  const certSANs = apiServer?.certSANs ?? [];
  const certSANRows = certSANs.map(san => ({ san }));
  const extraArgRows = toNameValueRows(apiServer?.extraArgs as NameValueInput);
  const files = kubeadmConfigSpec?.files ?? [];
  const extraVolumes = apiServer?.extraVolumes ?? [];

  const initKubeletArgRows = toNameValueRows(
    kubeadmConfigSpec?.initConfiguration?.nodeRegistration?.kubeletExtraArgs as NameValueInput
  );
  const joinKubeletArgRows = toNameValueRows(
    kubeadmConfigSpec?.joinConfiguration?.nodeRegistration?.kubeletExtraArgs as NameValueInput
  );

  const extraArgsDict = rowsToDict(extraArgRows);
  const initKubeletArgsDict = rowsToDict(initKubeletArgRows);
  const joinKubeletArgsDict = rowsToDict(joinKubeletArgRows);

  const extraVolumesTable =
    extraVolumes.length > 0 ? (
      <SimpleTable
        columns={[
          { label: 'Name', getter: (row: (typeof extraVolumes)[number]) => row.name },
          { label: 'Host Path', getter: row => row.hostPath },
          { label: 'Mount Path', getter: row => row.mountPath },
          { label: 'Path Type', getter: row => row.pathType ?? '-' },
          { label: 'Read Only', getter: row => (row.readOnly ? 'Yes' : 'No') },
        ]}
        data={extraVolumes}
      />
    ) : (
      '-'
    );

  const filesTable =
    files.length > 0 ? (
      <SimpleTable
        columns={[
          { label: 'Path', getter: (row: { path: string; content?: string }) => row.path },
          {
            label: 'Content',
            getter: (row: { path: string; content?: string }) =>
              row.content ? (
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {row.content}
                </pre>
              ) : (
                '-'
              ),
          },
        ]}
        data={files}
      />
    ) : (
      '-'
    );

  const rows: NameValueTableRow[] = [
    {
      name: 'Certificate SANs',
      value: certSANRows.length ? certSANs.join(', ') : '-',
      hide: certSANRows.length === 0,
    },
    {
      name: 'Extra Args',
      value:
        Object.keys(extraArgsDict).length > 0 ? <MetadataDictGrid dict={extraArgsDict} /> : '-',
      hide: Object.keys(extraArgsDict).length === 0,
    },
    {
      name: 'Extra Volumes',
      value: extraVolumesTable,
      hide: extraVolumes.length === 0,
    },
    {
      name: 'Init Configuration Kubelet Args',
      value:
        Object.keys(initKubeletArgsDict).length > 0 ? (
          <MetadataDictGrid dict={initKubeletArgsDict} />
        ) : (
          '-'
        ),
      hide: Object.keys(initKubeletArgsDict).length === 0,
    },
    {
      name: 'Join Configuration Kubelet Args',
      value:
        Object.keys(joinKubeletArgsDict).length > 0 ? (
          <MetadataDictGrid dict={joinKubeletArgsDict} />
        ) : (
          '-'
        ),
      hide: Object.keys(joinKubeletArgsDict).length === 0,
    },
    {
      name: 'Files',
      value: filesTable,
      hide: files.length === 0,
    },
  ];

  const hasContent = rows.some(row => !row.hide);

  return (
    <SectionBox title={title}>
      {!hasContent ? (
        <EmptyContent>No kubeadm config data found.</EmptyContent>
      ) : (
        <NameValueTable rows={rows} />
      )}
    </SectionBox>
  );
}
