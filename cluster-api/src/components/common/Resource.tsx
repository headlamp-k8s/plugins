import { Icon } from '@iconify/react';
import {
  EmptyContent,
  Loader,
  MetadataDictGrid,
  NameValueTable,
  type NameValueTableRow,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Box, Typography } from '@mui/material';
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
/**
 * Filters a list of machines to find those owned by or associated with a specific resource.
 *
 * @param machines - The list of all machines.
 * @param resource - The owner resource (e.g., Cluster, MachineDeployment, Namespace).
 * @returns An array of machines belonging to the resource.
 */
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

/**
 * Data-fetching component for a list of owned machines.
 *
 * @param props - Component properties including resource and machine class.
 */
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

/**
 * Renders a list of machines owned by the given resource (e.g. for a MachineSet or Cluster).
 *
 * @param props - Component properties.
 */
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

/**
 * Normalizes template and spec fields across different resource types (KCP, MachineSet, etc.).
 *
 * @param item - The resource holding the template.
 * @returns A ResolvedTemplate object with metadata, spec, and infrastructure references.
 */
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

/**
 * Renders a NameValueTable showing the machine template configuration for a resource.
 *
 * @param props - Component properties.
 * @param props.item - The resource containing the machine template.
 * @returns A table of template properties.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machinetemplate
 */
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

/**
 * Renders a detail section for KubeadmConfig configuration.
 *
 * @param props - Component properties.
 * @param props.kubeadmConfigSpec - The spec object from a KubeadmConfig.
 * @param props.title - Optional section title.
 * @returns A styled section box with kubeadm config details.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#kubeadmconfig
 */
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
                <Typography
                  component="pre"
                  sx={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                  }}
                >
                  {row.content}
                </Typography>
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
/**
 * Props for the HealthCheckDisplay component.
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/cluster-class/write-clusterclass
 */
export interface HealthCheckDisplayProps {
  /**
   * v1beta2 health check configuration (for ClusterClass).
   * Should have a .checks property with nodeStartupTimeoutSeconds, unhealthyNodeConditions, etc.
   */
  healthCheck?: any;
  /**
   * v1beta1 or v1beta2 health check configuration (for MachineHealthCheck).
   * For v1beta2: should have a .checks property.
   * For v1beta1: should have unhealthyConditions, nodeStartupTimeout, etc.
   */
  machineHealthCheck?: any;
  /**
   * Whether to render in a compact layout (for nested views).
   */
  compact?: boolean;
  /**
   * Whether to skip showing summary rows (Node Startup Timeout, Remediation Trigger).
   * When true, only condition tables are shown. Default: false.
   */
  skipSummary?: boolean;
}

/**
 * Normalise a v1beta2 "checks" block (which may live at different paths
 * depending on whether the caller is ClusterClass healthCheck or a
 * MachineHealthCheck with a .checks sub-object) into a common shape.
 */
interface V1Beta2Checks {
  nodeStartupTimeoutSeconds?: number;
  unhealthyNodeConditions: { type: string; status: string; timeoutSeconds?: number }[];
  unhealthyMachineConditions: { type: string; status: string; timeoutSeconds?: number }[];
}

interface V1Beta2Remediation {
  triggerIf?: {
    unhealthyLessThanOrEqualTo?: string | number;
    unhealthyInRange?: string;
  };
}

/**
 * Extract a normalised v1beta2 checks block from either:
 *   - a top-level healthCheck object  (ClusterClass v1beta2)
 *   - a machineHealthCheck.checks sub-object  (MachineHealthCheck v1beta2)
 *
 * Returns null when neither is present.
 */
function extractV1Beta2(
  healthCheck: any,
  machineHealthCheck: any
): { checks: V1Beta2Checks; remediation?: V1Beta2Remediation } | null {
  // ClusterClass v1beta2 — top-level healthCheck carries a .checks property
  if (healthCheck?.checks) {
    return {
      checks: {
        nodeStartupTimeoutSeconds: healthCheck.checks.nodeStartupTimeoutSeconds,
        unhealthyNodeConditions: healthCheck.checks.unhealthyNodeConditions ?? [],
        unhealthyMachineConditions: healthCheck.checks.unhealthyMachineConditions ?? [],
      },
      remediation: healthCheck.remediation,
    };
  }

  // MachineHealthCheck v1beta2 — the object itself carries a .checks property
  if (machineHealthCheck?.checks) {
    return {
      checks: {
        nodeStartupTimeoutSeconds: machineHealthCheck.checks.nodeStartupTimeoutSeconds,
        unhealthyNodeConditions: machineHealthCheck.checks.unhealthyNodeConditions ?? [],
        unhealthyMachineConditions: machineHealthCheck.checks.unhealthyMachineConditions ?? [],
      },
      remediation: machineHealthCheck.remediation,
    };
  }

  return null;
}

/**
 * Renders the shared v1beta2 body (summary rows + condition tables).
 */
function V1Beta2Body({
  checks,
  remediation,
  containerStyle,
  skipSummary = false,
}: {
  checks: V1Beta2Checks;
  remediation?: V1Beta2Remediation;
  containerStyle: React.CSSProperties;
  skipSummary?: boolean;
}) {
  const trigger = remediation?.triggerIf;

  const summaryRows: NameValueTableRow[] = [];
  if (!skipSummary) {
    if (checks.nodeStartupTimeoutSeconds !== undefined) {
      summaryRows.push({
        name: 'Node Startup Timeout',
        value: `${checks.nodeStartupTimeoutSeconds}s`,
      });
    }
    if (trigger?.unhealthyLessThanOrEqualTo !== undefined) {
      summaryRows.push({
        name: 'Remediation Trigger',
        value: `≤ ${trigger.unhealthyLessThanOrEqualTo} unhealthy`,
      });
    } else if (trigger?.unhealthyInRange) {
      summaryRows.push({
        name: 'Remediation Trigger',
        value: `range ${trigger.unhealthyInRange}`,
      });
    }
  }

  const conditionSections = [
    { label: 'Node Conditions', data: checks.unhealthyNodeConditions },
    { label: 'Machine Conditions', data: checks.unhealthyMachineConditions },
  ];

  return (
    <Box style={containerStyle}>
      {summaryRows.length > 0 && <NameValueTable rows={summaryRows} />}
      {conditionSections.map(
        section =>
          section.data.length > 0 && (
            <SimpleTable
              key={section.label}
              columns={[
                {
                  label: section.label,
                  getter: (row: { type: string }) => row.type,
                },
                {
                  label: 'Status',
                  getter: (row: { status: string }) => row.status,
                },
                {
                  label: 'Timeout',
                  getter: (row: { timeoutSeconds?: number }) =>
                    row.timeoutSeconds !== undefined ? `${row.timeoutSeconds}s` : '—',
                },
              ]}
              data={section.data}
            />
          )
      )}
    </Box>
  );
}

/**
 * Renders health check configuration and status for both v1beta1 and v1beta2.
 * Supports:
 *   - ClusterClass healthCheck (v1beta2)          → pass `healthCheck`
 *   - MachineHealthCheck v1beta2 with .checks     → pass `machineHealthCheck`
 *   - MachineHealthCheck v1beta1 (legacy)         → pass `machineHealthCheck`
 *
 * @param props - Component properties.
 * @returns The health check display or null if no config is present.
 */
export function HealthCheckDisplay({
  healthCheck,
  machineHealthCheck,
  compact,
  skipSummary = false,
}: HealthCheckDisplayProps) {
  if (!healthCheck && !machineHealthCheck) return null;

  const containerStyle: React.CSSProperties = compact
    ? {
        marginTop: '8px',
        padding: '10px 12px',
        background: 'rgba(16,185,129,0.06)',
        border: '1px solid rgba(16,185,129,0.18)',
        borderRadius: '6px',
      }
    : {};

  // ── v1beta2 path (ClusterClass healthCheck OR MachineHealthCheck with .checks) ──
  const v1beta2 = extractV1Beta2(healthCheck, machineHealthCheck);
  if (v1beta2) {
    return (
      <V1Beta2Body
        checks={v1beta2.checks}
        remediation={v1beta2.remediation}
        containerStyle={containerStyle}
        skipSummary={skipSummary}
      />
    );
  }

  // ── v1beta1 path (legacy MachineHealthCheck without .checks) ──
  const mhc = machineHealthCheck;
  if (!mhc) return null;

  const mhcRows: NameValueTableRow[] = [];
  if (!skipSummary) {
    if (mhc.nodeStartupTimeout)
      mhcRows.push({ name: 'Node Startup Timeout', value: mhc.nodeStartupTimeout });
    if (mhc.maxUnhealthy !== null) mhcRows.push({ name: 'Max Unhealthy', value: mhc.maxUnhealthy });
    if (mhc.unhealthyRange) mhcRows.push({ name: 'Unhealthy Range', value: mhc.unhealthyRange });
  }

  return (
    <Box style={containerStyle}>
      {mhcRows.length > 0 && <NameValueTable rows={mhcRows} />}
      {(mhc.unhealthyConditions?.length ?? 0) > 0 && (
        <SimpleTable
          columns={[
            { label: 'Condition', getter: (row: { type: string }) => row.type },
            { label: 'Status', getter: (row: { status: string }) => row.status },
            { label: 'Timeout', getter: (row: { timeout?: string }) => row.timeout ?? '—' },
          ]}
          data={mhc.unhealthyConditions!}
        />
      )}
    </Box>
  );
}

/**
 * Renders a badge indicating if a health check is configured.
 *
 * @param props - Component properties.
 * @param props.present - Whether the health check is present/configured.
 * @returns The badge component or "Not Configured" text.
 */

export function HealthCheckBadge({ present }: { present: boolean }) {
  const isEnabled = present;

  const config = isEnabled
    ? {
        label: 'Enabled',
        icon: 'mdi:check-circle-outline',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.25)',
      }
    : {
        label: 'Not Configured',
        icon: 'mdi:alert-outline',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        border: '1px solid rgba(245,158,11,0.3)',
      };

  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: '2px',
        borderRadius: 1,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: config.bg,
        color: config.color,
        border: config.border,
      }}
    >
      <Icon icon={config.icon} width="14px" height="14px" />
      {config.label}
    </Typography>
  );
}

/**
 * Props for the HealthCheckSection component.
 */
export interface HealthCheckSectionProps {
  /**
   * v1beta2 health check configuration (for ClusterClass).
   * Expected shape: { checks: { ... }, remediation?: { ... } }
   */
  healthCheck?: any;
  /**
   * v1beta1 or v1beta2 health check configuration (for MachineHealthCheck or ClusterClass).
   * v1beta2 shape: { checks: { ... }, remediation?: { ... } }
   * v1beta1 shape: { unhealthyConditions: [...], nodeStartupTimeout?, maxUnhealthy? }
   */
  machineHealthCheck?: any;
  /**
   * Title for the section box.
   */
  title?: string;
}

/**
 * Returns true when a v1beta2 checks block contains at least one meaningful field.
 */
function hasV1Beta2Data(checksBlock: any): boolean {
  if (!checksBlock) return false;
  return (
    checksBlock.nodeStartupTimeoutSeconds !== undefined ||
    (checksBlock.unhealthyNodeConditions?.length ?? 0) > 0 ||
    (checksBlock.unhealthyMachineConditions?.length ?? 0) > 0
  );
}

/**
 * Renders a complete health check section with title and display.
 * Reusable across ClusterClass, MachineHealthCheck, and other resources.
 *
 * @param props - Component properties.
 * @returns A SectionBox containing health check information or null if not configured.
 */
export function HealthCheckSection({
  healthCheck,
  machineHealthCheck,
  title = 'Health Check',
}: HealthCheckSectionProps) {
  // v1beta1: legacy MachineHealthCheck fields at the top level
  const hasV1Beta1 = !!(
    machineHealthCheck &&
    !machineHealthCheck.checks && // not a v1beta2 object
    (machineHealthCheck.unhealthyConditions?.length > 0 ||
      machineHealthCheck.nodeStartupTimeout ||
      machineHealthCheck.maxUnhealthy)
  );

  // v1beta2: ClusterClass healthCheck.checks  OR  MachineHealthCheck.checks
  const hasV1Beta2 =
    hasV1Beta2Data(healthCheck?.checks) || hasV1Beta2Data(machineHealthCheck?.checks);

  const hasHealthCheck = hasV1Beta1 || hasV1Beta2;

  if (!hasHealthCheck) return null;

  return (
    <SectionBox title={title}>
      <HealthCheckDisplay
        healthCheck={healthCheck}
        machineHealthCheck={machineHealthCheck}
        compact={false}
        skipSummary
      />
    </SectionBox>
  );
}
