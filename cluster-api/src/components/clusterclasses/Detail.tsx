import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  NameValueTable,
  type NameValueTableRow,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { Cluster } from '../../resources/cluster';
import {
  ClusterClass,
  type ControlPlaneClass,
  getControlPlaneHealthChecks,
  getWorkerBootstrap,
  getWorkerHealthChecks,
  getWorkerInfrastructure,
  type HealthCheckClassV1Beta2,
  type LocalObjectTemplate,
  type MachineDeploymentClass,
  type MachineHealthCheckClassV1Beta1,
  type MachinePoolClass,
  type WorkerClass,
} from '../../resources/clusterclass';
import { useCapiApiVersion } from '../../utils/capiVersion';
import {
  getExtraColumnsFromCrd,
  getExtraInfoFromPrinterColumns,
} from '../../utils/crdPrinterColumns';
import { getPhaseStatus, renderReference } from '../common/util';

// ─── Styling ─────────────────────────────────────────────────────────────────

const workerTypeBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
};

const deploymentBadge = (
  <span
    style={{
      ...workerTypeBadgeStyle,
      background: 'rgba(59,130,246,0.12)',
      color: '#3b82f6',
      border: '1px solid rgba(59,130,246,0.25)',
    }}
  >
    MachineDeployment
  </span>
);

const poolBadge = (
  <span
    style={{
      ...workerTypeBadgeStyle,
      background: 'rgba(168,85,247,0.12)',
      color: '#a855f7',
      border: '1px solid rgba(168,85,247,0.25)',
    }}
  >
    MachinePool
  </span>
);

// ─── Helper Functions ────────────────────────────────────────────────────────

const templateRow = (name: string, ref?: LocalObjectTemplate): NameValueTableRow => ({
  name,
  value: renderReference(ref),
  hide: !ref,
});

// ─── Health Check Components ─────────────────────────────────────────────────

interface HealthCheckDisplayProps {
  healthCheck?: HealthCheckClassV1Beta2;
  machineHealthCheck?: MachineHealthCheckClassV1Beta1;
  compact?: boolean;
}

function HealthCheckDisplay({ healthCheck, machineHealthCheck, compact }: HealthCheckDisplayProps) {
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

  if (healthCheck) {
    const checks = healthCheck.checks;
    const trigger = healthCheck.remediation?.triggerIf;
    const nodeConditions = checks?.unhealthyNodeConditions ?? [];
    const machineConditions = checks?.unhealthyMachineConditions ?? [];

    const summaryRows: NameValueTableRow[] = [];
    if (checks?.nodeStartupTimeoutSeconds !== undefined) {
      summaryRows.push({
        name: 'Node Startup Timeout',
        value: `${checks.nodeStartupTimeoutSeconds}s`,
      });
    }
    if (trigger?.unhealthyLessThanOrEqualTo) {
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

    return (
      <div style={containerStyle}>
        {summaryRows.length > 0 && <NameValueTable rows={summaryRows} />}
        {[
          { label: 'Node Conditions', data: nodeConditions },
          { label: 'Machine Conditions', data: machineConditions },
        ].map(
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
      </div>
    );
  }

  const mhc = machineHealthCheck!;
  const mhcRows: NameValueTableRow[] = [];
  if (mhc.nodeStartupTimeout)
    mhcRows.push({ name: 'Node Startup Timeout', value: mhc.nodeStartupTimeout });
  if (mhc.maxUnhealthy) mhcRows.push({ name: 'Max Unhealthy', value: mhc.maxUnhealthy });
  if (mhc.unhealthyRange) mhcRows.push({ name: 'Unhealthy Range', value: mhc.unhealthyRange });

  return (
    <div style={containerStyle}>
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
    </div>
  );
}

function HealthCheckBadge({ present }: { present: boolean }) {
  if (!present) return <span style={{ color: 'var(--text-secondary, #888)' }}>Not Configured</span>;
  return (
    <span
      style={{
        ...workerTypeBadgeStyle,
        background: 'rgba(16,185,129,0.12)',
        color: '#10b981',
        border: '1px solid rgba(16,185,129,0.25)',
      }}
    >
      Enabled
    </span>
  );
}

// ─── Section Components ──────────────────────────────────────────────────────

interface UsedClustersSectionProps {
  clusterClassName: string;
  namespace?: string;
}

function UsedClustersSection({ clusterClassName, namespace }: UsedClustersSectionProps) {
  const [clusters, error] = Cluster.useList({ namespace });

  const usedBy = useMemo(() => {
    if (!clusters) return [];
    return clusters.filter(c => {
      const topology = c.spec?.topology;
      if (!topology) return false;
      return topology.class === clusterClassName || topology.classRef?.name === clusterClassName;
    });
  }, [clusters, clusterClassName]);

  if (error) return null;
  if (!clusters) return <Loader title="Checking for clusters..." />;
  if (usedBy.length === 0) return null;

  return (
    <SectionBox title="Clusters">
      <SimpleTable
        data={usedBy}
        columns={[
          {
            label: 'Name',
            getter: (c: Cluster) => <Link kubeObject={c}>{c.metadata.name}</Link>,
          },
          {
            label: 'Namespace',
            getter: (c: Cluster) => c.metadata.namespace,
          },
          {
            label: 'Phase',
            getter: (c: Cluster) => (
              <StatusLabel status={getPhaseStatus(c.status?.phase)}>
                {c.status?.phase || 'Unknown'}
              </StatusLabel>
            ),
          },
        ]}
      />
    </SectionBox>
  );
}

interface WorkerSectionProps {
  machineDeployments: MachineDeploymentClass[];
  machinePools: MachinePoolClass[];
}

function WorkerTopologySection({ machineDeployments, machinePools }: WorkerSectionProps) {
  if (machineDeployments.length === 0 && machinePools.length === 0) return null;

  const dividerStyle: React.CSSProperties = {
    borderTop: '1px solid var(--border-color, rgba(0,0,0,0.1))',
    margin: '12px 0',
  };

  const classHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontWeight: 600,
    fontSize: '13px',
  };

  function renderWorker(row: WorkerClass, badge: React.ReactNode, index: number) {
    const bootstrap = getWorkerBootstrap(row);
    const infrastructure = getWorkerInfrastructure(row);
    const { healthCheck: healthCheckV2, machineHealthCheck: healthCheckV1 } =
      getWorkerHealthChecks(row);
    const hasHealthCheck = !!(healthCheckV2 || healthCheckV1);

    const infoRows: NameValueTableRow[] = [
      templateRow('Bootstrap Template', bootstrap),
      templateRow('Infrastructure Template', infrastructure),
      { name: 'Health Check', value: <HealthCheckBadge present={hasHealthCheck} /> },
    ];

    return (
      <div key={`${row.class}-${index}`}>
        {index > 0 && <div style={dividerStyle} />}
        <div style={classHeaderStyle}>
          {badge}
          <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{row.class}</span>
        </div>
        <NameValueTable rows={infoRows} />
        {hasHealthCheck && (
          <HealthCheckDisplay
            healthCheck={healthCheckV2}
            machineHealthCheck={healthCheckV1}
            compact
          />
        )}
      </div>
    );
  }

  return (
    <SectionBox title="Worker Topology">
      {machineDeployments.map((row, i) => renderWorker(row, deploymentBadge, i))}
      {machinePools.map((row, i) => renderWorker(row, poolBadge, machineDeployments.length + i))}
    </SectionBox>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ClusterClassDetail({ node }: { node?: { kubeObject: ClusterClass } }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();

  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <ClusterClassDetailContent
      crName={crName}
      namespace={namespace}
      crdName={ClusterClass.crdName}
    />
  );
}

interface ClusterClassDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

interface ClusterClassDetailContentWithVersionProps extends ClusterClassDetailContentProps {
  VersionedClusterClass: typeof ClusterClass;
  apiVersion: string;
}

function ClusterClassDetailContent({ crName, namespace, crdName }: ClusterClassDetailContentProps) {
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedClusterClass = useMemo(
    () => (apiVersion ? ClusterClass.withApiVersion(apiVersion) : ClusterClass),
    [apiVersion]
  );

  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;

  return (
    <ClusterClassDetailWithData
      crName={crName}
      namespace={namespace}
      VersionedClusterClass={VersionedClusterClass}
      apiVersion={apiVersion}
      crdName={crdName}
    />
  );
}

function ClusterClassDetailWithData({
  crName,
  namespace,
  VersionedClusterClass,
  apiVersion,
  crdName,
}: ClusterClassDetailContentWithVersionProps) {
  const [crd, crdError] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedClusterClass.useGet(crName, namespace);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading ClusterClass {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading ClusterClass details" />;

  const spec = item.spec;
  const patches = spec?.patches ?? [];
  const specVariables = spec?.variables ?? [];
  const statusVariables = item.status?.variables ?? [];
  const workerMachineDeployments = spec?.workers?.machineDeployments ?? [];
  const workerMachinePools = spec?.workers?.machinePools ?? [];
  const infrastructureRef = item.infrastructureRef;
  const controlPlaneRef = item.controlPlaneRef;
  const controlPlaneMachineInfraRef = item.controlPlaneMachineInfraRef;
  const availabilityGates = spec?.availabilityGates ?? [];

  // Properly typed control plane access
  const controlPlane = spec?.controlPlane as ControlPlaneClass | undefined;
  const { healthCheck: cpHealthCheck, machineHealthCheck: cpMachineHealthCheck } =
    getControlPlaneHealthChecks(controlPlane);
  const hasControlPlaneHealthCheck = !!(cpHealthCheck || cpMachineHealthCheck);

  const extraInfo = () => {
    const info: NameValueTableRow[] = [
      {
        name: 'Variables',
        value: specVariables.length > 0 ? `${specVariables.length} defined` : '—',
      },
      {
        name: 'Patches',
        value: patches.length > 0 ? `${patches.length} defined` : '—',
      },
      {
        name: 'Machine Deployments',
        value:
          workerMachineDeployments.length > 0
            ? `${workerMachineDeployments.length} class${
                workerMachineDeployments.length > 1 ? 'es' : ''
              }`
            : '—',
      },
      {
        name: 'Machine Pools',
        value:
          workerMachinePools.length > 0
            ? `${workerMachinePools.length} class${workerMachinePools.length > 1 ? 'es' : ''}`
            : '—',
        hide: workerMachinePools.length === 0,
      },
    ];

    if (crd) {
      info.unshift({
        name: 'Definition',
        value: (
          <Link routeName="crd" params={{ name: crdName }}>
            {crdName}
          </Link>
        ),
      });
      info.push(
        ...getExtraInfoFromPrinterColumns(getExtraColumnsFromCrd(crd, apiVersion), item.jsonData)
      );
    } else if (crdError) {
      info.push({
        name: 'Additional info',
        value: 'Some extra details could not be loaded.',
      });
    }

    return info;
  };

  return (
    <DetailsGrid
      resourceType={VersionedClusterClass}
      withEvents
      name={crName}
      namespace={namespace}
      extraInfo={extraInfo}
      extraSections={() => {
        const sections = [
          {
            id: 'cluster-api.cluster-class-used-by',
            section: <UsedClustersSection clusterClassName={crName} namespace={namespace} />,
          },

          {
            id: 'cluster-api.cluster-class-conditions',
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

          {
            id: 'cluster-api.cluster-class-overview',
            section: (
              <SectionBox title="Overview">
                <NameValueTable
                  rows={[
                    templateRow('Infrastructure Template', infrastructureRef),
                    templateRow('Control Plane Template', controlPlaneRef),
                    templateRow('Control Plane Machine Infra', controlPlaneMachineInfraRef),
                    {
                      name: 'Availability Gates',
                      value: availabilityGates.length
                        ? availabilityGates.map(g => g.conditionType).join(', ')
                        : '—',
                      hide: availabilityGates.length === 0,
                    },
                    {
                      name: 'Variables',
                      value: specVariables.length ? `${specVariables.length} defined` : '—',
                    },
                    {
                      name: 'Patches',
                      value: patches.length ? `${patches.length} defined` : '—',
                    },
                  ]}
                />
              </SectionBox>
            ),
          },

          ...(controlPlaneRef || controlPlaneMachineInfraRef || hasControlPlaneHealthCheck
            ? [
                {
                  id: 'cluster-api.cluster-class-control-plane',
                  section: (
                    <SectionBox title="Control Plane">
                      <NameValueTable
                        rows={[
                          templateRow('Template', controlPlaneRef),
                          templateRow('Machine Infrastructure', controlPlaneMachineInfraRef),
                          {
                            name: 'Health Check',
                            value: <HealthCheckBadge present={hasControlPlaneHealthCheck} />,
                          },
                        ]}
                      />
                      {hasControlPlaneHealthCheck && (
                        <HealthCheckDisplay
                          healthCheck={cpHealthCheck}
                          machineHealthCheck={cpMachineHealthCheck}
                          compact
                        />
                      )}
                    </SectionBox>
                  ),
                },
              ]
            : []),

          ...(workerMachineDeployments.length > 0 || workerMachinePools.length > 0
            ? [
                {
                  id: 'cluster-api.cluster-class-workers',
                  section: (
                    <WorkerTopologySection
                      machineDeployments={workerMachineDeployments}
                      machinePools={workerMachinePools}
                    />
                  ),
                },
              ]
            : []),

          ...(specVariables.length > 0
            ? [
                {
                  id: 'cluster-api.cluster-class-variables',
                  section: (
                    <SectionBox title="Variables">
                      <SimpleTable
                        columns={[
                          { label: 'Name', getter: r => r.name },
                          {
                            label: 'Required',
                            getter: r =>
                              r.required ? <StatusLabel status="success">Yes</StatusLabel> : 'No',
                          },
                          {
                            label: 'Type',
                            getter: r => r.schema?.openAPIV3Schema?.type ?? '—',
                          },
                          {
                            label: 'Default',
                            getter: r => String(r.schema?.openAPIV3Schema?.default ?? '—'),
                          },
                        ]}
                        data={specVariables}
                      />
                    </SectionBox>
                  ),
                },
              ]
            : []),
        ];

        if (patches.length > 0 || statusVariables.length > 0) {
          sections.push({
            id: 'cluster-api.cluster-class-advanced',
            section: (
              <SectionBox title="Advanced">
                {patches.length > 0 && (
                  <SectionBox title="Patches">
                    <SimpleTable
                      columns={[
                        { label: 'Name', getter: r => r.name },
                        {
                          label: 'Definitions',
                          getter: r => String(r.definitions?.length ?? 0),
                        },
                        {
                          label: 'Enabled If',
                          getter: r => r.enabledIf ?? r.enableIf ?? '—',
                        },
                      ]}
                      data={patches}
                    />
                  </SectionBox>
                )}

                {statusVariables.length > 0 && (
                  <SectionBox title="Status Variables">
                    <SimpleTable
                      columns={[
                        { label: 'Name', getter: r => r.name },
                        {
                          label: 'Conflict',
                          getter: r =>
                            r.definitionsConflict ? (
                              <StatusLabel status="error">Yes</StatusLabel>
                            ) : (
                              <StatusLabel status="success">No</StatusLabel>
                            ),
                        },
                      ]}
                      data={statusVariables}
                    />
                  </SectionBox>
                )}
              </SectionBox>
            ),
          });
        }

        return sections;
      }}
    />
  );
}
