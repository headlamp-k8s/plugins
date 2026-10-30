import { Icon } from '@iconify/react';
import { Box, Card, CardContent, Chip, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

interface AttentionRuleCardProps {
  /** Rule name displayed as the card title. */
  name: string;
  /** Whether the rule is in dry-run mode. */
  isDryRun: boolean;
  /** Number of failed node evaluations. */
  failedCount: number;
  /** Number of nodes with taint present (0 for dry-run rules). */
  taintsPresent: number;
  /** Whether the rule is awaiting controller reconciliation. */
  isReconciling: boolean;
  /** Whether the rule has never been evaluated yet (observedGeneration is undefined). */
  isPendingSync?: boolean;
  /** Click handler (typically navigates to the rule detail view). */
  onClick: () => void;
}

/**
 * A compact card highlighting a single rule that requires operator attention.
 * The left border color signals the most severe issue (error > warning > info).
 */
export default function AttentionRuleCard({
  name,
  isDryRun,
  failedCount,
  taintsPresent,
  isReconciling,
  isPendingSync,
  onClick,
}: AttentionRuleCardProps) {
  const theme = useTheme();
  const hasFailed = failedCount > 0;

  const accentColor = hasFailed
    ? theme.palette.error.main
    : taintsPresent > 0
    ? theme.palette.warning.main
    : theme.palette.info.main;

  return (
    <Card
      elevation={0}
      role="button"
      tabIndex={0}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: accentColor,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 2 },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        },
      }}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent
        sx={{
          py: 2,
          '&:last-child': { pb: 2 },
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <Tooltip title={name} arrow>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
                flexGrow: 1,
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              {name}
            </Typography>
          </Tooltip>
          {isDryRun && (
            <Chip
              label="Dry Run"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ flexShrink: 0, height: 22, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        <Box mt={1.5} display="flex" flexDirection="column" gap={0.5}>
          {hasFailed && (
            <Box display="flex" alignItems="center" gap={0.75}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{ width: 18, height: 18, flexShrink: 0 }}
              >
                <Icon
                  icon="mdi:alert-circle-outline"
                  style={{ color: theme.palette.error.main, fontSize: '1.15rem' }}
                />
              </Box>
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                {failedCount} node evaluation error{failedCount > 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
          {taintsPresent > 0 && (
            <Box display="flex" alignItems="center" gap={0.75}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{ width: 18, height: 18, flexShrink: 0 }}
              >
                <Icon
                  icon="mdi:shield-alert-outline"
                  style={{ color: theme.palette.warning.main, fontSize: '1.15rem' }}
                />
              </Box>
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
                {taintsPresent} node{taintsPresent > 1 ? 's' : ''} with taint present
              </Typography>
            </Box>
          )}
          {isReconciling && (
            <Box display="flex" alignItems="center" gap={0.75}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{ width: 18, height: 18, flexShrink: 0 }}
              >
                <Icon
                  icon="mdi:sync"
                  style={{ color: theme.palette.info.main, fontSize: '1.15rem' }}
                />
              </Box>
              <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
                {isPendingSync ? 'Pending controller sync' : 'Spec modified (reconciling)'}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
