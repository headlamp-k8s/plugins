import { Router } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Machine } from '../../resources/machine';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Whether Cluster API reconciliation is currently paused.
 */
function isMachinePaused(machine: Machine): boolean {
  return machine.metadata?.annotations?.['cluster.x-k8s.io/paused'] === 'true';
}
export function ViewNodeAction({
  nodeName,
  clusterName,
}: {
  nodeName: string;
  clusterName?: string;
}) {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  const handleViewNode = () => {
    /**
     * No workload cluster mapping available.
     */
    if (!clusterName) {
      console.warn('[ViewNodeAction] No cluster name provided');
      enqueueSnackbar('Workload cluster information is unavailable.', {
        variant: 'warning',
      });
      return;
    }

    /**
     * Check if workload cluster is registered in Headlamp.
     */
    let cluster;
    try {
      cluster = getCluster(clusterName);
    } catch (error) {
      enqueueSnackbar(`Error checking cluster availability: ${getErrorMessage(error)}`, {
        variant: 'error',
      });
      return;
    }

    if (!cluster) {
      enqueueSnackbar(
        `Cluster "${clusterName}" is not registered in Headlamp. Add the workload cluster to access Node details.`,
        {
          variant: 'warning',
        }
      );
      return;
    }

    try {
      history.push(
        Router.createRouteURL('node', {
          name: nodeName,
          cluster: clusterName,
        })
      );
    } catch (error) {
      enqueueSnackbar(`Error navigating to Node: ${getErrorMessage(error)}`, {
        variant: 'error',
      });
    }
  };

  return <ActionButton description="View Node" icon="mdi:server" onClick={handleViewNode} />;
}

/**
 * Replace machine by deleting it.
 * Cluster API controllers automatically recreate it.
 */
export function ReplaceMachineAction({ machine }: { machine: Machine }) {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ConfirmButton
      key="replace"
      confirmTitle={`Replace Machine "${machine.metadata?.name}"?`}
      confirmDescription="This deletes the current Machine resource. Cluster API controllers will automatically provision a replacement."
      onConfirm={() => {
        machine
          .delete()
          .then(() => {
            enqueueSnackbar('Machine replacement triggered', {
              variant: 'success',
            });
          })
          .catch((err: any) => {
            enqueueSnackbar(`Failed to replace machine: ${err.message}`, {
              variant: 'error',
            });
          });
      }}
    >
      <ActionButton description="Replace Machine" icon="mdi:restart" onClick={() => {}} />
    </ConfirmButton>
  );
}

/**
 * Pause reconciliation for this Machine.
 */
export function PauseMachineAction({ machine }: { machine: Machine }) {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ActionButton
      description="Pause Reconciliation"
      icon="mdi:pause-circle-outline"
      onClick={() => {
        machine
          .patch({
            metadata: {
              annotations: {
                'cluster.x-k8s.io/paused': 'true',
              },
            },
          })
          .then(() => {
            enqueueSnackbar('Machine reconciliation paused', {
              variant: 'success',
            });
          })
          .catch((err: any) => {
            enqueueSnackbar(`Failed to pause machine: ${err.message}`, {
              variant: 'error',
            });
          });
      }}
    />
  );
}

/**
 * Resume reconciliation for this Machine.
 */
export function ResumeMachineAction({ machine }: { machine: Machine }) {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ActionButton
      description="Resume Reconciliation"
      icon="mdi:play-circle-outline"
      onClick={() => {
        machine
          .patch({
            metadata: {
              annotations: {
                'cluster.x-k8s.io/paused': null,
              },
            },
          })
          .then(() => {
            enqueueSnackbar('Machine reconciliation resumed', {
              variant: 'success',
            });
          })
          .catch((err: any) => {
            enqueueSnackbar(`Failed to resume machine: ${err.message}`, {
              variant: 'error',
            });
          });
      }}
    />
  );
}

/**
 * Open provider instance console.
 */
export function ProviderInstanceAction({ providerID }: { providerID: string }) {
  return (
    <ActionButton
      description="Open Provider Instance"
      icon="mdi:open-in-new"
      onClick={() => {
        const url = getProviderUrl(providerID);

        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }}
    />
  );
}

function getProviderUrl(providerID: string): string | null {
  /**
   * AWS
   */
  const awsMatch = providerID.match(/^aws:\/\/\/([a-z0-9-]+[a-z])\/(i-[a-zA-Z0-9]+)$/);
  if (awsMatch) {
    const availabilityZone = awsMatch[1];
    const instanceId = awsMatch[2];
    const region = availabilityZone.slice(0, -1);
    return `https://${region}.console.aws.amazon.com/ec2/v2/home?region=${region}#InstanceDetails:instanceId=${instanceId}`;
  }

  /**
   * Azure
   */
  const azureMatch = providerID.match(
    /^azure:\/\/\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.Compute\/virtualMachines\/([^/]+)$/i
  );
  if (azureMatch) {
    const subscriptionId = azureMatch[1];
    const resourceGroup = azureMatch[2];
    const vmName = azureMatch[3];
    return `https://portal.azure.com/#@/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}/overview`;
  }

  /**
   * Docker / CAPD
   */
  if (providerID.startsWith('docker:///')) {
    return 'https://desktop.docker.com/dashboard/containers';
  }

  return null;
}

/**
 * Operational actions for Machine nodes.
 */
export function getMachineActions(machine: Machine) {
  const jsonData = machine.jsonData;
  const status = jsonData?.status;
  // Robust extraction of node name
  const nodeName = status?.nodeRef?.name || status?.nodeRef?.metadata?.name;
  const clusterName = machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
  const providerID = machine.spec?.providerID;

  const actions = [];

  if (nodeName) {
    actions.push(<ViewNodeAction key="view-node" nodeName={nodeName} clusterName={clusterName} />);
  }

  actions.push(<ReplaceMachineAction key="replace" machine={machine} />);

  const paused = isMachinePaused(machine);
  if (paused) {
    actions.push(<ResumeMachineAction key="resume" machine={machine} />);
  } else {
    actions.push(<PauseMachineAction key="pause" machine={machine} />);
  }

  if (providerID) {
    actions.push(<ProviderInstanceAction key="provider-instance" providerID={providerID} />);
  }

  return actions;
}
