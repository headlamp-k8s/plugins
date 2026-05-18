import { Icon } from '@iconify/react';
import {
  EmptyContent,
  LightTooltip,
  Link,
  MetadataDictGrid,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Typography,
  useTheme,
} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useEffect, useMemo, useState } from 'react';
import {
  copyToClipboard,
  getBootstrapKind,
  getInfrastructureProvider,
  getSeverityBgColor,
  getSeverityBorderColor,
  getSeverityColor,
  getStatusLabelStateForSeverity,
} from './capiUtils';
import {
  ClusterPriorityError,
  getDisplayableErrorConditions,
  getPriorityErrorForCluster,
} from './clusterHealth';

interface ClusterDetailsErrorOverviewProps {
  clusters: any[];
  machines: any[];
  machineDeployments: any[];
  machinePools: any[];
  machineSets: any[];
  kcps: any[];
  resourcesData: { [key: string]: any[] };
}

/**
 * Calculates and returns a status label component representing the overall cluster health.
 *
 * @param healthy - Boolean indicating if the cluster is healthy (no priority errors).
 * @param priorityError - The highest priority error affecting the cluster, or null if none.
 * @returns A StatusLabel component colored according to the severity.
 */
function renderClusterHealthStatus(healthy: boolean, priorityError: ClusterPriorityError | null) {
  const status = healthy
    ? 'success'
    : getStatusLabelStateForSeverity(priorityError?.errorDef.severity);
  return <StatusLabel status={status}>{healthy ? 'Healthy' : 'Needs Attention'}</StatusLabel>;
}

/**
 * An expandable panel that displays actionable solutions, steps, and copyable CLI commands
 * to resolve a specific cluster priority error.
 *
 * @param props - Component properties.
 * @param props.priorityError - The specific error definition containing solution details.
 * @param props.open - Whether the panel is currently expanded or collapsed.
 * @returns A Collapse-wrapped React component with solution instructions.
 */
function InlineSolutionPanel({
  priorityError,
  open,
}: {
  priorityError: ClusterPriorityError;
  open: boolean;
}) {
  const theme = useTheme();
  const { errorDef } = priorityError;
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopiedCommand(text);
      setTimeout(() => setCopiedCommand(null), 1800);
    } catch {
      setCopiedCommand(null);
    }
  };

  const severityBg = getSeverityBgColor(theme, errorDef.severity);
  const severityBorder = getSeverityBorderColor(theme, errorDef.severity);

  return (
    <Collapse in={open}>
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${severityBorder}`,
          bgcolor: severityBg,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
          {errorDef.description}
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Suggested steps
        </Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
          {errorDef.solution.steps.map((step, index) => (
            <Typography component="li" key={index} variant="body2" sx={{ mb: 0.5 }}>
              {step}
            </Typography>
          ))}
        </Box>

        {errorDef.solution.codeSnippet && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 0.75,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {errorDef.solution.codeSnippet.description || 'Fix command'}
              </Typography>
              <Button
                size="small"
                startIcon={
                  <Icon
                    icon={
                      copiedCommand === errorDef.solution.codeSnippet.code
                        ? 'mdi:check'
                        : 'mdi:content-copy'
                    }
                    width="14px"
                    height="14px"
                  />
                }
                onClick={() => handleCopy(errorDef.solution.codeSnippet!.code)}
                sx={{ textTransform: 'none' }}
              >
                {copiedCommand === errorDef.solution.codeSnippet.code ? 'Copied' : 'Copy'}
              </Button>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: theme.palette.background.default,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.78rem',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
              }}
            >
              <code>{errorDef.solution.codeSnippet.code}</code>
            </Box>
          </Box>
        )}

        {errorDef.solution.quickFixCommands && errorDef.solution.quickFixCommands.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Quick commands
            </Typography>
            {errorDef.solution.quickFixCommands.map((cmd, index) => (
              <Box key={index} sx={{ mb: 1.25 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {cmd.description}
                  </Typography>
                  <IconButton size="small" onClick={() => handleCopy(cmd.command)}>
                    <Icon
                      icon={copiedCommand === cmd.command ? 'mdi:check' : 'mdi:content-copy'}
                      width="14px"
                      height="14px"
                    />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: theme.palette.background.default,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.75rem',
                  }}
                >
                  {cmd.command}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Collapse>
  );
}
/**
 * A detailed, full-width card displaying a single cluster's status, metadata,
 * related resource counts, active errors, and a collapsable solution panel.
 *
 * @param props - Component properties.
 * @param props.cluster - The primary Cluster resource object.
 * @param props.machines - All Machine resources to filter against the cluster.
 * @param props.machineDeployments - All MachineDeployment resources to filter against the cluster.
 * @param props.machinePools - All MachinePool resources to filter against the cluster.
 * @param props.machineSets - All MachineSet resources to filter against the cluster.
 * @param props.kcps - All KubeadmControlPlane resources to filter against the cluster.
 * @param props.priorityError - The highest priority error detected for this cluster.
 * @returns A constructed Paper component summarizing the cluster's state.
 */
function FullWidthClusterCard({
  cluster,
  machines,
  machineDeployments,
  machinePools,
  kcps,
  priorityError,
}: {
  cluster: any;
  machines: any[];
  machineDeployments: any[];
  machinePools: any[];
  machineSets: any[];
  kcps: any[];
  priorityError: ClusterPriorityError | null;
}) {
  const theme = useTheme();
  const [solutionOpen, setSolutionOpen] = React.useState(false);

  const clusterMachines = machines.filter(
    m => m.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] === cluster.metadata.name
  );
  const clusterMDs = machineDeployments.filter(
    md => md.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] === cluster.metadata.name
  );
  const clusterPools = machinePools.filter(
    pool => pool.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] === cluster.metadata.name
  );

  const cpStatus = cluster.controlPlaneStatus;
  const workersStatus = cluster.workerStatus;

  const poolDesired = clusterPools.reduce((s: number, p: any) => s + (p.spec?.replicas || 0), 0);
  const poolReady = clusterPools.reduce(
    (s: number, p: any) => s + (p.status?.readyReplicas || 0),
    0
  );

  const totalDesired =
    (cpStatus?.desiredReplicas || 0) + (workersStatus?.desiredReplicas || 0) + poolDesired;
  const totalReady =
    (cpStatus?.readyReplicas || 0) + (workersStatus?.readyReplicas || 0) + poolReady;

  const provider = getInfrastructureProvider(cluster);
  const blueprint = cluster.spec?.topology?.classRef?.name || cluster.spec?.topology?.class || '-';
  const healthy = priorityError === null;
  const version = cluster.spec?.topology?.version || '-';
  const displayVersion =
    version !== '-' ? (version.startsWith('v') ? version : `v${version}`) : '-';
  const bootstrapKind = getBootstrapKind(cluster, machineDeployments, kcps);
  const controlPlaneKind = cluster.spec?.controlPlaneRef?.kind || '-';
  const runningMachines = clusterMachines.filter(m => m.status?.phase === 'Running').length;
  const failingConditions = priorityError
    ? getDisplayableErrorConditions(priorityError.resource).slice(0, 3)
    : [];
  const issueCount = failingConditions.length;
  const healthPercent = healthy ? 100 : totalDesired > 0 ? (totalReady / totalDesired) * 100 : 0;

  // All colour is now a CSS variable string — no MUI theme needed.
  const statusColor = healthy
    ? theme.palette.success.main
    : getSeverityColor(theme, priorityError?.errorDef.severity);

  const statItems = [
    {
      label: 'Control Plane',
      value: `${cpStatus?.readyReplicas || 0}/${cpStatus?.desiredReplicas || 0}`,
      sub: controlPlaneKind,
      ok:
        (cpStatus?.desiredReplicas || 0) > 0 &&
        cpStatus?.readyReplicas === cpStatus?.desiredReplicas,
      icon: 'mdi:cog-outline',
    },
    {
      label: 'Workers',
      value: `${workersStatus?.readyReplicas || 0}/${workersStatus?.desiredReplicas || 0}`,
      sub: `${clusterMDs.length} deployment${clusterMDs.length !== 1 ? 's' : ''}`,
      ok:
        (workersStatus?.desiredReplicas || 0) > 0 &&
        workersStatus?.readyReplicas === workersStatus?.desiredReplicas,
      icon: 'mdi:server-network',
    },
    {
      label: 'Machine Pools',
      value: `${poolReady}/${poolDesired}`,
      sub: `${clusterPools.length} pool${clusterPools.length !== 1 ? 's' : ''}`,
      ok: poolDesired === 0 || poolReady === poolDesired,
      icon: 'mdi:layers-triple-outline',
    },
    {
      label: 'Machines',
      value: `${clusterMachines.length}`,
      sub: `${runningMachines} running`,
      ok: clusterMachines.length === 0 || runningMachines === clusterMachines.length,
      icon: 'mdi:server',
    },
    {
      label: 'Bootstrap',
      value: bootstrapKind,
      sub: 'bootstrap type',
      ok: bootstrapKind !== '-',
      icon: 'mdi:package-variant-closed',
    },
    {
      label: 'Issues',
      value: `${issueCount}`,
      sub: healthy ? 'cluster healthy' : issueCount === 1 ? '1 issue' : `${issueCount} issues`,
      ok: healthy,
      icon: 'mdi:alert-circle-outline',
    },
  ];

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0 }}>
            {/* Health ring */}
            <LightTooltip title={`${totalReady}/${totalDesired} replicas ready`} interactive>
              <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={62}
                  thickness={4}
                  sx={{ color: theme.palette.divider, position: 'absolute' }}
                />
                <CircularProgress
                  variant="determinate"
                  value={healthPercent}
                  size={62}
                  thickness={4}
                  sx={{ color: statusColor }}
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
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: statusColor }}>
                    {Math.round(healthPercent)}%
                  </Typography>
                </Box>
              </Box>
            </LightTooltip>

            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link kubeObject={cluster}>{cluster.metadata.name}</Link>
                <Chip label={provider} size="small" variant="outlined" />
                {renderClusterHealthStatus(healthy, priorityError)}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.75 }}>
                <Chip
                  icon={<Icon icon="mdi:kubernetes" width="14px" height="14px" />}
                  label={displayVersion}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', '.MuiChip-icon': { ml: 0.5 } }}
                />
                <Chip
                  label={`Class: ${blueprint}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                <Chip
                  label={`Namespace: ${cluster.metadata.namespace || '-'}`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Chip label={`${clusterMDs.length} Deployments`} size="small" variant="outlined" />
            {clusterPools.length > 0 && (
              <Chip label={`${clusterPools.length} Pools`} size="small" variant="outlined" />
            )}
          </Box>
        </Box>

        {/* Stat grid */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {statItems.map((item, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.6,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'text.secondary',
                    }}
                  >
                    <Icon icon={item.icon} width="13px" height="13px" />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                  {/* Ready indicator dot */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: item.ok ? theme.palette.success.main : theme.palette.warning.main,
                    }}
                  />
                </Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '1rem',
                    fontFamily: '"JetBrains Mono", monospace',
                    color: 'text.primary',
                  }}
                >
                  {item.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.sub}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Failing condition chips */}
        {failingConditions.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: priorityError ? 2 : 0 }}>
            {failingConditions.map((condition: any) => (
              <LightTooltip
                key={condition.type}
                title={
                  <Box sx={{ minWidth: 250, maxWidth: 400, p: 0.5 }}>
                    <MetadataDictGrid
                      dict={{
                        Condition: condition.type,
                        Reason: condition.reason || 'Unknown',
                        Message: condition.message || '-',
                      }}
                      gridProps={{
                        direction: 'column',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start',
                        spacing: 1,
                      }}
                    />
                  </Box>
                }
                interactive
              >
                <StatusLabel
                  status={
                    priorityError
                      ? getStatusLabelStateForSeverity(priorityError.errorDef.severity)
                      : 'warning'
                  }
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {condition.type}
                </StatusLabel>
              </LightTooltip>
            ))}
          </Box>
        )}

        {priorityError && (
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              overflow: 'hidden',
            }}
          >
            <Box
              onClick={() => setSolutionOpen(prev => !prev)}
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.25,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Icon
                icon={
                  priorityError.errorDef.severity === 'critical'
                    ? 'mdi:alert-circle-outline'
                    : 'mdi:alert-outline'
                }
                width="18px"
                height="18px"
                style={{ color: statusColor, marginTop: 2 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}
                >
                  <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {priorityError.errorDef.title}
                  </Typography>
                  {priorityError.conditionType && (
                    <StatusLabel
                      status={
                        getStatusLabelStateForSeverity(priorityError.errorDef.severity) || 'warning'
                      }
                      sx={{ fontWeight: 600 }}
                    >
                      {priorityError.conditionType}
                    </StatusLabel>
                  )}
                  <StatusLabel
                    status={
                      getStatusLabelStateForSeverity(priorityError.errorDef.severity) || 'warning'
                    }
                    sx={{ fontWeight: 700 }}
                  >
                    {priorityError.errorDef.severity.toUpperCase()}
                  </StatusLabel>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {priorityError.message || 'Open for guidance and suggested remediation.'}
                </Typography>
              </Box>
              <Button
                size="small"
                sx={{ textTransform: 'none' }}
                endIcon={
                  <Icon
                    icon={solutionOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                    width="14px"
                    height="14px"
                  />
                }
              >
                {solutionOpen ? 'Hide fix' : 'Show fix'}
              </Button>
            </Box>
            <InlineSolutionPanel priorityError={priorityError} open={solutionOpen} />
          </Paper>
        )}
      </Box>
    </Paper>
  );
}
/**
 * The main component that renders a list of detailed cards for all clusters
 * in the current environment, highlighting critical errors and health states.
 *
 * @param props - Component properties.
 * @param props.clusters - Array of all Cluster resources.
 * @param props.machines - Array of all Machine resources.
 * @param props.machineDeployments - Array of all MachineDeployment resources.
 * @param props.machinePools - Array of all MachinePool resources.
 * @param props.machineSets - Array of all MachineSet resources.
 * @param props.kcps - Array of all KubeadmControlPlane resources.
 * @param props.resourcesData - Mapping of resource class names to arrays of resource items.
 * @returns A container rendering individual cluster cards.
 */
export default function ClusterDetailsErrorOverview({
  clusters,
  machines,
  machineDeployments,
  machinePools,
  machineSets,
  kcps,
  resourcesData,
}: ClusterDetailsErrorOverviewProps) {
  const [clusterFilter, setClusterFilter] = React.useState('');

  useEffect(() => {
    if (!clusters.length) return;
    const hasSelected = clusters.some(c => c.metadata.name === clusterFilter);
    if (!hasSelected) setClusterFilter(clusters[0].metadata.name);
  }, [clusters, clusterFilter]);

  const allResourcesForMatching = useMemo(
    () => Object.entries(resourcesData).map(([className, items]) => ({ className, items })),
    [resourcesData]
  );

  const clusterPriorityErrors = useMemo(() => {
    const result: Record<string, ClusterPriorityError | null> = {};
    clusters.forEach(cluster => {
      result[cluster.metadata.uid] = getPriorityErrorForCluster(cluster, allResourcesForMatching);
    });
    return result;
  }, [clusters, allResourcesForMatching]);

  const displayedClusters = useMemo(
    () => clusters.filter(c => c.metadata.name === clusterFilter),
    [clusters, clusterFilter]
  );

  return (
    <SectionBox
      title={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            flexWrap: 'wrap',
            gap: 1.5,
            padding: '16px',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Clusters
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Per-cluster health and remediation details.
            </Typography>
          </Box>
          <Select
            size="small"
            value={clusterFilter}
            onChange={e => setClusterFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {clusters.map(cluster => (
              <MenuItem key={cluster.metadata.uid} value={cluster.metadata.name}>
                {cluster.metadata.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      }
    >
      <Grid container spacing={2.5}>
        {displayedClusters.map(cluster => (
          <Grid item xs={12} key={cluster.metadata.uid}>
            <FullWidthClusterCard
              cluster={cluster}
              machines={machines}
              machineDeployments={machineDeployments}
              machinePools={machinePools}
              machineSets={machineSets}
              kcps={kcps}
              priorityError={clusterPriorityErrors[cluster.metadata.uid] ?? null}
            />
          </Grid>
        ))}

        {displayedClusters.length === 0 && (
          <Grid item xs={12}>
            <EmptyContent>No clusters match the selected filter.</EmptyContent>
          </Grid>
        )}
      </Grid>
    </SectionBox>
  );
}
