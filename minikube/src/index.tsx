import {
  registerAddClusterProvider,
  registerAppBarAction,
  registerClusterProviderDialog,
  registerClusterProviderMenuItem,
  registerRoute,
  runCommand,
} from '@kinvolk/headlamp-plugin/lib';
import { Button, ListItemText, MenuItem } from '@mui/material';
import React from 'react';
import CommandCluster from './CommandCluster/CommandCluster';
import CreateClusterPage from './CreateClusterPage';
import MinikubeIcon from './minikube.svg';

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

registerRoute({
  path: '/create-cluster-minikube',
  sidebar: {
    item: 'addCluster',
    sidebar: 'HOME',
  },
  name: 'minikube',
  component: () => <CreateClusterPage />,
  exact: true,
  useClusterURL: false,
  noAuthRequired: true,
  disabled: !isElectron(),
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
// alert(import.meta.env.HEADLAMP_APP_PLUGIN_PACKAGE_PATH);
// alert(import.meta.env.VITE_PLUGIN_PACKAGE_PATH);
// For the add cluster page, add a section for minikube
registerAddClusterProvider({
  title: 'Minikube',
  icon: MinikubeIcon,
  description:
    'Minikube is a lightweight tool that simplifies the process of setting up a Kubernetes environment on your local PC. It provides a localStorage, single-node Kubernetes cluster that you can use for learning, development, and testing purposes.',
  url: '/create-cluster-minikube',
});

// Declare a global function with the same type as runCommand
declare const pluginRunCommand: typeof runCommand;
declare const pluginPath: string;
const packagePath =
  pluginPath.startsWith('plugins/') || pluginPath.startsWith('plugins\\')
    ? pluginPath.substring(8)
    : pluginPath;

function Command() {
  function handleClick() {
    console.log('Running manage-minikube.js script with package path:', packagePath);
    const scriptjs = pluginRunCommand(
      //@ts-ignore
      'scriptjs',
      [`${packagePath}/manage-minikube.js`, 'info'],
      {}
    );
    scriptjs.stdout.on('data', data => {
      console.log('scriptjs stdout:', data);
    });
    scriptjs.stderr.on('data', data => {
      console.log('scriptjs stderr:', data);
    });
    scriptjs.on('exit', code => {
      console.log('scriptjs exit code:', code);
    });
  }
  return (
    <Button variant="contained" color="primary" onClick={handleClick}>
      script
    </Button>
  );
}
registerAppBarAction(Command);
