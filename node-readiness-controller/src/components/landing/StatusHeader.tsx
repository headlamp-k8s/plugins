import { Icon } from '@iconify/react';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import React from 'react';
import type { ControllerHealthResult } from '../../utils/controllerHealth';

interface StatusHeaderProps {
  /** Total number of rules, displayed in the explore button label. */
  totalRules: number;
  /** Evaluated controller health status (from lease or deployment fallback). */
  controllerHealth?: Partial<ControllerHealthResult>;
  /** Callback invoked when the "Explore All Rules" button is clicked. */
  onExploreRules: () => void;
}

/**
 * Top header bar displaying the CRD API status, controller health badge,
 * and the "Explore All Rules" action button.
 */
export default function StatusHeader({
  totalRules,
  controllerHealth,
  onExploreRules,
}: StatusHeaderProps) {
  const isForbidden = controllerHealth?.status === 'forbidden';
  const isLoading = controllerHealth?.status === 'loading';

  const shouldRenderControllerBadge = !isForbidden && !isLoading;

  const badgeStatus = controllerHealth?.badgeStatus ?? 'warning';
  const badgeLabel = controllerHealth?.badgeLabel ?? null;

  const tooltipTitle = controllerHealth?.tooltip ?? '';

  return (
    <Box
      mb={3}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={2}
    >
      <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.75rem',
          }}
        >
          API Status:
        </Typography>
        <StatusLabel status="success">API Available</StatusLabel>
        <Chip
          label="readiness.node.x-k8s.io/v1alpha1"
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            color: 'text.secondary',
            borderColor: 'divider',
          }}
        />
        {shouldRenderControllerBadge && badgeLabel && (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.75rem',
                ml: 1,
              }}
            >
              Controller:
            </Typography>
            <Tooltip title={tooltipTitle} arrow>
              <span>
                <StatusLabel status={badgeStatus}>{badgeLabel}</StatusLabel>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>
      <Button
        variant="contained"
        color="primary"
        onClick={onExploreRules}
        startIcon={<Icon icon="mdi:format-list-checks" />}
        size="small"
      >
        Explore All Rules ({totalRules})
      </Button>
    </Box>
  );
}
