import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Typography } from '@mui/material';
import { alpha, lighten, useTheme } from '@mui/material/styles';
import React from 'react';
import type { ApplicationKind } from '../types/pipecd';

const KIND_COLORS: Record<ApplicationKind, string> = {
  KUBERNETES: '#326CE5',
  TERRAFORM: '#7B42BC',
  CLOUD_RUN: '#4285F4',
  LAMBDA: '#FF9900',
  ECS: '#FF4F00',
  UNKNOWN: '#6B7280',
};

/** Display names for each platform, shared by the badge and the filter menu. */
export function useKindLabels(): Record<ApplicationKind, string> {
  const { t } = useTranslation();
  return {
    KUBERNETES: t('Kubernetes'),
    TERRAFORM: t('Terraform'),
    CLOUD_RUN: t('Cloud Run'),
    LAMBDA: t('Lambda'),
    ECS: t('ECS'),
    UNKNOWN: t('Unknown'),
  };
}

interface KindBadgeProps {
  kind: ApplicationKind;
}

export function KindBadge({ kind }: KindBadgeProps): JSX.Element {
  const theme = useTheme();
  const labels = useKindLabels();
  const base = KIND_COLORS[kind] ?? theme.palette.grey[600];
  const isLight = theme.palette.mode === 'light';

  return (
    <Typography
      component="span"
      sx={{
        display: 'inline-flex',
        whiteSpace: 'nowrap',
        border: '1px solid',
        borderColor: alpha(base, 0.4),
        backgroundColor: alpha(base, isLight ? 0.12 : 0.2),
        color: isLight ? theme.palette.text.primary : lighten(base, 0.4),
        fontSize: theme.typography.pxToRem(14),
        px: 1,
        py: 0.5,
        borderRadius: `${theme.shape.borderRadius}px`,
      }}
    >
      {labels[kind] ?? kind}
    </Typography>
  );
}
