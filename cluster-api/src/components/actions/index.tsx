import { Headlamp } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import Secret from '@kinvolk/headlamp-plugin/lib/k8s/secret';
import { useSnackbar } from 'notistack';
import { useRef } from 'react';
import { Cluster } from '../../resources/cluster';

/**
 * Props for the GetKubeconfigAction component.
 */
export interface GetKubeconfigActionProps {
  /** The Cluster resource to get the kubeconfig for. */
  resource: Cluster;
}

/**
 * Connect a Cluster to Headlamp using its kubeconfig Secret.
 *
 * @param resource - The Cluster resource
 * @param secretData - Result from Secret.useGet
 * @param enqueueSnackbar - Snackbar function for user feedback
 * @param setLoading - Setter to control loading state
 */
async function connectClusterToHeadlamp(
  resource: Cluster,
  secretData: any,
  enqueueSnackbar: any,
  loadingRef: React.MutableRefObject<boolean>
) {
  if (loadingRef.current) return;
  const secretName = `${resource.metadata?.name}-kubeconfig`;
  const namespace = resource.metadata?.namespace || 'default';
  const kubeconfigValue = secretData.data?.jsonData?.data?.value;
  const infraKind = resource.spec?.infrastructureRef?.kind;

  if (secretData.error) {
    enqueueSnackbar(
      `Failed to get Secret "${secretName}" in namespace "${namespace}": ${secretData.error}`,
      { variant: 'error' }
    );
    return;
  }

  if (!kubeconfigValue) {
    enqueueSnackbar('Kubeconfig not available yet. Cluster may still be provisioning.', {
      variant: 'warning',
    });
    return;
  }

  if (infraKind === 'DockerCluster') {
    enqueueSnackbar(
      `Docker provider detected. Run:
kind get kubeconfig --name ${resource.metadata?.name} > ${resource.metadata?.name}.kubeconfig`,
      { variant: 'warning' }
    );
    return;
  }

  try {
    loadingRef.current = true;
    enqueueSnackbar('Connecting to cluster...', { variant: 'info' });

    await Headlamp.setCluster({
      kubeconfig: kubeconfigValue,
    });

    enqueueSnackbar('Cluster connected successfully', {
      variant: 'success',
    });
  } catch (err: any) {
    enqueueSnackbar(`Failed to connect: ${err.message}`, {
      variant: 'error',
    });
  } finally {
    loadingRef.current = false;
  }
}

/**
 * GetKubeconfigAction is a component that provides an action button to download the kubeconfig
 * for a specific Cluster resource.
 *
 * @param props - The component props.
 */
export function GetKubeconfigAction(props: GetKubeconfigActionProps) {
  const { resource } = props;
  const loadingRef = useRef(false);
  const { enqueueSnackbar } = useSnackbar();

  const secretName = `${resource.metadata?.name}-kubeconfig`;
  const namespace = resource.metadata?.namespace || 'default';
  const secretData = Secret.useGet(secretName, namespace);

  return (
    <ActionButton
      description="Download Kubeconfig"
      longDescription="Download the Kubeconfig file for this cluster"
      icon={'mdi:cloud-download'}
      onClick={() => {
        connectClusterToHeadlamp(resource, secretData, enqueueSnackbar, loadingRef);
      }}
    />
  );
}
