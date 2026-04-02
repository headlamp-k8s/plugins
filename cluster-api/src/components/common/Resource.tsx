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
import { formatDeletionTimeout, KubeReference, ObjectMeta } from '../../resources/common';
import { KubeadmConfigSpec } from '../../resources/kubeadmconfig';
import {
  KCPMachineTemplateV1Beta1,
  KCPMachineTemplateV1Beta2,
  KubeadmControlPlane,
} from '../../resources/kubeadmcontrolplane';
import { Machine, MachineSpec } from '../../resources/machine';
import { MachineDeployment } from '../../resources/machinedeployment';
import { MachinePool } from '../../resources/machinepool';
import { MachineSet } from '../../resources/machineset';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { MachineListRenderer, MachineListRendererProps } from '../machines/List';
import { type NameValueInput, renderReference, rowsToDict, toNameValueRows } from './util';

export interface OwnedMachinesSectionProps {
  resource: KubeObject;
  hideColumns?: MachineListRendererProps['hideColumns'];
  showCreateButton?: boolean;
}
function getOwnedMachines(machines: InstanceType<typeof Machine>[], resource: KubeObject) {
  const name = resource.metadata?.name;
  if (!name) return [];
  const labelKeys = {
    Cluster: 'cluster.x-k8s.io/cluster-name',
    MachineDeployment: 'cluster.x-k8s.io/deployment-name',
    MachineSet: 'cluster.x-k8s.io/set-name',
    MachinePool: 'cluster.x-k8s.io/pool-name',
  };
  const labelKey = labelKeys[resource.kind as keyof typeof labelKeys];
  if (labelKey) {
    return machines.filter(m => m.metadata?.labels?.[labelKey] === name);
  }
  if (resource.kind === 'Namespace') {
    return machines;
  }
  return machines.filter(m =>
    m.jsonData?.metadata?.ownerReferences?.some(
      (ref: NonNullable<ObjectMeta['ownerReferences']>[number]) =>
        ref.kind === resource.kind && ref.name === name
    )
  );
}

function OwnedMachinesSectionWithData({
  resource,
  hideColumns,
  showCreateButton,
  namespace,
  MachineClass,
}: OwnedMachinesSectionProps & {
  namespace: string | undefined;
  MachineClass: typeof Machine;
}) {
  const [machines, error] = MachineClass.useList(namespace ? { namespace } : undefined);

  const ownedMachines = useMemo(() => {
    if (!machines) return null;
    return getOwnedMachines(machines, resource);
  }, [machines, resource]);

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
  const machineVersion = useCapiApiVersion(Machine.crdName, 'v1beta1');

  const namespace =
    resource.kind === 'Namespace' ? resource.metadata?.name : resource.metadata?.namespace;

  const VersionedMachine = useMemo(
    () => (machineVersion ? Machine.withApiVersion(machineVersion) : Machine),
    [machineVersion]
  );

  if (!machineVersion) {
    return <Loader title="Detecting Cluster API version" />;
  }

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

type TemplateSectionResource =
  | MachineDeployment
  | MachineSet
  | KubeadmControlPlane
  | MachinePool
  | Machine;

interface ResolvedTemplate {
  templateMetadata: ObjectMeta | undefined;
  machineSpec: MachineSpec | undefined;
  directInfraRef: KubeReference | undefined; // v1beta1 only
}

function resolveTemplateSpec(item: TemplateSectionResource): ResolvedTemplate {
  if (item instanceof Machine) {
    return { templateMetadata: undefined, machineSpec: item.spec, directInfraRef: undefined };
  }

  if (item instanceof KubeadmControlPlane) {
    const mt = item.spec?.machineTemplate;
    if (!mt)
      return { templateMetadata: undefined, machineSpec: undefined, directInfraRef: undefined };

    const mtV2 = mt as KCPMachineTemplateV1Beta2; // v1beta2 only
    if (mtV2.spec) {
      return { templateMetadata: mtV2.metadata, machineSpec: mtV2.spec, directInfraRef: undefined };
    }

    const mtV1 = mt as KCPMachineTemplateV1Beta1; // v1beta1 only
    return {
      templateMetadata: mtV1.metadata,
      machineSpec: undefined,
      directInfraRef: mtV1.infrastructureRef,
    };
  }

  // MachineSet, MachineDeployment, MachinePool — spec.template: MachineTemplateSpec
  const t = (item as MachineSet | MachineDeployment | MachinePool).spec?.template;
  return { templateMetadata: t?.metadata, machineSpec: t?.spec, directInfraRef: undefined };
}

export function TemplateSection({ item }: { item: TemplateSectionResource }) {
  const { templateMetadata, machineSpec, directInfraRef } = resolveTemplateSpec(item);

  const labels = templateMetadata?.labels ?? {};
  const annotations = templateMetadata?.annotations ?? {};

  // KCP: version/rollout are at spec root, not inside machineTemplate
  const kcpSpec = item instanceof KubeadmControlPlane ? item.spec : undefined;
  const version = kcpSpec?.version ?? machineSpec?.version;

  // v1beta1 uses rolloutStrategy, v1beta2 uses rollout.strategy, older v1beta1 uses strategy
  const strategyObj = kcpSpec?.rolloutStrategy ?? kcpSpec?.rollout?.strategy ?? kcpSpec?.strategy;
  const rolloutStrategy = strategyObj?.type;
  const maxSurge = strategyObj?.rollingUpdate?.maxSurge;

  const nodeDrainTimeout = formatDeletionTimeout(
    machineSpec?.deletion?.nodeDrainTimeoutSeconds,
    machineSpec?.nodeDrainTimeout
  );
  const nodeVolumeDetachTimeout = formatDeletionTimeout(
    machineSpec?.deletion?.nodeVolumeDetachTimeoutSeconds,
    machineSpec?.nodeVolumeDetachTimeout
  );
  const nodeDeletionTimeout = formatDeletionTimeout(
    machineSpec?.deletion?.nodeDeletionTimeoutSeconds,
    machineSpec?.nodeDeletionTimeout
  );

  const infraRef = directInfraRef ?? (machineSpec?.infrastructureRef as KubeReference | undefined);
  const bootstrapRef = machineSpec?.bootstrap?.configRef as KubeReference | undefined;

  const rows: NameValueTableRow[] = [
    {
      name: 'Cluster',
      value: machineSpec?.clusterName ?? '-',
      hide: !machineSpec?.clusterName,
    },
    {
      name: 'Version',
      value: version ?? '-',
      hide: !version,
    },
    {
      name: 'Rollout Strategy',
      value: rolloutStrategy
        ? maxSurge !== undefined
          ? `${rolloutStrategy} (maxSurge: ${maxSurge})`
          : rolloutStrategy
        : '-',
      hide: !rolloutStrategy,
    },
    {
      name: 'Provider ID',
      value: machineSpec?.providerID ?? '-',
      hide: !machineSpec?.providerID,
    },
    {
      name: 'Failure Domain',
      value: machineSpec?.failureDomain ?? '-',
      hide: !machineSpec?.failureDomain,
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
      value: renderReference(bootstrapRef),
      hide: !bootstrapRef,
    },
    {
      name: 'Infrastructure Ref',
      value: renderReference(infraRef),
      hide: !infraRef,
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
