/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Pod from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import type { SnackbarKey } from 'notistack';
import { useSnackbar } from 'notistack';
import React from 'react';
import type { KService } from '../../../../resources/knative';
import { useNotify } from '../../../common/notifications/useNotify';

type KServiceActionId = 'redeploy' | 'restart';

type UseKServiceActionsOptions = {
  onDone?: () => void;
};

/**
 * Restart a KService by deleting its pods one by one.
 *
 * We intentionally avoid "rollout restart" via Deployment patching here, because the Knative
 * control plane may reconcile it back quickly and it may not create an observable change.
 * Deleting pods directly triggers the controller to recreate them.
 */
const POD_DELETE_DELAY_MS = 2000;
const POD_DELETION_TIMEOUT_MS = 600_000;
const POD_DELETION_POLL_INTERVAL_MS = 1_000;
const POD_RECOVERY_TIMEOUT_MS = 60_000;
const POD_RECOVERY_POLL_INTERVAL_MS = 2_000;

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function countRunningPods(pods: Pod[]) {
  return pods.filter(p => !p.metadata.deletionTimestamp && (p.status?.phase ?? '') === 'Running')
    .length;
}

async function waitForPodDeletion(params: {
  cluster: string;
  namespace: string;
  labelSelector: string;
  podName: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}) {
  const {
    cluster,
    namespace,
    labelSelector,
    podName,
    timeoutMs = POD_DELETION_TIMEOUT_MS,
    pollIntervalMs = POD_DELETION_POLL_INTERVAL_MS,
  } = params;

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const pods = await listPodsByLabelSelector({ cluster, namespace, labelSelector });
      const stillExists = pods.some(p => p.metadata.name === podName);
      if (!stillExists) {
        return true;
      }
    } catch {
      // Ignore transient list errors and retry until timeout.
    }

    await sleep(pollIntervalMs);
  }

  return false;
}

async function waitForRunningPodRecovery(params: {
  cluster: string;
  namespace: string;
  labelSelector: string;
  targetRunningCount: number;
  timeoutMs?: number;
  pollIntervalMs?: number;
  onTick?: (info: { runningCount: number }) => void;
}) {
  const {
    cluster,
    namespace,
    labelSelector,
    targetRunningCount,
    timeoutMs = POD_RECOVERY_TIMEOUT_MS,
    pollIntervalMs = POD_RECOVERY_POLL_INTERVAL_MS,
    onTick,
  } = params;

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const pods = await listPodsByLabelSelector({ cluster, namespace, labelSelector });
      const runningCount = countRunningPods(pods);
      if (onTick) {
        onTick({ runningCount });
      }
      if (runningCount >= targetRunningCount) {
        return true;
      }
    } catch {
      // Ignore transient list errors and retry until timeout.
    }

    await sleep(pollIntervalMs);
  }

  return false;
}

async function listPodsByLabelSelector(params: {
  cluster: string;
  namespace: string;
  labelSelector: string;
}): Promise<Pod[]> {
  const { cluster, namespace, labelSelector } = params;

  return new Promise<Pod[]>((resolve, reject) => {
    let cancelFn: (() => void) | null = null;

    const handleList = (items: Pod[]) => {
      // Ensure the Pod instances are associated with the correct cluster.
      // Without this, subsequent operations like `delete` may target the wrong cluster.
      const itemsWithCluster = items.map(item => {
        item.cluster = cluster;
        return item;
      });

      resolve(itemsWithCluster);
      if (cancelFn) {
        cancelFn();
      }
    };

    const handleError = (err: unknown) => {
      reject(err);
      if (cancelFn) {
        cancelFn();
      }
    };

    const request = Pod.apiList(handleList, handleError, {
      namespace,
      cluster,
      queryParams: { labelSelector },
    });

    request()
      .then(cancel => {
        cancelFn = cancel;
      })
      .catch(err => {
        handleError(err);
      });
  });
}

export function useKServiceActions(
  kservice: KService | null | undefined,
  options?: UseKServiceActionsOptions
) {
  const [acting, setActing] = React.useState<KServiceActionId | null>(null);
  const { notifyError, notifyInfo } = useNotify();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const onDone = options?.onDone;

  /**
   * Restart progress snackbar.
   *
   * We intentionally use "dismiss + show" updates (close then enqueue) instead of trying
   * to "update" a snackbar by key, following the upstream Headlamp pattern.
   */
  const progressSnackbarKeyRef = React.useRef<SnackbarKey | null>(null);

  function setProgress(message: string) {
    if (progressSnackbarKeyRef.current !== null) {
      closeSnackbar(progressSnackbarKeyRef.current);
    }

    progressSnackbarKeyRef.current = enqueueSnackbar(message, {
      variant: 'info',
      persist: true,
    });
  }

  function clearProgress() {
    if (progressSnackbarKeyRef.current !== null) {
      closeSnackbar(progressSnackbarKeyRef.current);
      progressSnackbarKeyRef.current = null;
    }
  }

  React.useEffect(() => () => clearProgress(), [closeSnackbar]);

  async function handleRedeploy() {
    if (acting !== null) {
      return;
    }

    if (!kservice || !kservice.cluster) {
      return;
    }

    setActing('redeploy');
    try {
      const now = new Date().toISOString();
      await kservice.patch({
        spec: {
          template: {
            metadata: {
              annotations: {
                'knative.headlamp.dev/redeployAt': now,
              },
            },
          },
        },
      });
      notifyInfo('Redeploy requested');
      if (onDone) {
        onDone();
      }
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(detail ? `Redeploy failed: ${detail}` : 'Redeploy failed');
    } finally {
      setActing(null);
    }
  }

  async function handleRestart() {
    if (acting !== null) {
      return;
    }

    if (!kservice || !kservice.cluster) {
      return;
    }

    const namespace = kservice.metadata.namespace;
    const serviceName = kservice.metadata.name;

    setActing('restart');
    try {
      if (!namespace) {
        notifyError('Restart failed: namespace not found');
        return;
      }

      if (!serviceName) {
        notifyError('Restart failed: KService name not found');
        return;
      }

      // Knative sets this label on pods for all revisions of the KService.
      const labelSelector = `serving.knative.dev/service=${serviceName}`;

      const pods = await listPodsByLabelSelector({
        cluster: kservice.cluster,
        namespace,
        labelSelector,
      });

      const deletablePods = pods
        .filter(pod => !pod.metadata.deletionTimestamp)
        .sort((a, b) => {
          const aCreationTime = new Date(a.metadata.creationTimestamp).getTime();
          const bCreationTime = new Date(b.metadata.creationTimestamp).getTime();
          return aCreationTime - bCreationTime;
        });

      if (deletablePods.length === 0) {
        notifyInfo('No pods found for KService');
        return;
      }

      let failedCount = 0;

      for (let i = 0; i < deletablePods.length; i += 1) {
        const podName = deletablePods[i].metadata.name!;

        let runningBefore = 0;
        let podToDelete: Pod | null = null;
        try {
          const currentPods = await listPodsByLabelSelector({
            cluster: kservice.cluster,
            namespace,
            labelSelector,
          });
          runningBefore = countRunningPods(currentPods);
          podToDelete = currentPods.find(p => p.metadata.name === podName) ?? null;
        } catch {
          // Fall back to deleting the original instance if listing failed.
          podToDelete = deletablePods[i];
        }

        if (!podToDelete || podToDelete.metadata.deletionTimestamp) {
          continue;
        }

        try {
          setProgress(
            `Restart in progress: deleting pod ${podName} (${i + 1}/${deletablePods.length})`
          );
          await podToDelete.delete();
          const deleted = await waitForPodDeletion({
            cluster: kservice.cluster,
            namespace,
            labelSelector,
            podName,
          });
          if (!deleted) {
            notifyError(`Timed out waiting for pod deletion: ${podName}`);
          }
        } catch (err: unknown) {
          failedCount += 1;
          const error = err as { message?: string } | undefined;
          const detail = error?.message?.trim();
          notifyError(
            detail
              ? `Failed to delete pod ${podName}: ${detail}`
              : `Failed to delete pod ${podName}`
          );
        }

        const recovered = await waitForRunningPodRecovery({
          cluster: kservice.cluster,
          namespace,
          labelSelector,
          targetRunningCount: runningBefore,
        });

        if (!recovered) {
          notifyError(`Timed out waiting for replacement pod after deleting ${podName}`);
        }

        if (i < deletablePods.length - 1) {
          await sleep(POD_DELETE_DELAY_MS);
        }
      }

      if (failedCount > 0) {
        notifyError(`Restart completed with errors (${failedCount}/${deletablePods.length})`);
      } else {
        notifyInfo('Restart completed successfully');
      }
      if (onDone) {
        onDone();
      }
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(detail ? `Restart failed: ${detail}` : 'Restart failed');
    } finally {
      clearProgress();
      setActing(null);
    }
  }

  return {
    acting,
    handleRedeploy,
    handleRestart,
  };
}
