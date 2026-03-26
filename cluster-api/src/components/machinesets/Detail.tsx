import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Loader,
  MetadataDictGrid,
  NameValueTable,
  type NameValueTableRow,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachineSet } from '../../resources/machineset';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { OwnedMachinesSection, renderReplicas, showReplicas } from '../common/index';

type MachineSetNode = { kubeObject: MachineSet };

interface RefInfo {
  kind: string;
  apiGroup: string;
  namespace: string;
  name: string;
}

function toRefInfo(ref: { kind?: string; apiGroup?: string; apiVersion?: string; namespace?: string; name?: string } | undefined): RefInfo {
  return {
    kind: ref?.kind ?? '-',
    apiGroup: ref?.apiGroup ?? ref?.apiVersion ?? '-',
    namespace: ref?.namespace ?? '-',
    name: ref?.name ?? '-',
  };
}

export function MachineSetDetail({ node }: { node?: MachineSetNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return <MachineSetDetailContent crName={crName} namespace={namespace} crdName={MachineSet.crdName} />;
}

interface MachineSetDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

interface MachineSetDetailContentPropsWithVersion extends MachineSetDetailContentProps {
  VersionedMachineSet: typeof MachineSet;
  apiVersion: string;
}

function MachineSetDetailContentWithData({
  crName,
  namespace,
  VersionedMachineSet,
}: MachineSetDetailContentPropsWithVersion) {
  const [item, itemError] = VersionedMachineSet.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading MachineSet {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading MachineSet details" />;

  const spec = item.spec;
  const status = item.status;
  const failure = item.failure;

  const deleteOrder = spec?.deletion?.order ?? spec?.deletePolicy ?? 'Random (default)';

  const templateSpec = spec?.template?.spec;
  const templateDeletion = templateSpec?.deletion;
  const nodeDrainTimeout = templateDeletion?.nodeDrainTimeoutSeconds !== undefined
    ? `${templateDeletion.nodeDrainTimeoutSeconds}s`
    : templateSpec?.nodeDrainTimeout !== undefined
    ? String(templateSpec.nodeDrainTimeout)
    : undefined;
  const nodeVolumeDetachTimeout = templateDeletion?.nodeVolumeDetachTimeoutSeconds !== undefined
    ? `${templateDeletion.nodeVolumeDetachTimeoutSeconds}s`
    : templateSpec?.nodeVolumeDetachTimeout !== undefined
    ? String(templateSpec.nodeVolumeDetachTimeout)
    : undefined;
  const nodeDeletionTimeout = templateDeletion?.nodeDeletionTimeoutSeconds !== undefined
    ? `${templateDeletion.nodeDeletionTimeoutSeconds}s`
    : templateSpec?.nodeDeletionTimeout !== undefined
    ? String(templateSpec.nodeDeletionTimeout)
    : undefined;

  const bootstrap = toRefInfo(templateSpec?.bootstrap?.configRef);
  const infrastructure = toRefInfo(templateSpec?.infrastructureRef);

  const templateLabels = spec?.template?.metadata?.labels ?? {};
  const templateAnnotations = spec?.template?.metadata?.annotations ?? {};

  const extraInfo: NameValueTableRow[] = [
    {
      name: 'Cluster',
      value: spec?.clusterName ?? '-',
    },
    {
      name: 'Replicas',
      value: renderReplicas(item),
      hide: !showReplicas(item),
    },
    {
      name: 'Delete Policy',
      value: deleteOrder,
    },
    {
      name: 'Min Ready Seconds',
      value: spec?.minReadySeconds ?? 0,
    },
    {
      name: 'Machine Naming Strategy',
      value: spec?.machineNamingStrategy?.template ?? '-',
      hide: !spec?.machineNamingStrategy?.template,
    },
    {
      name: 'Selector',
      value: spec?.selector?.matchLabels ? (
        <MetadataDictGrid dict={spec.selector.matchLabels as Record<string, string>} />
      ) : '-',
    },
    {
      name: 'Observed Generation',
      value: status?.observedGeneration !== undefined
        ? `${status.observedGeneration} / ${item.metadata?.generation ?? '-'}`
        : '-',
      hide: status?.observedGeneration === undefined,
    },
    // Failure fields — resolved across v1beta1 (root) and v1beta2 (deprecated.v1beta1)
    ...(failure?.failureReason ? [{
      name: 'Failure Reason',
      value: <StatusLabel status="error">{failure.failureReason}</StatusLabel>,
    }] : []),
    ...(failure?.failureMessage ? [{
      name: 'Failure Message',
      value: <span style={{ color: 'var(--error-color)' }}>{failure.failureMessage}</span>,
    }] : []),
  ];

  const templateRows: NameValueTableRow[] = [
    {
      name: 'Labels',
      value: Object.keys(templateLabels).length > 0
        ? <MetadataDictGrid dict={templateLabels as Record<string, string>} />
        : '-',
    },
    {
      name: 'Annotations',
      value: Object.keys(templateAnnotations).length > 0
        ? <MetadataDictGrid dict={templateAnnotations as Record<string, string>} />
        : '-',
      hide: Object.keys(templateAnnotations).length === 0,
    },
    {
      name: 'Version',
      value: templateSpec?.version ?? '-',
    },
    {
      name: 'Cluster Name',
      value: spec?.clusterName ?? '-',
    },
    {
      name: 'Node Drain Timeout',
      value: nodeDrainTimeout ?? '-',
      hide: nodeDrainTimeout === undefined,
    },
    {
      name: 'Node Volume Detach Timeout',
      value: nodeVolumeDetachTimeout ?? '-',
      hide: nodeVolumeDetachTimeout === undefined,
    },
    {
      name: 'Node Deletion Timeout',
      value: nodeDeletionTimeout ?? '-',
      hide: nodeDeletionTimeout === undefined,
    },
    {
      name: 'Bootstrap Ref',
      value: (
        <NameValueTable
          rows={[
            { name: 'Kind', value: bootstrap.kind },
            { name: 'Name', value: bootstrap.name },
            { name: 'API Group', value: bootstrap.apiGroup },
            { name: 'Namespace', value: bootstrap.namespace, hide: bootstrap.namespace === '-' },
          ]}
        />
      ),
    },
    {
      name: 'Infrastructure Ref',
      value: (
        <NameValueTable
          rows={[
            { name: 'Kind', value: infrastructure.kind },
            { name: 'Name', value: infrastructure.name },
            { name: 'API Group', value: infrastructure.apiGroup },
            { name: 'Namespace', value: infrastructure.namespace, hide: infrastructure.namespace === '-' },
          ]}
        />
      ),
    },
  ];

  return (
    <DetailsGrid
      resourceType={VersionedMachineSet}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      extraInfo={() => extraInfo}
      extraSections={() => [
        {
          id: 'cluster-api.machine-set-machines',
          section: (
            <OwnedMachinesSection resource={item} hideColumns={['owner']} showCreateButton />
          ),
        },
        {
          id: 'cluster-api.machine-set-template',
          section: (
            <SectionBox title="Machine Template">
              <NameValueTable rows={templateRows} />
            </SectionBox>
          ),
        },
        {
          id: 'cluster-api.machine-set-conditions',
          section: (
            <ConditionsSection
              resource={{
                ...item.jsonData,
                status: {
                  ...item.jsonData.status,
                  conditions: item.conditions,
                },
              }}
            />
          ),
        },
      ]}
    />
  );
}

function MachineSetDetailContent(props: MachineSetDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachineSet = useMemo(
    () => (apiVersion ? MachineSet.withApiVersion(apiVersion) : MachineSet),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;
  return (
    <MachineSetDetailContentWithData
      {...props}
      VersionedMachineSet={VersionedMachineSet}
      apiVersion={apiVersion}
    />
  );
}