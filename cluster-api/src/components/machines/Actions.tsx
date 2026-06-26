import { Router, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton, ConfirmButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useSnackbar } from 'notistack';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { Machine } from '../../resources/machine';
import { getErrorMessage, PauseReconciliationAction, ResumeReconciliationAction } from '../actions';

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
  const { t } = useTranslation();
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();

  const handleViewNode = () => {
    if (!clusterName) {
      console.warn('[ViewNodeAction] No cluster name provided');
      enqueueSnackbar(t('Workload cluster information is unavailable.'), { variant: 'warning' });
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
      enqueueSnackbar(t('Error navigating to Node: {{error}}', { error: getErrorMessage(error) }), {
        variant: 'error',
      });
    }
  };

  return <ActionButton description={t('View Node')} icon="mdi:server" onClick={handleViewNode} />;
}

/**
 * Replace machine by deleting it.
 * CAPI controllers automatically provision a replacement via the owning
 * MachineSet or MachineDeployment.
 */
export function ReplaceMachineAction({ machine }: { machine: Machine }) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ConfirmButton
      confirmTitle={t('Replace Machine "{{name}}"?', { name: machine.metadata?.name })}
      confirmDescription={t(
        'This deletes the current Machine resource. CAPI controllers will automatically provision a replacement.'
      )}
      onConfirm={async () => {
        try {
          await machine.delete();
          enqueueSnackbar(t('Machine replacement triggered'), { variant: 'success' });
        } catch (err: any) {
          enqueueSnackbar(
            t('Failed to replace machine: {{error}}', { error: getErrorMessage(err) }),
            {
              variant: 'error',
            }
          );
        }
      }}
    >
      <ActionButton description={t('Replace Machine')} icon="mdi:restart" onClick={() => {}} />
    </ConfirmButton>
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
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  return (
    <ActionButton
      description={t('Open Provider Instance')}
      icon="mdi:open-in-new"
      onClick={() => {
        const url = getProviderUrl(providerID);
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          enqueueSnackbar(
            t('Provider console link is not available for this infrastructure provider.'),
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
    actions.push(<ResumeReconciliationAction key="resume" resource={machine} />);
  } else {
    actions.push(<PauseReconciliationAction key="pause" resource={machine} />);
  }

  if (providerID) {
    actions.push(<ProviderInstanceAction key="provider-instance" providerID={providerID} />);
  }

  return actions;
}
