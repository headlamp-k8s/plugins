import { Icon } from '@iconify/react';
import {
  DateLabel,
  Link,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Divider, Typography } from '@mui/material';
import React from 'react';
import type { ReadinessConditionEvaluation, RuleEvaluation } from '../../resources';
import { getConditionEvaluationStatus, getRuleDurationInfo, nrcRouteNames } from '../../utils';

export interface EvaluationRuleDrawerProps {
  /** Rule evaluation record rendered inside the expanded accordion drawer. */
  rule: RuleEvaluation;
  /** Optional cluster name for multi-cluster rule link routing. */
  activeCluster?: string;
}

interface TimestampEntry {
  label: string;
  value?: string;
  alwaysShow?: boolean;
}

/**
 * Renders the lifecycle timestamps grid for a single rule evaluation.
 */
function RuleLifecycleTimestamps({ rule }: { rule: RuleEvaluation }) {
  const entries: TimestampEntry[] = [
    { label: 'First Evaluated At:', value: rule.firstEvaluatedAt, alwaysShow: true },
    { label: 'Last Evaluated At:', value: rule.lastEvaluatedAt, alwaysShow: true },
    { label: 'Taint Observed At:', value: rule.taintObservedAt },
    { label: 'Taint Added At:', value: rule.taintAddedAt },
    { label: 'Taint Removed At:', value: rule.taintRemovedAt },
  ].filter(entry => entry.alwaysShow || Boolean(entry.value));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Lifecycle Timestamps
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 1.5,
        }}
      >
        {entries.map(entry => (
          <Box
            key={entry.label}
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {entry.label}
            </Typography>
            <Typography variant="body2" component="div">
              {entry.value ? <DateLabel date={entry.value} /> : '—'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Renders the nested condition-by-condition breakdown table for a rule evaluation.
 */
function RuleConditionsBreakdown({ rule }: { rule: RuleEvaluation }) {
  const conditions = rule.readinessConditions || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 600 }}>
        Readiness Conditions Breakdown ({conditions.length})
      </Typography>

      <SimpleTable
        columns={[
          {
            label: 'Condition Type',
            getter: (c: ReadinessConditionEvaluation) => (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {c.type}
              </Typography>
            ),
          },
          {
            label: 'Satisfied',
            getter: (c: ReadinessConditionEvaluation) => {
              const status = getConditionEvaluationStatus(
                c,
                rule.ruleStatus || rule.status,
                rule.conditionPolicy
              );
              const severity =
                status === 'Satisfied' ? 'success' : status === 'Unsatisfied' ? 'error' : 'warning';
              return <StatusLabel status={severity}>{status}</StatusLabel>;
            },
          },
          {
            label: 'Current Status',
            getter: (c: ReadinessConditionEvaluation) => (
              <Typography variant="body2">{c.currentStatus}</Typography>
            ),
          },
          {
            label: 'Required Status',
            getter: (c: ReadinessConditionEvaluation) => (
              <Typography variant="body2">{c.requiredStatus}</Typography>
            ),
          },
          {
            label: 'Default Status',
            getter: (c: ReadinessConditionEvaluation) => (
              <Typography variant="body2" color="text.secondary">
                {c.defaultStatus || 'Unknown (implicit)'}
              </Typography>
            ),
          },
        ]}
        data={conditions}
        emptyMessage="No conditions defined for this rule."
      />
    </Box>
  );
}

/**
 * Expanded accordion drawer content displaying rule diagnostics, duration metrics,
 * lifecycle timestamps, and the nested condition evaluation breakdown.
 */
export default function EvaluationRuleDrawer({ rule, activeCluster }: EvaluationRuleDrawerProps) {
  const isSatisfied = rule.ruleStatus === 'Satisfied' || rule.status === 'Satisfied';
  const durationInfo = getRuleDurationInfo(rule);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Diagnostics & Duration Metrics Card */}
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            {durationInfo && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {durationInfo.label}
                </Typography>
                <Chip
                  label={durationInfo.text}
                  size="small"
                  color={durationInfo.label.includes('Unblock') ? 'success' : 'warning'}
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            )}

            {rule.reason && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Reason:
                </Typography>
                <Chip
                  label={rule.reason}
                  size="small"
                  variant="outlined"
                  color={isSatisfied ? 'default' : 'warning'}
                  sx={{ fontWeight: 500 }}
                />
              </Box>
            )}
          </Box>

          <Link
            routeName={nrcRouteNames.ruleDetail}
            params={{ name: rule.ruleName }}
            activeCluster={activeCluster}
            aria-label={`Visit rule ${rule.ruleName}`}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'primary.main',
                textDecoration: 'underline',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              Visit rule
              <Icon icon="mdi:open-in-new" width="14" />
            </Typography>
          </Link>
        </Box>

        {rule.message && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 0.5,
                letterSpacing: 0.5,
              }}
            >
              Message:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>
              {rule.message}
            </Typography>
          </Box>
        )}
      </Box>
      {/* End Diagnostics & Duration Metrics Card */}

      <RuleLifecycleTimestamps rule={rule} />

      <Divider />

      <RuleConditionsBreakdown rule={rule} />
    </Box>
  );
}
