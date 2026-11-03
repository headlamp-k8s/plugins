import {
  Link,
  ResourceListView,
  SectionBox,
  StatusLabel,
  useThrottle,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import { NodeReadinessEvaluation } from '../../resources';
import {
  getActiveTaints,
  getEvaluationStateInfo,
  getEvaluationSummary,
  normalizeListResult,
  nrcRouteNames,
  resolveCrdErrorState,
} from '../../utils';
import { type NodeAuthController, useCanGetNodes } from '../../utils/useCanGetNodes';
import { CrdNotInstalled } from '../common';

function EvaluationNameCell({
  evalItem,
  nodeAuth,
}: {
  evalItem: NodeReadinessEvaluation;
  nodeAuth: NodeAuthController;
}) {
  const name = evalItem.metadata?.name || '';
  const targetNode = evalItem.nodeName || name;
  const cluster = evalItem.cluster;

  const canViewNode = useSyncExternalStore(
    nodeAuth.subscribe,
    () => nodeAuth.canGetNode(cluster, targetNode),
    () => false
  );

  useEffect(() => {
    if (!canViewNode && targetNode) {
      nodeAuth.requestNodeAuth(cluster, targetNode);
    }
  }, [canViewNode, cluster, nodeAuth, targetNode]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Tooltip title={name}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '220px',
          }}
        >
          <Link
            routeName={nrcRouteNames.evaluationDetail}
            params={{ name }}
            activeCluster={cluster}
            aria-label={`View readiness evaluation for ${name}`}
          >
            {name}
          </Link>
        </Typography>
      </Tooltip>
      {canViewNode && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
          <Link
            routeName="node"
            params={{ name: targetNode }}
            activeCluster={cluster}
            aria-label={`View Kubernetes node ${targetNode}`}
          >
            View Node ({targetNode})
          </Link>
        </Typography>
      )}
    </Box>
  );
}

/**
 * Cluster-level list view component displaying all NodeReadinessEvaluation custom resources.
 * Renders a canonical Headlamp ResourceListView table showing node name, overall readiness state,
 * rule satisfaction ratio, and creation age, conforming to Design Doc §5.4.
 *
 * @returns Rendered JSX ResourceListView component.
 */
export default function EvaluationList() {
  const listResult = NodeReadinessEvaluation.useList();
  const {
    items: evaluations,
    errors: evaluationsErrors,
    isLoading,
    hasAnyClusterSuccess,
  } = normalizeListResult<NodeReadinessEvaluation>(listResult);
  const throttledEvaluations = useThrottle(evaluations, 1000);

  const clusters = useMemo(
    () =>
      Array.isArray(throttledEvaluations) ? throttledEvaluations.map(item => item.cluster) : [],
    [throttledEvaluations]
  );
  const nodeAuth = useCanGetNodes(clusters);

  const columns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        getValue: (evalItem: NodeReadinessEvaluation) => evalItem.metadata?.name || '',
        render: (evalItem: NodeReadinessEvaluation) => (
          <EvaluationNameCell evalItem={evalItem} nodeAuth={nodeAuth} />
        ),
      },
      {
        id: 'state',
        label: 'State',
        filterVariant: 'select' as const,
        filterSelectOptions: [
          { label: 'Available', value: 'Available' },
          { label: 'NotAvailable', value: 'NotAvailable' },
          { label: 'Pending', value: 'Pending' },
        ],
        getValue: (evalItem: NodeReadinessEvaluation) => evalItem.state || 'Pending',
        render: (evalItem: NodeReadinessEvaluation) => {
          const stateInfo = getEvaluationStateInfo(evalItem.state);
          return <StatusLabel status={stateInfo.severity}>{stateInfo.label}</StatusLabel>;
        },
      },
      {
        id: 'rulesStatus',
        label: 'Rules Status',
        filterVariant: 'select' as const,
        filterSelectOptions: [
          { label: 'OK (All Satisfied)', value: 'OK' },
          { label: 'Not Ready', value: 'Not Ready' },
          { label: 'No Rules Applicable', value: 'No Rules Applicable' },
          { label: 'Pending', value: 'Pending' },
        ],
        getValue: (evalItem: NodeReadinessEvaluation) => {
          const summary = getEvaluationSummary(evalItem);
          if (summary.isPending) return 'Pending';
          if (summary.total === 0) return 'No Rules Applicable';
          return summary.satisfied === summary.total ? 'OK' : 'Not Ready';
        },
        render: (evalItem: NodeReadinessEvaluation) => {
          const summary = getEvaluationSummary(evalItem);
          return <StatusLabel status={summary.statusSeverity}>{summary.statusLabel}</StatusLabel>;
        },
      },
      {
        id: 'activeTaints',
        label: 'Active Taints',
        getValue: (evalItem: NodeReadinessEvaluation) => {
          const activeTaints = getActiveTaints(evalItem.rules ?? evalItem.status?.rules ?? []);
          return activeTaints.length > 0 ? activeTaints.join(', ') : 'None';
        },
        render: (evalItem: NodeReadinessEvaluation) => {
          const activeTaints = getActiveTaints(evalItem.rules ?? evalItem.status?.rules ?? []);
          if (activeTaints.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                None
              </Typography>
            );
          }

          const visibleTaints = activeTaints.slice(0, 2);
          const hiddenCount = activeTaints.length - visibleTaints.length;
          const hiddenTaintsList = activeTaints.slice(2).join(', ');

          return (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              {visibleTaints.map(taint => (
                <Chip
                  key={taint}
                  label={taint}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              ))}
              {hiddenCount > 0 && (
                <Tooltip title={hiddenTaintsList}>
                  <Chip
                    label={`+${hiddenCount} more`}
                    size="small"
                    variant="outlined"
                    tabIndex={0}
                    aria-label={`${hiddenCount} additional active taint${
                      hiddenCount > 1 ? 's' : ''
                    }: ${hiddenTaintsList}`}
                    sx={{ fontWeight: 500 }}
                  />
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      'age' as const,
    ],
    [nodeAuth]
  );

  const crdErrorState = resolveCrdErrorState(
    evaluationsErrors,
    {
      resourceName: 'NodeReadinessEvaluation',
      forbiddenTitle: 'Permission Denied: Cannot Read Node Readiness Evaluations',
      forbiddenDescription:
        'Your Kubernetes user or service account lacks read permissions for readiness.node.x-k8s.io/nodereadinessevaluations.',
      mixedTitle: 'Node Readiness Evaluations Unavailable',
      mixedDescription:
        'Selected clusters either lack NodeReadinessEvaluation CRDs or your user lacks read permissions for readiness.node.x-k8s.io/nodereadinessevaluations.',
      notFoundTitle: 'NodeReadinessEvaluation CRD Not Installed',
      notFoundDescription:
        'NodeReadinessEvaluation CRDs are not installed on this cluster. This feature requires a release of Node Readiness Controller with NRE support enabled (v0.7.0+).',
    },
    { isLoading, hasAnyClusterSuccess }
  );

  if (crdErrorState) {
    return (
      <SectionBox title="Node Readiness Evaluations">
        <CrdNotInstalled
          isForbidden={crdErrorState.isForbidden}
          resourceName="NodeReadinessEvaluation"
          title={crdErrorState.title}
          description={crdErrorState.description}
        />
      </SectionBox>
    );
  }

  return (
    <ResourceListView
      title="Node Readiness Evaluations"
      data={throttledEvaluations}
      errors={evaluationsErrors}
      id="nrc-node-evaluations"
      headerProps={{ titleSideActions: [] }}
      enableRowActions={false}
      enableRowSelection={false}
      columns={columns}
    />
  );
}
