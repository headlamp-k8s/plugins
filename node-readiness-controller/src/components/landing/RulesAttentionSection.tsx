import { Icon } from '@iconify/react';
import { Box, Card, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import type { RuleLike } from '../../utils';
import { getRuleStats, isFreshRule, isRulePendingSync } from '../../utils';
import AttentionRuleCard from './AttentionRuleCard';

interface AttentionRule extends RuleLike {
  metadata: { name: string; generation?: number };
}

interface RulesAttentionSectionProps {
  /** Total number of rules in the cluster. */
  totalRules: number;
  /** Rules that have been identified as needing operator attention. */
  rulesNeedingAttention: AttentionRule[];
  /** Callback to navigate to a specific rule detail page. */
  onRuleClick: (ruleName: string) => void;
}

/**
 * Section displaying rules that require operator attention.
 * Shows empty state, all-healthy state, or a grid of attention cards.
 */
export default function RulesAttentionSection({
  totalRules,
  rulesNeedingAttention,
  onRuleClick,
}: RulesAttentionSectionProps) {
  const theme = useTheme();

  return (
    <Box mt={4}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Rules Requiring Attention
      </Typography>

      {totalRules === 0 ? (
        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', p: 4, textAlign: 'center' }}
        >
          <Icon
            icon="mdi:clipboard-text-outline"
            style={{
              fontSize: '3rem',
              color: 'var(--mui-palette-text-secondary)',
              opacity: 0.5,
            }}
          />
          <Typography variant="h6" sx={{ mt: 1, color: 'text.secondary' }}>
            No Node Readiness Rules in Cluster
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Deploy NodeReadinessRule resources to begin configuring automated node readiness taints.
          </Typography>
        </Card>
      ) : rulesNeedingAttention.length === 0 ? (
        <Card
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', p: 3, textAlign: 'center' }}
        >
          <Icon
            icon="mdi:check-circle-outline"
            style={{ fontSize: '2.5rem', color: theme.palette.success.main, opacity: 0.9 }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1, color: 'text.primary' }}>
            All Rules Healthy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No rules currently report controller evaluation errors, active taints, or out-of-sync
            specifications.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2} alignItems="stretch">
          {rulesNeedingAttention.map(rule => {
            const stats = getRuleStats(rule);
            const taintsPresent =
              !stats.isDryRun && typeof stats.unsatisfied === 'number' ? stats.unsatisfied : 0;
            const isPendingSync = isRulePendingSync(rule);
            const isFresh = isFreshRule(rule);

            const ruleName = rule.metadata.name;

            return (
              <Grid item xs={12} sm={6} md={4} key={ruleName} sx={{ display: 'flex' }}>
                <AttentionRuleCard
                  name={ruleName}
                  isDryRun={stats.isDryRun}
                  failedCount={stats.failed}
                  taintsPresent={taintsPresent}
                  isPendingSync={isPendingSync}
                  isFresh={isFresh}
                  onClick={() => onRuleClick(ruleName)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
