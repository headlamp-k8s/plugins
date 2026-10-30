import { Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import MetricCard from './MetricCard';

interface MetricCardsGridProps {
  /** Total number of NodeReadinessRule objects. */
  totalRules: number;
  /** Count of non-dry-run rules with at least one taint present. */
  rulesWithTaintsPresent: number;
  /** Count of rules with at least one failed node evaluation. */
  rulesWithEvaluationErrors: number;
  /** Count of rules where observedGeneration < metadata.generation or observedGeneration is unset. */
  reconcilingRules: number;
  /** Callback invoked when any metric card is clicked. */
  onCardClick: () => void;
}

/**
 * Grid of four metric summary cards providing fleet-wide rule statistics.
 */
export default function MetricCardsGrid({
  totalRules,
  rulesWithTaintsPresent,
  rulesWithEvaluationErrors,
  reconcilingRules,
  onCardClick,
}: MetricCardsGridProps) {
  const theme = useTheme();

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Rules"
          value={totalRules}
          caption="Active rule definitions"
          icon="mdi:shield-check-outline"
          iconSize="2.3rem"
          activeColor={theme.palette.primary.main}
          onClick={onCardClick}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Taints Present"
          value={rulesWithTaintsPresent}
          caption="Rules actively applying taints"
          icon="mdi:shield-alert-outline"
          iconSize="2.3rem"
          activeColor={theme.palette.warning.main}
          onClick={onCardClick}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Evaluation Errors"
          value={rulesWithEvaluationErrors}
          caption="Controller evaluation failures"
          icon="mdi:alert-circle-outline"
          iconSize="2.3rem"
          activeColor={theme.palette.error.main}
          onClick={onCardClick}
        />
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Reconciling"
          value={reconcilingRules}
          caption="Pending controller status sync"
          icon="mdi:sync"
          iconSize="2.3rem"
          activeColor={theme.palette.info.main}
          onClick={onCardClick}
          tooltip="Rules awaiting initial controller evaluation or where spec was modified and status has not yet synced"
        />
      </Grid>
    </Grid>
  );
}
