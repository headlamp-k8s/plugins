import { Icon } from '@iconify/react';
import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import React from 'react';
import { ClusterError, ClusterState, getClusterState } from './clusterState';
import CommandCluster from './CommandCluster/CommandCluster';

export default function ClusterStatus({
  cluster,
  error,
}: {
  cluster: { name: string };
  error: ClusterError;
}) {
  const theme = useTheme() as any;
  const state = getClusterState(error);
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState<string | null>(null);

  const display: Record<ClusterState, { label: string; color: string }> = {
    loading: { label: 'Loading…', color: theme.palette.text.secondary },
    active: { label: 'Active', color: theme.palette.home.status.success },
    unavailable: { label: 'Inactive', color: theme.palette.home.status.error },
    'auth-error': { label: 'Unauthorized', color: theme.palette.home.status.error },
    'permission-error': { label: 'Forbidden', color: theme.palette.home.status.error },
  };

  return (
    <>
      <CommandCluster
        initialClusterName={cluster.name}
        open={openConfirmDialog === 'stopMinikube'}
        handleClose={cancel => {
          setOpenConfirmDialog('');
          if (cancel) {
            return;
          }
          // reload the browser to refresh the cluster list
          window.location.reload();
        }}
        onCommandDispatched={() => {
          setOpenConfirmDialog('');
        }}
        command={'stop'}
      />
      <CommandCluster
        initialClusterName={cluster.name}
        open={openConfirmDialog === 'startMinikube'}
        handleClose={cancel => {
          setOpenConfirmDialog('');
          if (cancel) {
            return;
          }
          // reload the browser to refresh the cluster list
          window.location.reload();
        }}
        onCommandDispatched={() => {
          setOpenConfirmDialog('');
        }}
        command={'start'}
      />
      <Box width="fit-content">
        <Box display="flex" alignItems="center" justifyContent="center">
          {state === 'unavailable' ? (
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
                {/* <Icon icon="mdi:play" width={16} height={16} color={theme.palette.home.status.error} /> */}
                <Icon icon="mdi:play" width={16} height={16} color={theme.palette.common.primary} />
              </IconButton>
            </Tooltip>
          ) : state === 'active' ? (
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
                {/* <Icon icon="mdi:stop" width={16} height={16} color={theme.palette.home.status.success} /> */}
                <Icon icon="mdi:stop" width={16} height={16} color={theme.palette.common.primary} />
              </IconButton>
            </Tooltip>
          ) : null}
          <Typography
            variant="body2"
            style={{ marginLeft: theme.spacing(1), color: display[state].color }}
          >
            {display[state].label}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
