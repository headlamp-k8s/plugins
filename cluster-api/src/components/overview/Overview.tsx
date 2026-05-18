import {
  DateLabel,
  EmptyContent,
  HoverInfoLabel,
  LightTooltip,
  Link,
  Loader,
  PageGrid,
  ResourceListView,
  SectionBox,
  ShowHideLabel,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event from '@kinvolk/headlamp-plugin/lib/k8s/event';
import {
  Box,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Switch,
  Typography,
  useTheme,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { Theme } from '@mui/material/styles';
import React, { useEffect, useMemo } from 'react';
import { Cluster } from '../../resources/cluster';
import { KubeadmConfigTemplate } from '../../resources/kubeadmconfigtemplate';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { KubeadmControlPlaneTemplate } from '../../resources/kubeadmcontrolplanetemplate';
import { Machine } from '../../resources/machine';
import { MachineDeployment } from '../../resources/machinedeployment';
import { MachinePool } from '../../resources/machinepool';
import { MachineSet } from '../../resources/machineset';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { renderConditionStatus } from '../common/util';
import {
  ErrorSeverity,
  getClusterNameForResource,
  getDerivedSeverity,
  getInfrastructureProvider,
  getReadinessColor,
  getReadinessPercent,
  getStatusLabelStateForSeverity,
  isResourceReadyByKind,
} from './capiUtils';
import ClusterDetailsErrorOverview from './ClusterDetailsErrorOverview';
import { getDisplayableErrorConditions } from './clusterHealth';

interface CapiConditionRow {
  resourceKind: string;
  detailRoute: string;
  resourceName: string;
  namespace: string;
  clusterName?: string;
  type: string;
  status: string;
  reason?: string;
  message?: string;
  time?: string;
  severity: ErrorSeverity;
}

/**
 * Renders a clickable link to the Kubernetes object involved in an event.
 * If the object instance is not available, falls back to displaying the object name.
 *
 * @param event - The Kubernetes event object.
 * @returns A React node containing the link or plain text name.
 */
function makeObjectLink(event: Event) {
  const obj = event.involvedObjectInstance;
  if (obj) return <Link kubeObject={obj} />;
  return event.involvedObject.name;
}

/**
 * Creates a status badge for an event, displaying its reason.
 * The badge indicates a warning for any event type other than 'Normal'.
 *
 * @param event - The Kubernetes event object.
 * @returns A StatusLabel component representing the event status.
 */
function makeStatusLabel(event: Event) {
  return (
    <StatusLabel
      status={event.type === 'Normal' ? '' : 'warning'}
      sx={(theme: Theme) => ({ [theme.breakpoints.up('md')]: { display: 'unset' } })}
    >
      {event.reason}
    </StatusLabel>
  );
}

/**
 * Renders a table displaying active condition issues across Cluster API resources.
 *
 * @param props - Component properties.
 * @param props.rows - Array of standardized condition error rows to display.
 * @param props.resourceLabel - A mapping from resource class names to human-readable labels.
 * @returns A SimpleTable component.
 */
function CapiConditionsTable({
  rows,
  resourceLabel,
}: {
  rows: CapiConditionRow[];
  resourceLabel: { [key: string]: string };
}) {
  return (
    <SimpleTable
      columns={[
        {
          label: 'Resource',
          getter: (row: CapiConditionRow) => (
            <Chip
              label={resourceLabel[row.resourceKind] ?? row.resourceKind}
              size="small"
              variant="outlined"
            />
          ),
        },
        {
          label: 'Name',
          getter: (row: CapiConditionRow) => (
            <Link
              routeName={row.detailRoute}
              params={{ namespace: row.namespace, name: row.resourceName }}
            >
              {row.resourceName}
            </Link>
          ),
        },
        {
          label: 'Cluster',
          getter: (row: CapiConditionRow) => row.clusterName || '-',
        },
        {
          label: 'Condition',
          getter: (row: CapiConditionRow) => (
            <LightTooltip title={row.type}>
              <Typography variant="body2" noWrap>
                {renderConditionStatus(undefined, row as any, {
                  trueLabel: row.type,
                  falseLabel: row.type,
                  unknownLabel: row.type,
                  trueStatus: 'success',
                  falseStatus: 'error',
                  unknownStatus: 'warning',
                })}
              </Typography>
            </LightTooltip>
          ),
        },
        {
          label: 'Severity',
          getter: (row: CapiConditionRow) => (
            <StatusLabel status={getStatusLabelStateForSeverity(row.severity)}>
              {row.severity}
            </StatusLabel>
          ),
        },
        {
          label: 'Last Transition',
          getter: (row: CapiConditionRow) => (row.time ? <DateLabel date={row.time} /> : '-'),
        },
        {
          label: 'Reason',
          getter: (row: CapiConditionRow) =>
            row.reason ? <HoverInfoLabel label={row.reason} hoverInfo={row.message} /> : '-',
        },
      ]}
      data={rows}
    />
  );
}

/**
 * Displays a circular progress chart indicating the readiness ratio of a specific resource kind.
 * Includes optional support for showing an inner ready conditions bar.
 *
 * @param props - Component properties.
 * @param props.resourceData - Array of resource items to analyze.
 * @param props.resourceKind - The kind of the resource (e.g., 'Cluster', 'Machine').
 * @param props.allResourcesForMatching - Context containing all cluster resources, used for checking cluster health hierarchies.
 * @param props.title - The title to display above the chart.
 * @param props.readyLabel - Text label for the ready count (default: 'Ready').
 * @param props.notReadyLabel - Text label for the not-ready count (default: 'Not Ready').
 * @param props.showReadyBar - If true, displays a secondary chart for generic ready conditions.
 * @returns A visual chart component or a loader if data is not yet available.
 */
function ResourceCircleChart({
  resourceData,
  resourceKind,
  allResourcesForMatching = [],
  title,
  readyLabel = 'Ready',
  notReadyLabel = 'Not Ready',
  showReadyBar = false,
}: {
  resourceData: any[] | null;
  resourceKind: string;
  allResourcesForMatching?: { className: string; items: any[] }[];
  title: React.ReactNode;
  readyLabel?: string;
  notReadyLabel?: string;
  showReadyBar?: boolean;
}) {
  const theme = useTheme();
  if (!resourceData) return <Loader title="Loading chart..." />;

  const total = resourceData.length;
  const healthy = resourceData.filter(item =>
    isResourceReadyByKind(item, resourceKind, allResourcesForMatching)
  ).length;
  const percent = getReadinessPercent(healthy, total);
  const color = getReadinessColor(healthy, total, theme);

  const readyCondCount = resourceData.filter(item => {
    const conditions = item.status?.conditions ?? item.conditions ?? [];
    return conditions.find((c: any) => c.type === 'Ready')?.status === 'True';
  }).length;
  const percentReady = getReadinessPercent(readyCondCount, total);
  const colorReady = getReadinessColor(readyCondCount, total, theme);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: showReadyBar ? 'space-around' : 'center',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={100}
              size={84}
              thickness={4}
              sx={{ color: theme.palette.divider, position: 'absolute' }}
            />
            <CircularProgress
              variant="determinate"
              value={total === 0 ? 0 : percent}
              size={84}
              thickness={4}
              sx={{ color, strokeLinecap: 'round' }}
            />
            <Box
              sx={{
                inset: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                {total > 0 ? Math.round(percent) : 0}%
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '140px',
              mt: 1.5,
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{readyLabel}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.success.main }}>
                {healthy}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                {notReadyLabel}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.warning.main }}>
                {total - healthy}
              </Typography>
            </Box>
          </Box>
        </Box>

        {showReadyBar && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={84}
                thickness={4}
                sx={{ color: theme.palette.divider, position: 'absolute' }}
              />
              <CircularProgress
                variant="determinate"
                value={total === 0 ? 0 : percentReady}
                size={84}
                thickness={4}
                sx={{ color: colorReady, strokeLinecap: 'round' }}
              />
              <Box
                sx={{
                  inset: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                  {total > 0 ? Math.round(percentReady) : 0}%
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 1.5 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Ready Cond.</Typography>
                <Typography
                  sx={{ fontSize: 12, fontWeight: 500, color: theme.palette.success.main }}
                >
                  {readyCondCount}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * The main overview dashboard for Cluster API.
 * Aggregates and displays health metrics, resources, and events across all CAPI controllers.
 * Handles the fetching and caching of versioned resources.
 *
 * @returns The complete Cluster API dashboard page grid.
 */
export default function ClusterApiOverview() {
  const capiVersion = useCapiApiVersion(Cluster.crdName, 'v1beta1');

  const VersionedCluster = useMemo(
    () => (capiVersion ? Cluster.withApiVersion(capiVersion) : Cluster),
    [capiVersion]
  );
  const VersionedMachine = useMemo(
    () => (capiVersion ? Machine.withApiVersion(capiVersion) : Machine),
    [capiVersion]
  );
  const VersionedMachineDeployment = useMemo(
    () => (capiVersion ? MachineDeployment.withApiVersion(capiVersion) : MachineDeployment),
    [capiVersion]
  );
  const VersionedMachinePool = useMemo(
    () => (capiVersion ? MachinePool.withApiVersion(capiVersion) : MachinePool),
    [capiVersion]
  );
  const VersionedMachineSet = useMemo(
    () => (capiVersion ? MachineSet.withApiVersion(capiVersion) : MachineSet),
    [capiVersion]
  );
  const VersionedKCP = useMemo(
    () => (capiVersion ? KubeadmControlPlane.withApiVersion(capiVersion) : KubeadmControlPlane),
    [capiVersion]
  );
  const VersionedKCPTemplate = useMemo(
    () =>
      capiVersion
        ? KubeadmControlPlaneTemplate.withApiVersion(capiVersion)
        : KubeadmControlPlaneTemplate,
    [capiVersion]
  );
  const VersionedKCTemplate = useMemo(
    () => (capiVersion ? KubeadmConfigTemplate.withApiVersion(capiVersion) : KubeadmConfigTemplate),
    [capiVersion]
  );

  const [clusters] = VersionedCluster.useList();
  const [machines] = VersionedMachine.useList();
  const [machineDeployments] = VersionedMachineDeployment.useList();
  const [machinePools] = VersionedMachinePool.useList();
  const [machineSets] = VersionedMachineSet.useList();
  const [kcps] = VersionedKCP.useList();
  const [kcpTemplates] = VersionedKCPTemplate.useList();
  const [kcTemplates] = VersionedKCTemplate.useList();

  const resourcesData: { [key: string]: any[] } = useMemo(
    () => ({
      [VersionedCluster.className]: clusters ?? [],
      [VersionedMachine.className]: machines ?? [],
      [VersionedMachineDeployment.className]: machineDeployments ?? [],
      [VersionedMachinePool.className]: machinePools ?? [],
      [VersionedMachineSet.className]: machineSets ?? [],
      [VersionedKCP.className]: kcps ?? [],
    }),
    [
      VersionedCluster.className,
      clusters,
      VersionedMachine.className,
      machines,
      VersionedMachineDeployment.className,
      machineDeployments,
      VersionedMachinePool.className,
      machinePools,
      VersionedMachineSet.className,
      machineSets,
      VersionedKCP.className,
      kcps,
    ]
  );

  const resources = useMemo(
    () => [
      VersionedCluster,
      VersionedMachine,
      VersionedMachineDeployment,
      VersionedMachinePool,
      VersionedMachineSet,
      VersionedKCP,
    ],
    [
      VersionedCluster,
      VersionedMachine,
      VersionedMachineDeployment,
      VersionedMachinePool,
      VersionedMachineSet,
      VersionedKCP,
    ]
  );

  const resourceLabel: { [key: string]: string } = useMemo(
    () => ({
      [VersionedCluster.className]: 'Clusters',
      [VersionedMachine.className]: 'Machines',
      [VersionedMachineDeployment.className]: 'Machine Deployments',
      [VersionedMachinePool.className]: 'Machine Pools',
      [VersionedMachineSet.className]: 'Machine Sets',
      [VersionedKCP.className]: 'Control Planes',
    }),
    [
      VersionedCluster.className,
      VersionedMachine.className,
      VersionedMachineDeployment.className,
      VersionedMachinePool.className,
      VersionedMachineSet.className,
      VersionedKCP.className,
    ]
  );

  const resourceRoute: { [key: string]: string } = useMemo(
    () => ({
      [VersionedCluster.className]: 'capiclusters',
      [VersionedMachine.className]: 'machines',
      [VersionedMachineDeployment.className]: 'machinedeployments',
      [VersionedMachinePool.className]: 'machinepools',
      [VersionedMachineSet.className]: 'machinesets',
      [VersionedKCP.className]: 'kubeadmcontrolplanes',
    }),
    [
      VersionedCluster.className,
      VersionedMachine.className,
      VersionedMachineDeployment.className,
      VersionedMachinePool.className,
      VersionedMachineSet.className,
      VersionedKCP.className,
    ]
  );

  const detailRouteMap: { [key: string]: string } = useMemo(
    () => ({
      [VersionedCluster.className]: 'capicluster',
      [VersionedMachine.className]: 'machine',
      [VersionedMachineDeployment.className]: 'machinedeployment',
      [VersionedMachinePool.className]: 'machinepool',
      [VersionedMachineSet.className]: 'machineset',
      [VersionedKCP.className]: 'kubeadmcontrolplane',
    }),
    [
      VersionedCluster.className,
      VersionedMachine.className,
      VersionedMachineDeployment.className,
      VersionedMachinePool.className,
      VersionedMachineSet.className,
      VersionedKCP.className,
    ]
  );

  const resourceKindMap: { [key: string]: string } = useMemo(
    () => ({
      [VersionedCluster.className]: 'Cluster',
      [VersionedMachine.className]: 'Machine',
      [VersionedMachineDeployment.className]: 'MachineDeployment',
      [VersionedMachinePool.className]: 'MachinePool',
      [VersionedMachineSet.className]: 'MachineSet',
      [VersionedKCP.className]: 'KubeadmControlPlane',
    }),
    [
      VersionedCluster.className,
      VersionedMachine.className,
      VersionedMachineDeployment.className,
      VersionedMachinePool.className,
      VersionedMachineSet.className,
      VersionedKCP.className,
    ]
  );

  const readyLabelMap: { [key: string]: string } = useMemo(
    () => ({
      [VersionedCluster.className]: 'Healthy',
      [VersionedMachine.className]: 'Running',
      [VersionedMachineDeployment.className]: 'Available',
      [VersionedMachinePool.className]: 'Available',
      [VersionedMachineSet.className]: 'Available',
      [VersionedKCP.className]: 'Available',
    }),
    [
      VersionedCluster.className,
      VersionedMachine.className,
      VersionedMachineDeployment.className,
      VersionedMachinePool.className,
      VersionedMachineSet.className,
      VersionedKCP.className,
    ]
  );

  const notReadyLabelMap: { [key: string]: string } = useMemo(
    () => ({
      [VersionedCluster.className]: 'Unhealthy',
      [VersionedMachine.className]: 'Not Running',
      [VersionedMachineDeployment.className]: 'Degraded',
      [VersionedMachinePool.className]: 'Degraded',
      [VersionedMachineSet.className]: 'Degraded',
      [VersionedKCP.className]: 'Degraded',
    }),
    [
      VersionedCluster.className,
      VersionedMachine.className,
      VersionedMachineDeployment.className,
      VersionedMachinePool.className,
      VersionedMachineSet.className,
      VersionedKCP.className,
    ]
  );

  const [isWarningOnly, setIsWarningOnly] = React.useState(true);
  const [errorResourceFilter, setErrorResourceFilter] = React.useState('All');
  const [clusterErrorFilter, setClusterErrorFilter] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState<'All' | ErrorSeverity>('All');

  const allResourcesForMatching = useMemo(
    () => Object.entries(resourcesData).map(([className, items]) => ({ className, items })),
    [resourcesData]
  );

  useEffect(() => {
    if (!clusters?.length) return;
    const hasSelectedCluster = clusters.some(
      cluster => cluster.metadata.name === clusterErrorFilter
    );
    if (!hasSelectedCluster) {
      setClusterErrorFilter(clusters[0].metadata.name);
    }
  }, [clusters, clusterErrorFilter]);

  const { items: rawEvents } = Event.useList();
  const { totalCapiEventsCount, capiWarningsCount } = useMemo(() => {
    if (!rawEvents) return { totalCapiEventsCount: '?', capiWarningsCount: '?' };
    const capiKinds = new Set([
      'Cluster',
      'Machine',
      'MachineDeployment',
      'MachinePool',
      'MachineSet',
      'KubeadmControlPlane',
    ]);
    let allCount = 0;
    let warningCount = 0;
    for (const event of rawEvents) {
      if (event?.involvedObject?.kind && capiKinds.has(event.involvedObject.kind)) {
        allCount++;
        if (event.type === 'Warning') warningCount++;
      }
    }
    return { totalCapiEventsCount: allCount, capiWarningsCount: warningCount };
  }, [rawEvents]);

  const capiEvents = useMemo(() => {
    if (!rawEvents) return [];
    const capiKinds = new Set([
      'Cluster',
      'Machine',
      'MachineDeployment',
      'MachinePool',
      'MachineSet',
      'KubeadmControlPlane',
    ]);
    return rawEvents
      .filter(event => {
        if (!event?.involvedObject?.kind) return false;
        if (!capiKinds.has(event.involvedObject.kind)) return false;
        if (isWarningOnly && event.type !== 'Warning') return false;
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(
          a.metadata?.creationTimestamp || a.lastOccurrence || a.firstOccurrence || 0
        ).getTime();
        const timeB = new Date(
          b.metadata?.creationTimestamp || b.lastOccurrence || b.firstOccurrence || 0
        ).getTime();
        return timeB - timeA;
      })
      .slice(0, 50);
  }, [rawEvents, isWarningOnly]);

  const allErrors = useMemo(() => {
    const resourceOrder: Record<string, number> = {};
    resources.forEach((resource, index) => {
      resourceOrder[resource.className] = index + 1;
    });

    const rows: CapiConditionRow[] = [];

    Object.entries(resourcesData).forEach(([className, items]) => {
      const detailRoute = detailRouteMap[className] || 'capicluster';
      items.forEach((item: any) => {
        const clusterName =
          className === VersionedCluster.className
            ? item.metadata.name
            : getClusterNameForResource(item);

        getDisplayableErrorConditions(item).forEach((condition: any) => {
          rows.push({
            resourceKind: className,
            detailRoute,
            resourceName: item.metadata.name,
            namespace: item.metadata.namespace || '',
            clusterName,
            type: condition.type,
            status: condition.status,
            reason: condition.reason || undefined,
            message: condition.message || undefined,
            time: condition.lastTransitionTime || item.metadata?.creationTimestamp,
            severity: getDerivedSeverity(item, condition),
          });
        });
      });
    });

    return rows.sort((a, b) => {
      const aPriority = resourceOrder[a.resourceKind] ?? 99;
      const bPriority = resourceOrder[b.resourceKind] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime();
    });
  }, [resourcesData, detailRouteMap, VersionedCluster.className, resources]);

  const filteredErrors = useMemo(
    () =>
      allErrors.filter(error => {
        if (errorResourceFilter !== 'All' && error.resourceKind !== errorResourceFilter)
          return false;
        if (error.clusterName !== clusterErrorFilter) return false;
        if (severityFilter !== 'All' && error.severity !== severityFilter) return false;
        return true;
      }),
    [allErrors, errorResourceFilter, clusterErrorFilter, severityFilter]
  );

  if (capiVersion === null) return <Loader title="Detecting Cluster API version…" />;
  if (
    clusters === null ||
    machines === null ||
    machineDeployments === null ||
    machineSets === null ||
    kcps === null
  ) {
    return <Loader title="Loading Cluster API overview…" />;
  }
  if (clusters.length === 0) {
    return (
      <PageGrid>
        <SectionBox title="Overview">
          <EmptyContent>No Cluster API resources found</EmptyContent>
        </SectionBox>
      </PageGrid>
    );
  }

  const uniqueProviders = Array.from(
    new Set(clusters.map(cluster => getInfrastructureProvider(cluster)))
  ).filter(provider => provider !== '-');
  const totalTemplates = (kcpTemplates?.length ?? 0) + (kcTemplates?.length ?? 0);

  function ChartLink({ resource }: { resource: any }) {
    return (
      <Link routeName={resourceRoute[resource.className]}>{resourceLabel[resource.className]}</Link>
    );
  }

  return (
    <PageGrid>
      <SectionBox py={2} mt={1} title="Overview">
        <Grid container justifyContent="flex-start" alignItems="flex-start" spacing={2}>
          {resources.map(resource => (
            <Grid item lg={3} md={4} xs={6} key={resource.className} style={{ minWidth: 0 }}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                  height: '100%',
                }}
              >
                <ResourceCircleChart
                  resourceData={resourcesData[resource.className] || []}
                  resourceKind={resourceKindMap[resource.className]}
                  allResourcesForMatching={allResourcesForMatching}
                  title={<ChartLink resource={resource} />}
                  readyLabel={readyLabelMap[resource.className]}
                  notReadyLabel={notReadyLabelMap[resource.className]}
                  showReadyBar={resource.className === VersionedMachine.className}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SectionBox>

      <SectionBox>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item lg={4} md={6} xs={12}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                }}
              >
                <Typography variant="h4" color="primary">
                  {uniqueProviders.length}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Unique Providers
                </Typography>
                {uniqueProviders.length > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      gap: 1,
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {uniqueProviders.map(provider => (
                      <Chip key={provider} label={provider} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                }}
              >
                <Typography variant="h4" color="primary">
                  {totalTemplates}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Configuration Templates
                </Typography>
                {totalTemplates > 0 && (
                  <Box
                    sx={{
                      mt: 1,
                      display: 'flex',
                      gap: 2,
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      <b>Control Plane:</b> {kcpTemplates?.length ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <b>Worker:</b> {kcTemplates?.length ?? 0}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: filteredErrors.length > 0 ? 'warning.main' : 'divider',
                  boxShadow: 'none',
                }}
              >
                <Typography
                  variant="h4"
                  color={filteredErrors.length > 0 ? 'warning.main' : 'success.main'}
                >
                  {allErrors.length}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  Active Condition Issues
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  False or Unknown conditions across all resources
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </SectionBox>

      <ClusterDetailsErrorOverview
        clusters={clusters}
        machines={machines}
        machineDeployments={machineDeployments}
        machinePools={machinePools || []}
        machineSets={machineSets}
        kcps={kcps}
        resourcesData={resourcesData}
      />

      <SectionBox title="Conditions">
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
          <Select
            size="small"
            value={clusterErrorFilter}
            onChange={e => setClusterErrorFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {clusters.map(cluster => (
              <MenuItem key={cluster.metadata.uid} value={cluster.metadata.name}>
                {cluster.metadata.name}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={errorResourceFilter}
            onChange={e => setErrorResourceFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="All">All Resources</MenuItem>
            {resources.map(resource => (
              <MenuItem key={resource.className} value={resource.className}>
                {resourceLabel[resource.className]}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as 'All' | ErrorSeverity)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="All">All Severities</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="info">Info</MenuItem>
          </Select>
        </Box>
        <CapiConditionsTable rows={filteredErrors} resourceLabel={resourceLabel} />
      </SectionBox>

      <ResourceListView
        title="Events"
        data={capiEvents}
        headerProps={{
          noNamespaceFilter: true,
          titleSideActions: [
            <FormControlLabel
              label={`Only warnings (${capiWarningsCount} / ${totalCapiEventsCount})`}
              control={
                <Switch
                  color="primary"
                  checked={isWarningOnly}
                  onChange={(_event, checked) => setIsWarningOnly(checked)}
                />
              }
              key="warning-toggle"
            />,
          ],
        }}
        columns={[
          {
            label: 'Type',
            gridTemplate: 'min-content',
            filterVariant: 'multi-select',
            getValue: (event: any) => event.involvedObject.kind,
          },
          {
            label: 'Name',
            getValue: (event: any) =>
              event.involvedObjectInstance?.getName() ?? event.involvedObject.name,
            render: (event: any) => makeObjectLink(event),
            gridTemplate: 'auto',
          },
          'namespace',
          'cluster',
          {
            label: 'Reason',
            gridTemplate: 'min-content',
            filterVariant: 'multi-select',
            getValue: (event: any) => event.reason,
            render: (event: any) => (
              <LightTooltip title={event.reason} interactive>
                {makeStatusLabel(event)}
              </LightTooltip>
            ),
          },
          {
            label: 'Message',
            getValue: (event: any) => event.message ?? '',
            render: (event: any) => (
              <ShowHideLabel labelId={event.metadata?.uid || ''}>
                {event.message || ''}
              </ShowHideLabel>
            ),
            gridTemplate: 'auto',
          },
          {
            id: 'count',
            label: 'Count',
            gridTemplate: 'min-content',
            cellProps: { align: 'right' },
            getValue: (event: any) => event.count ?? null,
            render: (event: any) => event.count ?? '-',
          },
          {
            id: 'last-seen',
            label: 'Last Seen',
            gridTemplate: 'min-content',
            cellProps: { align: 'right' },
            getValue: (event: any) => -new Date(event.lastOccurrence).getTime(),
            render: (event: any) => <DateLabel date={event.lastOccurrence} format="mini" />,
          },
        ]}
        defaultSortingColumn={{ id: 'last-seen', desc: false }}
        id="headlamp-cluster.overview.events"
      />
    </PageGrid>
  );
}
