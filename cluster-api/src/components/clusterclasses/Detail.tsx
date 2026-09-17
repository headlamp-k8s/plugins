import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
import { Box, Typography } from '@mui/material';
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
  type LocalObjectTemplate,
  type MachineDeploymentClass,
  type MachinePoolClass,
  type WorkerClass,
} from '../../resources/clusterclass';
import { useCapiApiVersion } from '../../utils/capiVersion';
import {
  getExtraColumnsFromCrd,
  getExtraInfoFromPrinterColumns,
} from '../../utils/crdPrinterColumns';
import { HealthCheckBadge, HealthCheckDisplay } from '../common';
import { getPhaseStatus, renderReference } from '../common/util';

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
  <Typography
    component="span"
    style={{
      ...workerTypeBadgeStyle,
      background: 'rgba(59,130,246,0.12)',
      color: '#3b82f6',
      border: '1px solid rgba(59,130,246,0.25)',
    }}
  >
    MachineDeployment
  </Typography>
);

const poolBadge = (
  <Typography
    component="span"
    style={{
      ...workerTypeBadgeStyle,
      background: 'rgba(168,85,247,0.12)',
      color: '#a855f7',
      border: '1px solid rgba(168,85,247,0.25)',
    }}
  >
    MachinePool
  </Typography>
);

/**
 * Helper to generate a row for a template reference in a NameValueTable.
 *
 * @param name - The label for the row.
 * @param ref - The template reference object.
 * @returns A NameValueTableRow object.
 */
const templateRow = (
  name: string,
  ref: LocalObjectTemplate | undefined,
  t: (key: string) => string
): NameValueTableRow => ({
  name,
  value: renderReference(ref, t),
  hide: !ref,
});

/**
 * Props for the UsedClustersSection component.
 */
/**
 * Props for the UsedClustersSection component.
 * @property clusterClassName The name of the ClusterClass being used
 * @property namespace The namespace where the ClusterClass is defined
 */
interface UsedClustersSectionProps {
  clusterClassName: string;
  namespace?: string;
}

/**
 * Renders a section listing clusters that use this ClusterClass.
 *
 * @param props - Component properties.
 * @param props.clusterClassName - The name of the ClusterClass.
 * @param props.namespace - The namespace.
 */
/**
 * Renders a section listing clusters that use this ClusterClass.
 * @param props UsedClustersSectionProps
 * @returns SectionBox with clusters using the ClusterClass
 */
function UsedClustersSection({ clusterClassName, namespace }: UsedClustersSectionProps) {
  const { t } = useTranslation();
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
  if (!clusters) return <Loader title={t('Checking for clusters...')} />;
  if (usedBy.length === 0) return null;

  return (
    <SectionBox title={t('Clusters')}>
      <SimpleTable
        data={usedBy}
        columns={[
          {
            label: t('Name'),
            getter: (c: Cluster) => <Link kubeObject={c}>{c.metadata.name}</Link>,
          },
          {
            label: t('Namespace'),
            getter: (c: Cluster) => c.metadata.namespace,
          },
          {
            label: t('Phase'),
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

/**
 * Props for the WorkerTopologySection component.
 */
/**
 * Props for the WorkerTopologySection component.
 * @property machineDeployments List of MachineDeployment classes defined in the ClusterClass
 * @property machinePools List of MachinePool classes defined in the ClusterClass
 */
interface WorkerSectionProps {
  machineDeployments: MachineDeploymentClass[];
  machinePools: MachinePoolClass[];
}

/**
 * Renders the worker topology section, including MachineDeployments and MachinePools.
 *
 * @param props - Component properties.
 * @param props.machineDeployments - List of machine deployment classes.
 * @param props.machinePools - List of machine pool classes.
 */
/**
 * Renders the worker topology section, including MachineDeployments and MachinePools.
 * @param props WorkerSectionProps
 * @returns SectionBox with worker topology
 */
function WorkerTopologySection({ machineDeployments, machinePools }: WorkerSectionProps) {
  const { t } = useTranslation();
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

  /**
   * Renders a single worker class entry.
   *
   * @param row - The worker class definition.
   * @param badge - The decorative badge for the worker type.
   * @param index - The index for React key stability.
   */
  function renderWorker(row: WorkerClass, badge: React.ReactNode, index: number) {
    const bootstrap = getWorkerBootstrap(row);
    const infrastructure = getWorkerInfrastructure(row);
    const { healthCheck: healthCheckV2, machineHealthCheck: healthCheckV1 } =
      getWorkerHealthChecks(row);
    const hasHealthCheck = !!(healthCheckV2 || healthCheckV1);

    const infoRows: NameValueTableRow[] = [
      templateRow(t('Bootstrap Template'), bootstrap, t),
      templateRow(t('Infrastructure Template'), infrastructure, t),
      { name: t('Health Check'), value: <HealthCheckBadge present={hasHealthCheck} /> },
    ];

    return (
      <Box key={`${row.class}-${index}`}>
        {index > 0 && <Box style={dividerStyle} />}
        <Box style={classHeaderStyle}>
          {badge}
          <Typography component="span" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
            {row.class}
          </Typography>
        </Box>
        <NameValueTable rows={infoRows} />
        {hasHealthCheck && (
          <HealthCheckDisplay
            healthCheck={healthCheckV2}
            machineHealthCheck={healthCheckV1}
            compact
          />
        )}
      </Box>
    );
  }

  return (
    <SectionBox title={t('Worker Topology')}>
      {machineDeployments.map((row, i) => renderWorker(row, deploymentBadge, i))}
      {machinePools.map((row, i) => renderWorker(row, poolBadge, machineDeployments.length + i))}
    </SectionBox>
  );
}

/**
 * Node type for ClusterClass detail view.
 * @property kubeObject The ClusterClass resource object
 */
type ClusterClassNode = {
  kubeObject: ClusterClass;
};
/**
 * Main detail view component for the ClusterClass resource.
 * Handles API version detection and data fetching wrappers.
 */
/**
 * Main detail view component for the ClusterClass resource.
 * Handles API version detection and data fetching wrappers.
 * @param node ClusterClassNode (optional)
 * @returns ClusterClassDetailContent or error/empty state
 */
export function ClusterClassDetail({ node }: { node?: ClusterClassNode }) {
  const { t } = useTranslation();
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();

  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">{t('Missing resource name')}</EmptyContent>;

  return (
    <ClusterClassDetailContent
      crName={crName}
      namespace={namespace}
      crdName={ClusterClass.crdName}
    />
  );
}

/**
 * Props for the ClusterClassDetailContent wrapper.
 */
/**
 * Props for the ClusterClassDetailContent wrapper.
 * @property crName The resource name from the URL params
 * @property namespace The namespace from the URL params
 * @property crdName The fully qualified CRD name
 */
interface ClusterClassDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

/**
 * Props for the versioned ClusterClass detail view.
 */
/**
 * Props for the versioned ClusterClass detail view.
 * @property VersionedClusterClass The resource class bound to the detected API version
 * @property apiVersion The detected CAPI API version (e.g., v1beta1, v1beta2)
 */
interface ClusterClassDetailContentWithVersionProps extends ClusterClassDetailContentProps {
  VersionedClusterClass: typeof ClusterClass;
  apiVersion: string;
}

/**
 * Data-fetching wrapper that detects the correct CAPI API version.
 *
 * @param props - Component properties (resource identification).
 */
/**
 * Data-fetching wrapper that detects the correct CAPI API version.
 * @param props ClusterClassDetailContentProps
 * @returns ClusterClassDetailWithData or Loader
 */
function ClusterClassDetailContent(props: ClusterClassDetailContentProps) {
  const { t } = useTranslation();
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedClusterClass = useMemo(
    () => (apiVersion ? ClusterClass.withApiVersion(apiVersion) : ClusterClass),
    [apiVersion]
  );

  if (!apiVersion) return <Loader title={t('Detecting Cluster API version')} />;

  return (
    <ClusterClassDetailWithData
      {...props}
      VersionedClusterClass={VersionedClusterClass}
      apiVersion={apiVersion}
    />
  );
}

/**
 * Renders the final detail view with all fetched data.
 *
 * @param props - Component properties including the versioned class and detected version.
 */
/**
 * Renders the final detail view with all fetched data.
 * @param props ClusterClassDetailContentWithVersionProps
 * @returns DetailsGrid with all ClusterClass details
 */
function ClusterClassDetailWithData({
  crName,
  namespace,
  VersionedClusterClass,
  apiVersion,
  crdName,
}: ClusterClassDetailContentWithVersionProps) {
  const { t } = useTranslation();
  const [crd, crdError] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedClusterClass.useGet(crName, namespace);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        {t('Error loading ClusterClass {{name}}: {{message}}', {
          name: crName,
          message: itemError?.message,
        })}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title={t('Loading ClusterClass details')} />;

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

  /**
   * Generates additional resource information for the DetailsGrid header.
   *
   * @returns List of name-value rows.
   */
  const extraInfo = () => {
    const info: NameValueTableRow[] = [
      {
        name: t('Variables'),
        value:
          specVariables.length > 0 ? t('{{count}} defined', { count: specVariables.length }) : '—',
      },
      {
        name: t('Patches'),
        value: patches.length > 0 ? t('{{count}} defined', { count: patches.length }) : '—',
      },
      {
        name: t('Machine Deployments'),
        value:
          workerMachineDeployments.length > 0
            ? workerMachineDeployments.length > 1
              ? t('{{count}} classes', { count: workerMachineDeployments.length })
              : t('{{count}} class', { count: workerMachineDeployments.length })
            : '—',
      },
      {
        name: t('Machine Pools'),
        value:
          workerMachinePools.length > 0
            ? workerMachinePools.length > 1
              ? t('{{count}} classes', { count: workerMachinePools.length })
              : t('{{count}} class', { count: workerMachinePools.length })
            : '—',
        hide: workerMachinePools.length === 0,
      },
    ];

    if (crd) {
      info.unshift({
        name: t('Definition'),
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
        name: t('Additional info'),
        value: t('Some extra details could not be loaded.'),
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
              <SectionBox title={t('Overview')}>
                <NameValueTable
                  rows={[
                    templateRow(t('Infrastructure Template'), infrastructureRef, t),
                    templateRow(t('Control Plane Template'), controlPlaneRef, t),
                    templateRow(t('Control Plane Machine Infra'), controlPlaneMachineInfraRef, t),
                    {
                      name: t('Availability Gates'),
                      value: availabilityGates.length
                        ? availabilityGates.map(g => g.conditionType).join(', ')
                        : '—',
                      hide: availabilityGates.length === 0,
                    },
                    {
                      name: t('Variables'),
                      value: specVariables.length
                        ? t('{{count}} defined', { count: specVariables.length })
                        : '—',
                    },
                    {
                      name: t('Patches'),
                      value: patches.length
                        ? t('{{count}} defined', { count: patches.length })
                        : '—',
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
                    <SectionBox title={t('Control Plane')}>
                      <NameValueTable
                        rows={[
                          templateRow(t('Template'), controlPlaneRef, t),
                          templateRow(t('Machine Infrastructure'), controlPlaneMachineInfraRef, t),
                          {
                            name: t('Health Check'),
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
                    <SectionBox title={t('Variables')}>
                      <SimpleTable
                        columns={[
                          { label: t('Name'), getter: r => r.name },
                          {
                            label: t('Required'),
                            getter: r =>
                              r.required ? (
                                <StatusLabel status="success">{t('Yes')}</StatusLabel>
                              ) : (
                                t('No')
                              ),
                          },
                          {
                            label: t('Type'),
                            getter: r => r.schema?.openAPIV3Schema?.type ?? '—',
                          },
                          {
                            label: t('Default'),
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
              <SectionBox title={t('Advanced')}>
                {patches.length > 0 && (
                  <SectionBox title={t('Patches')}>
                    <SimpleTable
                      columns={[
                        { label: t('Name'), getter: r => r.name },
                        {
                          label: t('Definitions'),
                          getter: r => String(r.definitions?.length ?? 0),
                        },
                        {
                          label: t('Enabled If'),
                          getter: r => r.enabledIf ?? r.enableIf ?? '—',
                        },
                      ]}
                      data={patches}
                    />
                  </SectionBox>
                )}

                {statusVariables.length > 0 && (
                  <SectionBox title={t('Status Variables')}>
                    <SimpleTable
                      columns={[
                        { label: t('Name'), getter: r => r.name },
                        {
                          label: t('Conflict'),
                          getter: r =>
                            r.definitionsConflict ? (
                              <StatusLabel status="error">{t('Yes')}</StatusLabel>
                            ) : (
                              <StatusLabel status="success">{t('No')}</StatusLabel>
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
