import { Icon } from '@iconify/react';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';

export interface CrdNotInstalledProps {
  /** If the error was a 403 Forbidden */
  isForbidden?: boolean;
  /** Specific resource name or display label (e.g. "NodeReadinessRule", "NodeReadinessEvaluation") */
  resourceName?: string;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
}

/**
 * Centered empty-state component displayed when CRDs are not installed or cluster permissions are missing.
 * Replaces Headlamp's default error/unreachable banner with actionable documentation guidance.
 */
export default function CrdNotInstalled({
  isForbidden = false,
  resourceName,
  title,
  description,
}: CrdNotInstalledProps) {
  const displayTitle =
    title ||
    (isForbidden
      ? 'Permission Denied: Cannot Access CRDs'
      : resourceName
      ? `${resourceName} CRD Not Installed`
      : 'Node Readiness Controller CRDs Not Installed');

  const displayDescription =
    description ||
    (isForbidden
      ? `Your Kubernetes user or service account lacks read permissions for ${
          resourceName
            ? `readiness.node.x-k8s.io/${resourceName.toLowerCase()}s`
            : 'Node Readiness resources'
        }.`
      : `The CustomResourceDefinition for ${
          resourceName || 'Node Readiness Controller'
        } is not installed on this cluster. Please refer to the installation documentation to set up the required CRDs.`);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
        width: '100%',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          color: isForbidden ? 'warning.main' : 'text.secondary',
          mb: 2.5,
        }}
      >
        <Icon
          icon={isForbidden ? 'mdi:shield-lock-outline' : 'mdi:database-remove-outline'}
          width={36}
          height={36}
        />
      </Box>

      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {displayTitle}
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 540, mb: 3.5, lineHeight: 1.6 }}
      >
        {displayDescription}
      </Typography>

      {!isForbidden && (
        <Button
          variant="contained"
          color="primary"
          component="a"
          href="https://node-readiness-controller.sigs.k8s.io/user-guide/installation.html"
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<Icon icon="mdi:book-open-variant" />}
          sx={{ textTransform: 'none', fontWeight: 600, px: 3, py: 1 }}
        >
          View Installation Guide
        </Button>
      )}
    </Box>
  );
}
