import { Headlamp } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import Secret from '@kinvolk/headlamp-plugin/lib/k8s/secret';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { Cluster } from '../../resources/cluster';

/**
 * Props for the GetKubeconfigAction component.
 */
export interface GetKubeconfigActionProps {
  /** The Cluster resource to get the kubeconfig for. */
  resource: Cluster;
}

/**
 * GetKubeconfigAction is a component that provides an action button to download the kubeconfig
 * for a specific Cluster resource.
 *
 * @param props - The component props.
 */
export function GetKubeconfigAction(props: GetKubeconfigActionProps) {
  const { resource } = props;
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const secretName = `${resource.metadata.name}-kubeconfig`;
  const namespace = resource.metadata.namespace || 'default';
  const secretData = Secret.useGet(secretName, namespace);
  const kubeconfigValue = secretData.data?.jsonData?.data?.value;

  // Hide button if not available
  if (!kubeconfigValue) {
    return null;
  }

  const handleClick = async () => {
    if (loading) return;

    if (secretData.error) {
      enqueueSnackbar(
        `Failed to get Secret "${secretName}" in namespace "${namespace}": ${secretData.error}`,
        { variant: 'error' }
      );
      return;
    }
    if (resource.spec.infrastructureRef.kind === 'DockerCluster') {
      enqueueSnackbar(
        `Docker provider detected. Run:
kind get kubeconfig --name ${resource.metadata.name} > ${resource.metadata.name}.kubeconfig`,
        { variant: 'warning' }
      );
      return;
    }

    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <ActionButton
      description="Download Kubeconfig"
      longDescription="Download the Kubeconfig file for this cluster"
      icon={'mdi:cloud-download'}
      onClick={handleClick}
    />
  );
}
