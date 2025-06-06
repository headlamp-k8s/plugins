import { Headlamp } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import Secret from '@kinvolk/headlamp-plugin/lib/k8s/secret';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

export function GetKubeconfigAction(props) {
  const { resource } = props;
  const [shouldFetch, setShouldFetch] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const secretName = `${resource.metadata.name}-kubeconfig`;
  const namespace = resource.metadata.namespace || 'default';
  const secretData = Secret.useGet(secretName, namespace);

  useEffect(() => {
    if (shouldFetch && secretData.data) {
      if (resource.spec.infrastructureRef.kind === 'DockerCluster') {
        enqueueSnackbar(
          `This Cluster uses the Docker provider, so its kubeconfig is not usable directly in Headlamp.
          Please run "kind get kubeconfig --name ${resource.metadata.name} > ${resource.metadata.name}.kubeconfig" to get a working kubeconfig.`,
          {
            variant: 'warning',
            autoHideDuration: 5000,
          }
        );
      } else {
        Headlamp.setCluster({
          kubeconfig: secretData.data?.jsonData?.data?.value,
        })
          .then(() => {
            enqueueSnackbar(`Kubeconfig for ${resource.metadata.name} set successfully`, {
              variant: 'success',
            });
          })
          .catch(err => {
            enqueueSnackbar(`Failed to set kubeconfig: ${err.message}`, { variant: 'error' });
          });
      }
      setShouldFetch(false); // Reset after processing
    } else if (shouldFetch && secretData.error) {
      enqueueSnackbar(`Kubeconfig Secret ${secretName} not found in namespace ${namespace}`, {
        variant: 'error',
      });
      setShouldFetch(false); // Reset after error
    }
  }, [shouldFetch, secretData, secretName, namespace]);

  return (
    <ActionButton
      description="Download Kubeconfig"
      longDescription="Download the Kubeconfig file for this cluster"
      icon={'mdi:cloud-download'}
      onClick={() => {
        setShouldFetch(true); // Trigger the fetch
      }}
    />
  );
}
