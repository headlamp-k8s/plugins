import {
  registerAddClusterProvider,
  registerClusterProviderDialog,
  registerClusterProviderMenuItem,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { ListItemText, MenuItem } from '@mui/material';
import React from 'react';
import CommandCluster from './CommandCluster/CommandCluster';
import CreateClusterPage from './CreateClusterPage';
import MinikubeAddClusterProvider from './MinikubeAddClusterProvider';

export function isElectron(): boolean {
  // Renderer process
  if (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    (window.process as any).type === 'renderer'
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!(process.versions as any).electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true;
  }

  return false;
}

registerSidebarEntry({
  parent: null,
  name: 'minikube',
  label: 'Minikube',
  url: '/create-cluster-minikube',
  icon: 'mdi:comment-quote',
  sidebar: 'HOME',
  useClusterURL: false,
});

registerRoute({
  path: '/create-cluster-minikube',
  sidebar: 'minikube',
  name: 'minikube',
  component: () => <CreateClusterPage />,
  exact: true,
  useClusterURL: false,
  noAuthRequired: true,
});

/**
 * @returns true if the cluster is a minikube cluster
 */
function isMinikube(cluster) {
  return cluster.meta_data?.extensions?.context_info?.provider === 'minikube.sigs.k8s.io';
}

registerClusterProviderMenuItem(({ cluster, setOpenConfirmDialog, handleMenuClose }) => {
  if (!isElectron() || !isMinikube(cluster)) {
    return null;
  }

  return (
    <MenuItem
      onClick={() => {
        setOpenConfirmDialog('deleteMinikube');
        handleMenuClose();
      }}
    >
      <ListItemText>{'Delete'}</ListItemText>
    </MenuItem>
  );
});

registerClusterProviderMenuItem(({ cluster, setOpenConfirmDialog, handleMenuClose }) => {
  if (!isElectron() || !isMinikube(cluster)) {
    return null;
  }

  return (
    <MenuItem
      onClick={() => {
        setOpenConfirmDialog('startMinikube');
        handleMenuClose();
      }}
    >
      <ListItemText>{'Start'}</ListItemText>
    </MenuItem>
  );
});

registerClusterProviderMenuItem(({ cluster, setOpenConfirmDialog, handleMenuClose }) => {
  if (!isElectron() || !isMinikube(cluster)) {
    return null;
  }

  return (
    <MenuItem
      onClick={() => {
        setOpenConfirmDialog('stopMinikube');
        handleMenuClose();
      }}
    >
      <ListItemText>{'Stop'}</ListItemText>
    </MenuItem>
  );
});

registerClusterProviderDialog(({ cluster, openConfirmDialog, setOpenConfirmDialog }) => {
  if (!isElectron() || !isMinikube(cluster)) {
    return null;
  }

  return (
    <CommandCluster
      initialClusterName={cluster.name}
      open={openConfirmDialog === 'startMinikube'}
      handleClose={() => setOpenConfirmDialog('')}
      onConfirm={() => {
        setOpenConfirmDialog('');
      }}
      command={'start'}
      finishedText={'Done! kubectl is now configured'}
    />
  );
});

registerClusterProviderDialog(({ cluster, openConfirmDialog, setOpenConfirmDialog }) => {
  if (!isElectron() || !isMinikube(cluster)) {
    return null;
  }

  return (
    <CommandCluster
      initialClusterName={cluster.name}
      open={openConfirmDialog === 'stopMinikube'}
      handleClose={() => setOpenConfirmDialog('')}
      onConfirm={() => {
        setOpenConfirmDialog('');
      }}
      command={'stop'}
      finishedText={'node stopped.'}
    />
  );
});

registerClusterProviderDialog(({ cluster, openConfirmDialog, setOpenConfirmDialog }) => {
  if (!isElectron() || !isMinikube(cluster)) {
    return null;
  }

  return (
    <CommandCluster
      initialClusterName={cluster.name}
      open={openConfirmDialog === 'deleteMinikube'}
      handleClose={() => setOpenConfirmDialog('')}
      onConfirm={() => {
        setOpenConfirmDialog('');
      }}
      command={'delete'}
      finishedText={'Removed all traces of the'}
    />
  );
});

// For the add cluster page, add a section for minikube
registerAddClusterProvider(MinikubeAddClusterProvider);
