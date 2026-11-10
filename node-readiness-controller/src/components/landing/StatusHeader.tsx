import { Icon } from '@iconify/react';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import React from 'react';

interface StatusHeaderProps {
  /** Total number of rules, displayed in the explore button label. */
  totalRules: number;
  /** Deployment object returned by useGet, or null if unavailable. */
  deployment: any;
  /** Error returned by the deployment useGet hook. */
  deploymentError: any;
  /** Callback invoked when the "Explore All Rules" button is clicked. */
  onExploreRules: () => void;
}

/**
 * Top header bar displaying the CRD API status, optional controller health badge,
 * and the "Explore All Rules" action button.
 */
export default function StatusHeader({
  totalRules,
  deployment,
  deploymentError,
  onExploreRules,
}: StatusHeaderProps) {
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
        {/* Controller Deployment Health:
            - Running: deployment found and readyReplicas > 0
            - Stopped: deployment found and readyReplicas === 0
            - Not Detected: deployment not found in default namespace (404)
            - Omitted: 403 Forbidden (RBAC denied) or still loading
        */}
        {(() => {
          const isForbidden = (deploymentError as any)?.status === 403;
          if (isForbidden) {
            return null;
          }

          if (deployment === null && !deploymentError) {
            return null;
          }

          const isNotFound = (deploymentError as any)?.status === 404;
          const isReady = (deployment?.status?.readyReplicas ?? 0) > 0;

          if (deployment) {
            return (
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
                <StatusLabel status={isReady ? 'success' : 'error'}>
                  {isReady ? 'Running' : 'Stopped'}
                </StatusLabel>
              </Box>
            );
          }

          if (isNotFound) {
            return (
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
                <Tooltip
                  title="Controller deployment not detected in default namespace (nrr-system)"
                  arrow
                >
                  <span>
                    <StatusLabel status="warning">Not Detected</StatusLabel>
                  </span>
                </Tooltip>
              </Box>
            );
          }

          return null;
        })()}
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
