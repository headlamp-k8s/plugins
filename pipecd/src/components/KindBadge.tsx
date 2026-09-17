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
};

const KIND_LABELS: Record<ApplicationKind, string> = {
  KUBERNETES: 'Kubernetes',
  TERRAFORM: 'Terraform',
  CLOUD_RUN: 'Cloud Run',
  LAMBDA: 'Lambda',
  ECS: 'ECS',
};

interface KindBadgeProps {
  kind: ApplicationKind;
}

export function KindBadge({ kind }: KindBadgeProps): JSX.Element {
  const theme = useTheme();
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
        color: isLight ? base : lighten(base, 0.4),
        fontSize: theme.typography.pxToRem(14),
        px: 1,
        py: 0.5,
        borderRadius: `${theme.shape.borderRadius}px`,
      }}
    >
      {KIND_LABELS[kind] ?? kind}
    </Typography>
  );
}
