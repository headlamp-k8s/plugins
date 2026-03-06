import { Icon } from '@iconify/react';
import { Box, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import React from 'react';
import CommandCluster from './CommandCluster/CommandCluster';

export default function ClusterStatus({ cluster, error }) {
  const theme = useTheme() as any;
  const stateUnknown = error === undefined;
  const hasReachError = error && error.status !== 401 && error.status !== 403;
  const [openConfirmDialog, setOpenConfirmDialog] = React.useState<string | null>(null);

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
        onConfirm={() => {
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
        onConfirm={() => {
          setOpenConfirmDialog('');
        }}
        command={'start'}
      />
      <Box width="fit-content">
        <Box display="flex" alignItems="center" justifyContent="center">
          {hasReachError || stateUnknown ? (
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
          ) : (
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
          )}
          <Typography
            variant="body2"
            style={{
              marginLeft: theme.spacing(1),
              color:
                hasReachError || stateUnknown
                  ? theme.palette.home.status.error
                  : theme.palette.home.status.success,
            }}
          >
            {hasReachError || stateUnknown ? 'Inactive' : 'Active'}
            {/* {JSON.stringify({hasReachError, stateUnknown})} */}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
