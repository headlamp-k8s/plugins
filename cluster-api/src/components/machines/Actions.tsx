import { Router } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Machine } from '../../resources/machine';
import { getErrorMessage } from '../actions';

/**
 * Whether CAPI reconciliation is currently paused for this machine.
 * Checks the upstream annotation rather than spec.paused.
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
    if (!clusterName) {
      console.warn('[ViewNodeAction] No cluster name provided');
      enqueueSnackbar('Workload cluster information is unavailable.', { variant: 'warning' });
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
      enqueueSnackbar(`Error navigating to Node: ${getErrorMessage(error)}`, { variant: 'error' });
    }
  };

  return <ActionButton description="View Node" icon="mdi:server" onClick={handleViewNode} />;
}

/**
 * Replace machine by deleting it.
 * CAPI controllers automatically provision a replacement via the owning
 * MachineSet or MachineDeployment.
 */
export function ReplaceMachineAction({ machine }: { machine: Machine }) {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ConfirmButton
      confirmTitle={`Replace Machine "${machine.metadata?.name}"?`}
      confirmDescription="This deletes the current Machine resource. CAPI controllers will automatically provision a replacement."
      onConfirm={async () => {
        try {
          await machine.delete();
          enqueueSnackbar('Machine replacement triggered', { variant: 'success' });
        } catch (err: any) {
          enqueueSnackbar(`Failed to replace machine: ${getErrorMessage(err)}`, {
            variant: 'error',
          });
        }
      }}
    >
      <ActionButton description="Replace Machine" icon="mdi:restart" onClick={() => {}} />
    </ConfirmButton>
  );
}

/**
 * Pause CAPI reconciliation for this Machine.
 *
 * FIX (action bar stability): renders a disabled button when already paused
 * instead of conditionally mounting/unmounting, so the bar layout does not
 * shift after the user clicks pause.
 */
export function PauseMachineAction({ machine }: { machine: Machine }) {
  const { enqueueSnackbar } = useSnackbar();

  const handlePause = async () => {
    try {
      await machine.patch({
        metadata: { annotations: { 'cluster.x-k8s.io/paused': 'true' } },
      });
      enqueueSnackbar('Machine reconciliation paused', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(`Failed to pause machine: ${getErrorMessage(err)}`, { variant: 'error' });
    }
  };

  return (
    <ActionButton
      description="Pause Reconciliation"
      icon="mdi:pause-circle-outline"
      onClick={handlePause}
    />
  );
}

/**
 * Resume CAPI reconciliation for this Machine.
 */
export function ResumeMachineAction({ machine }: { machine: Machine }) {
  const { enqueueSnackbar } = useSnackbar();
  const handleResume = async () => {
    try {
      await machine.patch({
        metadata: { annotations: { 'cluster.x-k8s.io/paused': null } },
      });
      enqueueSnackbar('Machine reconciliation resumed', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(`Failed to resume machine: ${getErrorMessage(err)}`, { variant: 'error' });
    }
  };

  return (
    <ActionButton
      description="Resume Reconciliation"
      icon="mdi:play-circle-outline"
      onClick={handleResume}
    />
  );
}

/**
 * Returns the cloud provider console URL for an instance, given its CAPI
 * provider ID string. Returns null for unknown or unsupported providers.
 */
function getProviderUrl(providerID: string): string | null {
  // AWS: aws:///us-east-1a/i-0abc123def456
  const awsMatch = providerID.match(
    /^aws:\/\/\/([a-z]{2}-[a-z]+-\d+(?:-[a-z]+-\d+)?)[a-z]\/(i-[a-zA-Z0-9]+)$/
  );
  if (awsMatch) {
    const region = awsMatch[1];
    const instanceId = awsMatch[2];
    return `https://${region}.console.aws.amazon.com/ec2/v2/home?region=${region}#InstanceDetails:instanceId=${instanceId}`;
  }

  // Azure: azure:///subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Compute/virtualMachines/{name}
  const azureMatch = providerID.match(
    /^azure:\/\/\/subscriptions\/([^/]+)\/resourceGroups\/([^/]+)\/providers\/Microsoft\.Compute\/virtualMachines\/([^/]+)$/i
  );
  if (azureMatch) {
    const [, subscriptionId, resourceGroup, vmName] = azureMatch;
    return `https://portal.azure.com/#@/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Compute/virtualMachines/${vmName}/overview`;
  }

  // Docker / CAPD: docker:///…
  if (providerID.startsWith('docker:///')) {
    return 'https://desktop.docker.com/dashboard/containers';
  }

  return null;
}

/**
 * Open provider instance console.
 */
export function ProviderInstanceAction({ providerID }: { providerID: string }) {
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ActionButton
      description="Open Provider Instance"
      icon="mdi:open-in-new"
      onClick={() => {
        const url = getProviderUrl(providerID);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          enqueueSnackbar(
            'Provider console link is not available for this infrastructure provider.',
            { variant: 'info' }
          );
        }
      }}
    />
  );
}

/**
 * Returns the full set of operational actions for a Machine detail page.
 */
export function getMachineActions(machine: Machine) {
  const status = machine.jsonData?.status;

  // nodeRef is corev1.ObjectReference — name is a direct field, not nested
  const nodeName = status?.nodeRef?.name;
  const clusterName = machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
  const providerID = machine.spec?.providerID;

  const actions: React.ReactElement[] = [];

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
