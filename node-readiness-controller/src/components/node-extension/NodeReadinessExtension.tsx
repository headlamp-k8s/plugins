import {
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { NodeReadinessEvaluation, type RuleEvaluation } from '../../resources';
import {
  getActiveTaints,
  getEvaluationStateInfo,
  getEvaluationSummary,
  nrcRouteNames,
} from '../../utils';

export interface NodeReadinessExtensionProps {
  /** The Kubernetes Node resource passed by Headlamp's details view section processor. */
  node?: any;
}

/**
 * Node Details Extension component injected into Headlamp's native Node details view.
 * Sourced from the node's NodeReadinessEvaluation custom resource, providing inline visibility
 * into readiness lifecycle state, rule satisfaction, and active NRC taints gating the node.
 *
 * Conforms strictly to Design Doc §5.6:
 * - Silent Omission (null return) if NRE CRD is missing (404), forbidden (403), or node unmanaged.
 * - Summary Bar with State, Active Taints ('None' or outlined chips), and 'View Full Evaluation' CTA.
 * - Rules Table rendered using Headlamp's SimpleTable with columns: Rule Name, Enforcement Mode, Status, Taint, Reason.
 */
export default function NodeReadinessExtension({ node }: NodeReadinessExtensionProps) {
  const nodeName =
    typeof node?.getName === 'function' ? node.getName() : node?.metadata?.name || '';
  const cluster = typeof node === 'object' ? node?.cluster : undefined;

  // Silently omit if no valid node name can be determined
  if (!nodeName) {
    return null;
  }

  return <NodeReadinessLookup nodeName={nodeName} cluster={cluster} />;
}

interface NodeReadinessLookupProps {
  nodeName: string;
  cluster?: string;
}

function NodeReadinessLookup({ nodeName, cluster }: NodeReadinessLookupProps) {
  const [evaluation, evaluationError] = NodeReadinessEvaluation.useGet(
    nodeName,
    undefined,
    cluster ? { cluster } : undefined
  );

  // Design Doc §5.6: Silently return null while loading, or if NRE is missing (404) / forbidden (403)
  // Avoids flashing an empty skeleton section and shifting Node Events on clusters without NRE or unmanaged nodes
  if (evaluationError || !evaluation) {
    return null;
  }

  const state = evaluation.state ?? evaluation.status?.state;
  const stateInfo = getEvaluationStateInfo(state);
  const summary = getEvaluationSummary(evaluation);
  const rules = evaluation.rules ?? evaluation.status?.rules ?? [];

  // Identify taints currently enforced by NRC rules on this node (de-duplicated across rules)
  const activeTaints = getActiveTaints(rules);

  return (
    <SectionBox title="Node Readiness Lifecycle">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Summary Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            {/* Readiness State */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                State:
              </Typography>
              <StatusLabel status={stateInfo.severity}>
                {summary.isPending ? 'Evaluation in progress' : stateInfo.label}
              </StatusLabel>
            </Box>

            {/* Rules Status Ratio */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Rules Status:
              </Typography>
              <StatusLabel status={summary.statusSeverity}>{summary.statusLabel}</StatusLabel>
            </Box>

            {/* Active Taints */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Active Taints:
              </Typography>
              {activeTaints.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {activeTaints.map(t => (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      color="warning"
                      variant="outlined"
                      aria-label={`Active taint: ${t}`}
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  None
                </Typography>
              )}
            </Box>
          </Box>

          <Link
            routeName={nrcRouteNames.evaluationDetail}
            params={{ name: nodeName }}
            activeCluster={cluster}
            aria-label={`View full evaluation report for ${nodeName}`}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.main',
              color: 'primary.main',
              fontSize: '0.8125rem',
              fontWeight: 500,
              lineHeight: 1.75,
              textDecoration: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 250ms, border-color 250ms',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'primary.main',
                textDecoration: 'none',
              },
            }}
          >
            View Full Evaluation
          </Link>
        </Box>

        {/* Rules Table conforming to Design Doc §5.6 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
            Readiness Rules ({rules.length})
          </Typography>

          <SimpleTable
            columns={[
              {
                label: 'Rule Name',
                getter: (r: RuleEvaluation) => (
                  <Link
                    routeName={nrcRouteNames.ruleDetail}
                    params={{ name: r.ruleName }}
                    activeCluster={cluster}
                    aria-label={`View rule details for ${r.ruleName}`}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {r.ruleName}
                    </Typography>
                  </Link>
                ),
              },
              {
                label: 'Enforcement Mode',
                getter: (r: RuleEvaluation) => (
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {r.enforcementMode || '—'}
                  </Typography>
                ),
              },
              {
                label: 'Status',
                getter: (r: RuleEvaluation) => {
                  const isSatisfied = r.ruleStatus === 'Satisfied' || r.status === 'Satisfied';
                  return (
                    <StatusLabel status={isSatisfied ? 'success' : 'warning'}>
                      {r.ruleStatus || (isSatisfied ? 'Satisfied' : 'Unsatisfied')}
                    </StatusLabel>
                  );
                },
              },
              {
                label: 'Taint',
                getter: (r: RuleEvaluation) => {
                  const isPresent = r.taintStatus === 'Present';
                  const taintDesc = r.taintKey
                    ? `${r.taintKey}:${r.taintEffect || 'NoSchedule'}`
                    : undefined;
                  return isPresent ? (
                    <Chip
                      label={taintDesc || 'Taint Present'}
                      size="small"
                      color="warning"
                      variant="outlined"
                      aria-label={`Taint active: ${taintDesc || 'Present'}`}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  );
                },
              },
              {
                label: 'Reason',
                getter: (r: RuleEvaluation) => {
                  const text = r.message || r.reason;
                  if (!text) {
                    return (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    );
                  }
                  return (
                    <Tooltip title={text} arrow>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        tabIndex={0}
                        aria-label={`Evaluation reason: ${text}`}
                        sx={{
                          maxWidth: '260px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'help',
                        }}
                      >
                        {text}
                      </Typography>
                    </Tooltip>
                  );
                },
              },
            ]}
            data={rules}
            emptyMessage="No readiness rules currently evaluated for this node."
          />
        </Box>
      </Box>
    </SectionBox>
  );
}
