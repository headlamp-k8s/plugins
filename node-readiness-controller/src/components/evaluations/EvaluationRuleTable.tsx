import { Icon } from '@iconify/react';
import { SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import type { RuleEvaluation } from '../../resources';
import { getConditionEvaluationStatus } from '../../utils';
import EvaluationRuleDrawer from './EvaluationRuleDrawer';

export interface EvaluationRuleTableProps {
  /** Array of rule evaluation records for this node. */
  rules?: RuleEvaluation[];
  /** Cluster name of the parent evaluation resource for multi-cluster link routing. */
  activeCluster?: string;
}

/**
 * Renders an expandable list of rules evaluated for this node conforming to Design Doc §5.5:
 * Each rule has a top-level summary row (Rule Name, Enforcement Mode, Status, Taint presence, Conditions ratio),
 * and an expandable inspection drawer rendered by EvaluationRuleDrawer.
 */
export default function EvaluationRuleTable({
  rules = [],
  activeCluster,
}: EvaluationRuleTableProps) {
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
          const isConditionsRequirementMet =
            conditions.length > 0 &&
            (r.conditionPolicy === 'anyOf'
              ? satisfiedConditions >= 1
              : satisfiedConditions === conditions.length);

          return (
            <Accordion
              key={r.ruleName}
              expanded={expandedRule === r.ruleName}
              onChange={handleAccordionChange(r.ruleName)}
              disableGutters
              variant="outlined"
              slotProps={{ transition: { unmountOnExit: true } }}
              sx={{
                borderRadius: 1,
                '&:before': { display: 'none' },
                overflow: 'hidden',
              }}
            >
              {/* Rule Summary Header */}
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
                    <StatusLabel status={isConditionsRequirementMet ? 'success' : 'warning'}>
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
              {/* End Rule Summary Header */}

              {/* Expanded Evaluation Details Drawer */}
              <AccordionDetails
                id={`rule-eval-${r.ruleName}-content`}
                sx={{
                  p: 2.5,
                  bgcolor: 'background.default',
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <EvaluationRuleDrawer rule={r} activeCluster={activeCluster} />
              </AccordionDetails>
              {/* End Expanded Evaluation Details Drawer */}
            </Accordion>
          );
        })}
      </Box>
    </SectionBox>
  );
}
