import { Icon } from '@iconify/react';
import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import React from 'react';
import CommandCluster from './CommandCluster/CommandCluster';

export type MinikubeClusterStatusType =
  | 'loading'
  | 'active'
  | 'auth-error'
  | 'permission-error'
  | 'unavailable';

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

export default function ClusterStatus({ cluster, error }: ClusterStatusProps) {
  const theme = useTheme() as any;
  const status = getMinikubeClusterStatus(error);
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState<string | null>(null);

  const successColor =
    theme.palette?.home?.status?.success || theme.palette?.success?.main || '#4caf50';
  const errorColor = theme.palette?.home?.status?.error || theme.palette?.error?.main || '#f44336';
  const neutralColor = theme.palette?.text?.secondary || '#888';

  const renderActionOrIcon = () => {
    switch (status) {
      case 'active':
        return (
          <Tooltip title="Stop" placement="top" arrow>
            <IconButton
              aria-label="stop"
              onClick={() => {
                setOpenConfirmDialog('stopMinikube');
              }}
              size="small"
              sx={{
                p: 0,
                minWidth: 16,
                width: 16,
                height: 16,
                minHeight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon="mdi:stop" width={16} height={16} color={successColor} />
            </IconButton>
          </Tooltip>
        );
      case 'unavailable':
        return (
          <Tooltip title="Start" placement="top" arrow>
            <IconButton
              aria-label="start"
              onClick={() => {
                setOpenConfirmDialog('startMinikube');
              }}
              size="small"
              sx={{
                p: 0,
                minWidth: 16,
                width: 16,
                height: 16,
                minHeight: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon icon="mdi:play" width={16} height={16} color={errorColor} />
            </IconButton>
          </Tooltip>
        );
      case 'auth-error':
        return (
          <Tooltip
            title="Authentication failed. Check your cluster credentials."
            placement="top"
            arrow
          >
            <Box
              aria-label="auth-error"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
              }}
            >
              <Icon icon="mdi:alert-circle-outline" width={16} height={16} color={errorColor} />
            </Box>
          </Tooltip>
        );
      case 'permission-error':
        return (
          <Tooltip title="Permission denied. Check your user permissions." placement="top" arrow>
            <Box
              aria-label="permission-error"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
              }}
            >
              <Icon icon="mdi:alert-circle-outline" width={16} height={16} color={errorColor} />
            </Box>
          </Tooltip>
        );
      case 'loading':
      default:
        return (
          <Tooltip title="Checking cluster status..." placement="top" arrow>
            <Box
              aria-label="loading"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
              }}
            >
              <Icon icon="mdi:loading" width={16} height={16} color={neutralColor} />
            </Box>
          </Tooltip>
        );
    }
  };

  const getStatusLabelAndColor = () => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: successColor };
      case 'unavailable':
        return { label: 'Inactive', color: errorColor };
      case 'auth-error':
        return { label: 'Authentication Error', color: errorColor };
      case 'permission-error':
        return { label: 'Permission Error', color: errorColor };
      case 'loading':
      default:
        return { label: 'Connecting...', color: neutralColor };
    }
  };

  const statusInfo = getStatusLabelAndColor();

  return (
    <>
      <CommandCluster
        initialClusterName={cluster?.name}
        open={openConfirmDialog === 'stopMinikube'}
        handleClose={cancel => {
          setOpenConfirmDialog('');
          if (cancel) {
            return;
          }
          window.location.reload();
        }}
        onCommandDispatched={() => {
          setOpenConfirmDialog('');
        }}
        command={'stop'}
      />
      <CommandCluster
        initialClusterName={cluster?.name}
        open={openConfirmDialog === 'startMinikube'}
        handleClose={cancel => {
          setOpenConfirmDialog('');
          if (cancel) {
            return;
          }
          window.location.reload();
        }}
        onCommandDispatched={() => {
          setOpenConfirmDialog('');
        }}
        command={'start'}
      />
      <Box width="fit-content">
        <Box display="flex" alignItems="center" justifyContent="center">
          {renderActionOrIcon()}
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
