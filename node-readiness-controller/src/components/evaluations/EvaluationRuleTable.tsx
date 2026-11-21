import { Icon } from '@iconify/react';
import {
  DateLabel,
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import type { ReadinessConditionEvaluation, RuleEvaluation } from '../../resources';
import { getConditionEvaluationStatus, getRuleDurationInfo, nrcRouteNames } from '../../utils';

export interface EvaluationRuleTableProps {
  /** Array of rule evaluation records for this node. */
  rules?: RuleEvaluation[];
}

/**
 * Renders an expandable list of rules evaluated for this node conforming to Design Doc §5.5:
 * Each rule has a top-level summary row (Rule Name + Visit CTA, Enforcement Mode, Status, Taint presence, Conditions ratio),
 * and an expandable inspection drawer detailing diagnostics, unblock/blocked durations, lifecycle timestamps,
 * and a nested condition-by-condition evaluation breakdown table.
 */
export default function EvaluationRuleTable({ rules = [] }: EvaluationRuleTableProps) {
  const [expandedRule, setExpandedRule] = useState<string | false>(false);

  const handleAccordionChange =
    (ruleName: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedRule(isExpanded ? ruleName : false);
    };

  if (rules.length === 0) {
    return (
      <SectionBox title="Rule Evaluations">
        <Typography variant="body2" color="text.secondary">
          No rules evaluated for this node yet.
        </Typography>
      </SectionBox>
    );
  }

  return (
    <SectionBox title="Rule Evaluations">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {rules.map((r: RuleEvaluation) => {
          const isSatisfied = r.ruleStatus === 'Satisfied' || r.status === 'Satisfied';
          const isPresent = r.taintStatus === 'Present';
          const taintDesc = r.taintKey
            ? `${r.taintKey}:${r.taintEffect || 'NoSchedule'}`
            : undefined;

          const conditions = r.readinessConditions || [];
          const satisfiedConditions = conditions.filter(
            c =>
              getConditionEvaluationStatus(c, r.ruleStatus || r.status, r.conditionPolicy) ===
              'Satisfied'
          ).length;
          const conditionsRatio = `${satisfiedConditions}/${conditions.length}`;
          const isAllConditionsSatisfied =
            conditions.length > 0 && satisfiedConditions === conditions.length;
          const durationInfo = getRuleDurationInfo(r);

          return (
            <Accordion
              key={r.ruleName}
              expanded={expandedRule === r.ruleName}
              onChange={handleAccordionChange(r.ruleName)}
              disableGutters
              variant="outlined"
              sx={{
                borderRadius: 1,
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              <AccordionSummary
                expandIcon={<Icon icon="mdi:chevron-down" width="20" />}
                aria-controls={`rule-eval-${r.ruleName}-content`}
                id={`rule-eval-${r.ruleName}-header`}
                sx={{
                  bgcolor: 'background.default',
                  px: 2,
                  py: 1,
                  '& .MuiAccordionSummary-content': {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    m: 0,
                  },
                }}
              >
                {/* Column 1: Rule Name */}
                <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.ruleName}
                  </Typography>
                </Box>

                {/* Column 2: Enforcement Mode */}
                <Box sx={{ minWidth: '110px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Enforcement
                  </Typography>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {r.enforcementMode || '—'}
                  </Typography>
                </Box>

                {/* Column 3: Status */}
                <Box sx={{ minWidth: '90px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Status
                  </Typography>
                  <StatusLabel status={isSatisfied ? 'success' : 'warning'}>
                    {r.ruleStatus || (isSatisfied ? 'Satisfied' : 'Unsatisfied')}
                  </StatusLabel>
                </Box>

                {/* Column 4: Taint */}
                <Box sx={{ minWidth: '130px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Taint
                  </Typography>
                  {isPresent ? (
                    <Chip
                      label={taintDesc || 'Taint Present'}
                      size="small"
                      color="warning"
                      variant="outlined"
                      aria-label={`Active taint: ${taintDesc || 'Present'}`}
                      sx={{ fontWeight: 500 }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>

                {/* Column 5: Conditions Satisfaction Ratio */}
                <Box sx={{ minWidth: '120px' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Conditions
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StatusLabel status={isAllConditionsSatisfied ? 'success' : 'warning'}>
                      {conditionsRatio}
                    </StatusLabel>
                    {r.conditionPolicy === 'anyOf' && (
                      <Typography variant="caption" color="text.secondary">
                        [anyOf]
                      </Typography>
                    )}
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails
                sx={{
                  p: 2.5,
                  bgcolor: 'background.default',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Diagnostics & Duration Metrics */}
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

                        {r.reason && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontWeight: 600 }}
                            >
                              Reason:
                            </Typography>
                            <Chip
                              label={r.reason}
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
                        params={{ name: r.ruleName }}
                        aria-label={`Visit rule ${r.ruleName}`}
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

                    {r.message && (
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
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.825rem' }}
                        >
                          {r.message}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Lifecycle Timestamps Grid */}
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
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          First Evaluated At:
                        </Typography>
                        <Typography variant="body2" component="div">
                          {r.firstEvaluatedAt ? <DateLabel date={r.firstEvaluatedAt} /> : '—'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          Last Evaluated At:
                        </Typography>
                        <Typography variant="body2" component="div">
                          {r.lastEvaluatedAt ? <DateLabel date={r.lastEvaluatedAt} /> : '—'}
                        </Typography>
                      </Box>
                      {r.taintObservedAt && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Taint Observed At:
                          </Typography>
                          <Typography variant="body2" component="div">
                            <DateLabel date={r.taintObservedAt} />
                          </Typography>
                        </Box>
                      )}
                      {r.taintAddedAt && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Taint Added At:
                          </Typography>
                          <Typography variant="body2" component="div">
                            <DateLabel date={r.taintAddedAt} />
                          </Typography>
                        </Box>
                      )}
                      {r.taintRemovedAt && (
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            Taint Removed At:
                          </Typography>
                          <Typography variant="body2" component="div">
                            <DateLabel date={r.taintRemovedAt} />
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Divider />

                  {/* Nested Per-Condition Evaluation Table */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 600 }}>
                      Readiness Conditions Breakdown ({conditions.length})
                    </Typography>

                    <Box
                      sx={{
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        bgcolor: 'background.paper',
                      }}
                    >
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
                                r.ruleStatus || r.status,
                                r.conditionPolicy
                              );
                              const severity =
                                status === 'Satisfied'
                                  ? 'success'
                                  : status === 'Unsatisfied'
                                  ? 'error'
                                  : 'warning';
                              return <StatusLabel status={severity}>{status}</StatusLabel>;
                            },
                          },
                          {
                            label: 'Current Status',
                            getter: (c: ReadinessConditionEvaluation) => {
                              const severity =
                                c.currentStatus === 'True'
                                  ? 'success'
                                  : c.currentStatus === 'False'
                                  ? 'error'
                                  : 'warning';
                              return <StatusLabel status={severity}>{c.currentStatus}</StatusLabel>;
                            },
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
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </SectionBox>
  );
}
