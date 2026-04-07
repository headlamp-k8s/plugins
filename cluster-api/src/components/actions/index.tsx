import { Headlamp } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import Secret from '@kinvolk/headlamp-plugin/lib/k8s/secret';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
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
  const [shouldFetch, setShouldFetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const secretName = `${resource.metadata.name}-kubeconfig`;
  const namespace = resource.metadata.namespace || 'default';
  const secretData = Secret.useGet(secretName, namespace);
  const isKubeconfigAvailable = !!secretData.data;

  useEffect(() => {
    if (!shouldFetch) return;

    if (secretData.data) {
      if (resource.spec.infrastructureRef.kind === 'DockerCluster') {
        enqueueSnackbar(
          `Docker provider detected. Run:
  kind get kubeconfig --name ${resource.metadata.name} > ${resource.metadata.name}.kubeconfig`,
          { variant: 'warning' }
        );
        setShouldFetch(false);
        return;
      }
      setLoading(true);
      enqueueSnackbar('Downloading kubeconfig...', { variant: 'info' });

      Headlamp.setCluster({
        kubeconfig: secretData.data?.jsonData?.data?.value,
      })
        .then(() => {
          enqueueSnackbar('Kubeconfig set successfully', { variant: 'success' });
        })
        .catch(err => {
          enqueueSnackbar(`Failed: ${err.message}`, { variant: 'error' });
        })
        .finally(() => {
          setLoading(false);
          setShouldFetch(false);
        });
    } else {
      enqueueSnackbar('Kubeconfig not available yet. Cluster may still be provisioning.', {
        variant: 'warning',
      });
      setShouldFetch(false);
    }
  }, [shouldFetch, secretData]);

  return (
    <ActionButton
      description="Download Kubeconfig"
      longDescription="Download the Kubeconfig file for this cluster"
      icon={'mdi:cloud-download'}
      onClick={() => {
        if (!isKubeconfigAvailable) {
          enqueueSnackbar('Kubeconfig not available yet. Cluster is still provisioning.', {
            variant: 'warning',
          });
          return;
        }
        if (loading) return;

        setShouldFetch(true);
      }}
    />
  );
}
