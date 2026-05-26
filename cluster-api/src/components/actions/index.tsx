import { Headlamp } from '@kinvolk/headlamp-plugin/lib';
import { ActionButton } from '@kinvolk/headlamp-plugin/lib/components/common';
import Secret from '@kinvolk/headlamp-plugin/lib/K8s/secret';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Machine } from 'src/resources/machine';
import { Cluster } from '../../resources/cluster';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { MachineDeployment } from '../../resources/machinedeployment';
import { MachineHealthCheck } from '../../resources/machinehealthcheck';
import { MachinePool } from '../../resources/machinepool';
import { MachineSet } from '../../resources/machineset';

const PAUSED_ANNOTATION = 'cluster.x-k8s.io/paused';

export interface GetKubeconfigActionProps {
  resource: Cluster;
}

export interface ClusterScaleActionProps {
  resource: Cluster;
}

export interface ReconciliationActionProps {
  resource:
    | MachineDeployment
    | MachinePool
    | KubeadmControlPlane
    | MachineSet
    | Cluster
    | MachineHealthCheck
    | Machine;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Connect a Cluster to Headlamp using its kubeconfig Secret.
 *
 * Contract: secret.jsonData.data.value is a base64-encoded kubeconfig YAML
 * (standard Kubernetes Secret encoding). We decode it via TextDecoder so that
 * binary cert bytes in the base64 payload do not cause atob() to throw
 * InvalidCharacterError.
 */
async function connectClusterToHeadlamp(
  resource: Cluster,
  secret: Secret | null | undefined,
  secretError: unknown,
  enqueueSnackbar: (message: string, options?: any) => void,
  loadingRef: React.MutableRefObject<boolean>
) {
  if (loadingRef.current) return;

  const secretName = `${resource.metadata?.name}-kubeconfig`;
  const namespace = resource.metadata?.namespace || 'default';

  if (!secret) {
    const msg = secretError
      ? `Failed to load Secret "${secretName}": ${getErrorMessage(secretError)}`
      : `Secret "${secretName}" is not available yet in namespace "${namespace}". Please wait for the cluster to finish provisioning and try again.`;
    enqueueSnackbar(msg, { variant: secretError ? 'error' : 'warning' });
    return;
  }

  const kubeconfigBase64 = secret.jsonData?.data?.value;
  const infraKind = resource.spec?.infrastructureRef?.kind;

  if (!kubeconfigBase64) {
    enqueueSnackbar('Kubeconfig not available yet. Cluster may still be provisioning.', {
      variant: 'warning',
    });
    return;
  }

  if (infraKind === 'DockerCluster') {
    enqueueSnackbar(
      `Docker provider detected. Run:\nkind get kubeconfig --name ${resource.metadata?.name} > ${resource.metadata?.name}.kubeconfig`,
      { variant: 'warning' }
    );
    return;
  }

  try {
    loadingRef.current = true;
    enqueueSnackbar('Connecting to cluster...', { variant: 'info' });

    const bytes = Uint8Array.from(atob(kubeconfigBase64), c => c.charCodeAt(0));
    const kubeconfig = new TextDecoder('utf-8').decode(bytes);

    await Headlamp.setCluster({ kubeconfig });
    enqueueSnackbar('Cluster connected successfully', { variant: 'success' });
  } catch (error) {
    enqueueSnackbar(`Failed to connect: ${getErrorMessage(error)}`, { variant: 'error' });
  } finally {
    loadingRef.current = false;
  }
}

export function GetKubeconfigAction(props: GetKubeconfigActionProps) {
  const { resource } = props;
  const loadingRef = useRef(false);
  const { enqueueSnackbar } = useSnackbar();

  const secretName = `${resource.metadata?.name}-kubeconfig`;
  const namespace = resource.metadata?.namespace || 'default';
  const secretQuery = Secret.useGet(secretName, namespace);
  const secret = secretQuery.data;

  return (
    <ActionButton
      description="Connect Cluster"
      longDescription="Connect this workload cluster to Headlamp using its generated kubeconfig"
      icon={'mdi:cloud-download'}
      onClick={() => {
        if (secretQuery.isLoading) {
          enqueueSnackbar(
            'Cluster connection details are still loading. Please try again shortly.',
            { variant: 'info' }
          );
          return;
        }
        connectClusterToHeadlamp(resource, secret, secretQuery.error, enqueueSnackbar, loadingRef);
      }}
    />
  );
}

/**
 * Standalone (non-topology) scale inputs.
 * Extracted into its own component so the three useList hooks only run
 * when the dialog is open and the cluster is not topology-managed,
 * avoiding unnecessary watches on every Cluster detail page render.
 */
interface StandaloneScaleInputsProps {
  name: string;
  namespace: string;
  drafts: Record<string, number>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onLoaded: (
    controlPlanes: KubeadmControlPlane[] | null,
    machineDeployments: MachineDeployment[] | null,
    machinePools: MachinePool[] | null,
    errors: unknown[]
  ) => void;
  renderScaleRow: (label: string, draftKey: string) => JSX.Element;
}

function StandaloneScaleInputs({
  name,
  namespace,
  onLoaded,
  renderScaleRow,
}: StandaloneScaleInputsProps) {
  const [controlPlanes, controlPlanesError] = KubeadmControlPlane.useList({
    namespace,
    labelSelector: `cluster.x-k8s.io/cluster-name=${name}`,
  });
  const [machineDeployments, machineDeploymentsError] = MachineDeployment.useList({
    namespace,
    labelSelector: `cluster.x-k8s.io/cluster-name=${name}`,
  });
  const [machinePools, machinePoolsError] = MachinePool.useList({
    namespace,
    labelSelector: `cluster.x-k8s.io/cluster-name=${name}`,
  });

  const errors = [controlPlanesError, machineDeploymentsError, machinePoolsError].filter(Boolean);
  const loading =
    controlPlanes === undefined || machineDeployments === undefined || machinePools === undefined;
  const stableOnLoaded = useCallback(onLoaded, []);

  useEffect(() => {
    stableOnLoaded(controlPlanes ?? null, machineDeployments ?? null, machinePools ?? null, errors);
  }, [controlPlanes, machineDeployments, machinePools, stableOnLoaded]);

  if (loading) return <Typography>Loading scalable resources...</Typography>;

  const hasResources =
    (controlPlanes?.length ?? 0) > 0 ||
    (machineDeployments?.length ?? 0) > 0 ||
    (machinePools?.length ?? 0) > 0;

  return (
    <>
      {controlPlanes?.map(cp =>
        renderScaleRow(`Control Plane: ${cp.metadata.name}`, `cp-${cp.metadata.name}`)
      )}
      {machineDeployments?.map(md =>
        renderScaleRow(`Worker MD: ${md.metadata.name}`, `md-${md.metadata.name}`)
      )}
      {machinePools?.map(pool =>
        renderScaleRow(`Worker Pool: ${pool.metadata.name}`, `pool-${pool.metadata.name}`)
      )}
      {!hasResources && errors.length === 0 && (
        <Typography>No scalable resources found for this cluster.</Typography>
      )}
    </>
  );
}
const MIN_REPLICAS_CONTROL_PLANE = 1;
const MIN_REPLICAS_WORKERS = 0;
function isControlPlaneKey(key: string): boolean {
  return key === 'cp' || key.startsWith('cp-');
}

export function ClusterScaleAction({ resource: cluster }: ClusterScaleActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const hasInitializedDrafts = useRef(false);
  const [standaloneErrors, setStandaloneErrors] = useState<unknown[]>([]);
  const [standaloneResources, setStandaloneResources] = useState<{
    controlPlanes: KubeadmControlPlane[] | null;
    machineDeployments: MachineDeployment[] | null;
    machinePools: MachinePool[] | null;
  }>({ controlPlanes: null, machineDeployments: null, machinePools: null });

  const name = cluster.metadata?.name;
  const namespace = cluster.metadata?.namespace;
  const topology = cluster.spec?.topology;
  const isTopology = !!topology;

  useEffect(() => {
    if (!open || !isTopology || !topology) return;
    if (hasInitializedDrafts.current) return;

    const initialDrafts: Record<string, number> = {};
    initialDrafts['cp'] = topology.controlPlane?.replicas ?? 1;
    topology.workers?.machineDeployments?.forEach((md, i) => {
      initialDrafts[`md-${i}`] = md.replicas ?? 0;
    });
    topology.workers?.machinePools?.forEach((pool, i) => {
      initialDrafts[`pool-${i}`] = pool.replicas ?? 0;
    });

    setDrafts(initialDrafts);
    hasInitializedDrafts.current = true;
  }, [open, isTopology, topology]);

  const handleStandaloneLoaded = (
    controlPlanes: KubeadmControlPlane[] | null,
    machineDeployments: MachineDeployment[] | null,
    machinePools: MachinePool[] | null,
    errors: unknown[]
  ) => {
    setStandaloneResources({ controlPlanes, machineDeployments, machinePools });
    setStandaloneErrors(errors);

    if (hasInitializedDrafts.current || errors.length > 0) return;
    if (controlPlanes === null || machineDeployments === null || machinePools === null) return;

    const initialDrafts: Record<string, number> = {};
    controlPlanes.forEach(cp => {
      initialDrafts[`cp-${cp.metadata.name}`] = cp.spec?.replicas ?? 1;
    });
    machineDeployments.forEach(md => {
      initialDrafts[`md-${md.metadata.name}`] = md.spec?.replicas ?? 0;
    });
    machinePools.forEach(pool => {
      initialDrafts[`pool-${pool.metadata.name}`] = pool.spec?.replicas ?? 0;
    });
    setDrafts(initialDrafts);
    hasInitializedDrafts.current = true;
  };

  const handleClose = () => {
    setOpen(false);
    hasInitializedDrafts.current = false;
    setDrafts({});
    setStandaloneErrors([]);
    setStandaloneResources({ controlPlanes: null, machineDeployments: null, machinePools: null });
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      if (isTopology && topology) {
        const controlPlanePatch =
          'cp' in drafts ? { controlPlane: { replicas: drafts['cp'] } } : {};

        const mdPatches = topology.workers?.machineDeployments?.map((md, i) => ({
          ...md,
          replicas: drafts[`md-${i}`] ?? md.replicas,
        }));
        const poolPatches = topology.workers?.machinePools?.map((pool, i) => ({
          ...pool,
          replicas: drafts[`pool-${i}`] ?? pool.replicas,
        }));

        const workersPatch =
          mdPatches !== undefined || poolPatches !== undefined
            ? {
                workers: {
                  ...(mdPatches !== undefined ? { machineDeployments: mdPatches } : {}),
                  ...(poolPatches !== undefined ? { machinePools: poolPatches } : {}),
                },
              }
            : {};

        await cluster.patch({
          spec: {
            topology: {
              ...controlPlanePatch,
              ...workersPatch,
            },
          },
        });
      } else {
        const { controlPlanes, machineDeployments, machinePools } = standaloneResources;
        const promises = [];
        for (const [key, val] of Object.entries(drafts)) {
          let res: any;
          if (key.startsWith('cp-')) {
            res = controlPlanes?.find(r => r.metadata.name === key.substring(3));
          } else if (key.startsWith('md-')) {
            res = machineDeployments?.find(r => r.metadata.name === key.substring(3));
          } else if (key.startsWith('pool-')) {
            res = machinePools?.find(r => r.metadata.name === key.substring(5));
          }
          if (res && res.spec?.replicas !== val) {
            promises.push(res.patch({ spec: { replicas: val } }));
          }
        }
        await Promise.all(promises);
      }
      enqueueSnackbar('Scaling triggered successfully', { variant: 'success' });
      handleClose();
    } catch (error) {
      enqueueSnackbar(`Failed to scale: ${getErrorMessage(error)}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderScaleRow = (label: string, draftKey: string) => {
    const replicas = drafts[draftKey] ?? 0;
    const isCP = isControlPlaneKey(draftKey);
    const minReplicas = isCP ? MIN_REPLICAS_CONTROL_PLANE : MIN_REPLICAS_WORKERS;
    const showOddWarning = isCP && replicas > 0 && replicas % 2 === 0;

    return (
      <Box
        display="flex"
        flexDirection="column"
        key={draftKey}
        sx={{ py: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="body2">{label}</Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <ActionButton
              description={`Decrease ${label} replicas`}
              icon="mdi:minus-circle-outline"
              onClick={() =>
                setDrafts(prev => ({
                  ...prev,
                  [draftKey]: Math.max(minReplicas, replicas - 1),
                }))
              }
            />
            <Typography sx={{ minWidth: '2ch', textAlign: 'center', fontWeight: 'bold' }}>
              {replicas}
            </Typography>
            <ActionButton
              description={`Increase ${label} replicas`}
              icon="mdi:plus-circle-outline"
              onClick={() => setDrafts(prev => ({ ...prev, [draftKey]: replicas + 1 }))}
            />
          </Box>
        </Box>
        {showOddWarning && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
            Even replica counts can break etcd quorum. Use 1, 3, or 5.
          </Typography>
        )}
      </Box>
    );
  };

  const applyDisabled =
    loading ||
    standaloneErrors.length > 0 ||
    (!isTopology &&
      (standaloneResources.controlPlanes === null ||
        standaloneResources.machineDeployments === null ||
        standaloneResources.machinePools === null));

  return (
    <>
      <ActionButton description="Scale Cluster" icon="mdi:resize" onClick={() => setOpen(true)} />
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Scale Cluster &quot;{name}&quot;</DialogTitle>
        <DialogContent dividers>
          {standaloneErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load scalable resources: {standaloneErrors.map(getErrorMessage).join(' ')}
            </Alert>
          )}
          {isTopology ? (
            <>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Topology Managed
              </Typography>
              {renderScaleRow('Control Plane', 'cp')}
              {topology.workers?.machineDeployments?.map((md, i) =>
                renderScaleRow(`Worker MD: ${md.name}`, `md-${i}`)
              )}
              {topology.workers?.machinePools?.map((pool, i) =>
                renderScaleRow(`Worker Pool: ${pool.name}`, `pool-${i}`)
              )}
            </>
          ) : (
            <>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Standalone Resources
              </Typography>
              {open && (
                <StandaloneScaleInputs
                  name={name}
                  namespace={namespace}
                  drafts={drafts}
                  setDrafts={setDrafts}
                  onLoaded={handleStandaloneLoaded}
                  renderScaleRow={renderScaleRow}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleApply}
            color="primary"
            variant="contained"
            disabled={applyDisabled}
          >
            {loading ? 'Applying...' : 'Apply Scaling'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/**
 * PauseReconciliationAction pauses CAPI reconciliation for a resource.
 */
export function PauseReconciliationAction({ resource }: ReconciliationActionProps) {
  const { enqueueSnackbar } = useSnackbar();
  const handlePause = async () => {
    try {
      await resource.patch({
        metadata: { annotations: { [PAUSED_ANNOTATION]: 'true' } },
      });
      enqueueSnackbar(`${resource.kind} reconciliation paused`, { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(`Failed to pause reconciliation: ${getErrorMessage(error)}`, {
        variant: 'error',
      });
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
 * ResumeReconciliationAction resumes CAPI reconciliation for a resource.
 */
export function ResumeReconciliationAction({ resource }: ReconciliationActionProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleResume = async () => {
    try {
      await resource.patch({
        metadata: { annotations: { [PAUSED_ANNOTATION]: null } },
      });
      enqueueSnackbar(`${resource.kind} reconciliation resumed`, { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(`Failed to resume reconciliation: ${getErrorMessage(error)}`, {
        variant: 'error',
      });
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
 * Returns pause/resume actions for any pausable CAPI resource.
 */
export function getPausableReconciliationActions(resource: ReconciliationActionProps['resource']) {
  const isPaused = resource.metadata?.annotations?.[PAUSED_ANNOTATION] === 'true';
  return isPaused
    ? [<ResumeReconciliationAction key="resume" resource={resource} />]
    : [<PauseReconciliationAction key="pause" resource={resource} />];
}

export function getMachineDeploymentActions(resource: MachineDeployment) {
  return getPausableReconciliationActions(resource);
}

export function getMachinePoolActions(resource: MachinePool) {
  return getPausableReconciliationActions(resource);
}

export function getKubeadmControlPlaneActions(resource: KubeadmControlPlane) {
  return getPausableReconciliationActions(resource);
}

export function getMachineSetActions(resource: MachineSet) {
  return getPausableReconciliationActions(resource);
}

export function getMachineHealthCheckActions(resource: MachineHealthCheck) {
  return getPausableReconciliationActions(resource);
}

export function getClusterActions(resource: Cluster) {
  return [
    <ClusterScaleAction key="scale" resource={resource} />,
    <GetKubeconfigAction key="get-kubeconfig" resource={resource} />,
    ...getPausableReconciliationActions(resource),
  ];
}
