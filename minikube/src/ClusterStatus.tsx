import { Icon } from '@iconify/react';
import { Box, CircularProgress, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import React from 'react';
import CommandCluster from './CommandCluster/CommandCluster';

export type MinikubeClusterStatusType =
  | 'loading'
  | 'active'
  | 'auth-error'
  | 'permission-error'
  | 'unavailable';

type ConfirmDialogAction = 'startMinikube' | 'stopMinikube';

export interface ClusterStatusProps {
  cluster: {
    name?: string;
    [key: string]: any;
  };
  error?: { status?: number; [key: string]: any } | null;
}

/**
 * Determines the cluster state based on the error received from Headlamp core.
 * Matches Headlamp core's getClusterStatus semantics.
 */
export function getMinikubeClusterStatus(
  error?: { status?: number } | null
): MinikubeClusterStatusType {
  if (error === undefined) {
    return 'loading';
  }
  if (error === null) {
    return 'active';
  }
  if (error.status === 401) {
    return 'auth-error';
  }
  if (error.status === 403) {
    return 'permission-error';
  }
  return 'unavailable';
}

interface StatusPresentation {
  label: string;
  color: string;
  tooltip: string;
  action?: {
    ariaLabel: string;
    dialog: ConfirmDialogAction;
    icon: string;
  };
  icon?: string;
}

const iconBoxSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
};

const actionButtonSx = {
  ...iconBoxSx,
  p: 0,
  minWidth: 16,
  minHeight: 16,
};

export default function ClusterStatus({ cluster, error }: ClusterStatusProps) {
  const theme = useTheme() as any;
  const status = getMinikubeClusterStatus(error);
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState<ConfirmDialogAction | null>(
    null
  );

  const successColor =
    theme.palette?.home?.status?.success || theme.palette?.success?.main || '#4caf50';
  const errorColor = theme.palette?.home?.status?.error || theme.palette?.error?.main || '#f44336';
  const neutralColor = theme.palette?.text?.secondary || '#888';

  const statusConfig: Record<MinikubeClusterStatusType, StatusPresentation> = {
    active: {
      label: 'Active',
      color: successColor,
      tooltip: 'Stop',
      action: { ariaLabel: 'stop', dialog: 'stopMinikube', icon: 'mdi:stop' },
    },
    unavailable: {
      label: 'Inactive',
      color: errorColor,
      tooltip: 'Start',
      action: { ariaLabel: 'start', dialog: 'startMinikube', icon: 'mdi:play' },
    },
    'auth-error': {
      label: 'Authentication Error',
      color: errorColor,
      tooltip: 'Authentication failed. Check your cluster credentials.',
      icon: 'mdi:alert-circle-outline',
    },
    'permission-error': {
      label: 'Permission Error',
      color: errorColor,
      tooltip: 'Permission denied. Check your user permissions.',
      icon: 'mdi:alert-circle-outline',
    },
    loading: {
      label: 'Connecting...',
      color: neutralColor,
      tooltip: 'Checking cluster status...',
    },
  };

  const statusInfo = statusConfig[status];

  const renderIndicator = () => {
    if (statusInfo.action) {
      const { ariaLabel, dialog, icon } = statusInfo.action;
      return (
        <Tooltip title={statusInfo.tooltip} placement="top" arrow>
          <IconButton
            aria-label={ariaLabel}
            onClick={() => setOpenConfirmDialog(dialog)}
            size="small"
            sx={actionButtonSx}
          >
            <Icon icon={icon} width={16} height={16} color={statusInfo.color} />
          </IconButton>
        </Tooltip>
      );
    }

    if (statusInfo.icon) {
      return (
        <Tooltip title={statusInfo.tooltip} placement="top" arrow>
          <Box role="img" tabIndex={0} aria-label={statusInfo.tooltip} sx={iconBoxSx}>
            <Icon icon={statusInfo.icon} width={16} height={16} color={statusInfo.color} />
          </Box>
        </Tooltip>
      );
    }

    return (
      <Tooltip title={statusInfo.tooltip} placement="top" arrow>
        <Box sx={iconBoxSx}>
          <CircularProgress
            size={14}
            aria-label={statusInfo.tooltip}
            sx={{ color: statusInfo.color }}
          />
        </Box>
      </Tooltip>
    );
  };

  return (
    <>
      <CommandCluster
        initialClusterName={cluster?.name}
        open={openConfirmDialog === 'stopMinikube'}
        handleClose={cancel => {
          setOpenConfirmDialog(null);
          if (cancel) {
            return;
          }
          window.location.reload();
        }}
        onCommandDispatched={() => {
          setOpenConfirmDialog(null);
        }}
        command={'stop'}
      />
      <CommandCluster
        initialClusterName={cluster?.name}
        open={openConfirmDialog === 'startMinikube'}
        handleClose={cancel => {
          setOpenConfirmDialog(null);
          if (cancel) {
            return;
          }
          window.location.reload();
        }}
        onCommandDispatched={() => {
          setOpenConfirmDialog(null);
        }}
        command={'start'}
      />
      <Box width="fit-content">
        <Box display="flex" alignItems="center" justifyContent="center">
          {renderIndicator()}
          <Typography
            variant="body2"
            sx={{
              marginLeft: theme.spacing?.(1) ?? 1,
              color: statusInfo.color,
            }}
          >
            {statusInfo.label}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
