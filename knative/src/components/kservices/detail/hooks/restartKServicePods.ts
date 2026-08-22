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

const POD_DELETE_DELAY_MS = 2000;
const POD_DELETION_TIMEOUT_MS = 600_000;
const POD_DELETION_POLL_INTERVAL_MS = 1_000;
const POD_RECOVERY_TIMEOUT_MS = 60_000;
const POD_RECOVERY_POLL_INTERVAL_MS = 2_000;

type RestartPod = {
  cluster: string;
  delete: () => Promise<unknown>;
  metadata: {
    creationTimestamp: string;
    deletionTimestamp?: string;
    name?: string;
  };
  status?: { phase?: string };
};

type ListPodsByLabelSelector = (params: {
  cluster: string;
  namespace: string;
  labelSelector: string;
}) => Promise<RestartPod[]>;

type RestartKServicePodsOptions = {
  clearProgress: () => void;
  cluster: string;
  listPodsByLabelSelector: ListPodsByLabelSelector;
  namespace: string;
  notifyError: (message: string) => void;
  notifyInfo: (message: string) => void;
  onDone?: () => void;
  serviceName: string;
  setProgress: (message: string) => void;
};

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function countRunningPods(pods: RestartPod[]) {
  return pods.filter(p => !p.metadata.deletionTimestamp && (p.status?.phase ?? '') === 'Running')
    .length;
}

async function waitForPodDeletion(params: {
  cluster: string;
  namespace: string;
  labelSelector: string;
  podName: string;
  listPodsByLabelSelector: ListPodsByLabelSelector;
  timeoutMs?: number;
  pollIntervalMs?: number;
}) {
  const {
    cluster,
    namespace,
    labelSelector,
    podName,
    listPodsByLabelSelector,
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
  listPodsByLabelSelector: ListPodsByLabelSelector;
  timeoutMs?: number;
  pollIntervalMs?: number;
  onTick?: (info: { runningCount: number }) => void;
}) {
  const {
    cluster,
    namespace,
    labelSelector,
    targetRunningCount,
    listPodsByLabelSelector,
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

/**
 * Restart a KService by deleting its Pods one by one.
 *
 * We intentionally avoid "rollout restart" via Deployment patching here, because the Knative
 * control plane may reconcile it back quickly and it may not create an observable change.
 * Deleting Pods directly triggers the controller to recreate them.
 */
export async function restartKServicePods(options: RestartKServicePodsOptions) {
  const {
    clearProgress,
    cluster,
    listPodsByLabelSelector,
    namespace,
    notifyError,
    notifyInfo,
    onDone,
    serviceName,
    setProgress,
  } = options;

  try {
    // Knative sets this label on pods for all revisions of the KService.
    const labelSelector = `serving.knative.dev/service=${serviceName}`;
    const pods = await listPodsByLabelSelector({ cluster, namespace, labelSelector });
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

    let restartFailed = false;

    for (let i = 0; i < deletablePods.length; i += 1) {
      const podName = deletablePods[i].metadata.name!;

      let runningBefore = 0;
      let podToDelete: RestartPod | null = null;
      try {
        const currentPods = await listPodsByLabelSelector({ cluster, namespace, labelSelector });
        runningBefore = countRunningPods(currentPods);
        podToDelete = currentPods.find(p => p.metadata.name === podName) ?? null;
      } catch (err: unknown) {
        const error = err as { message?: string } | undefined;
        const detail = error?.message?.trim();
        notifyError(
          detail
            ? `Failed to check pod availability before deleting ${podName}: ${detail}`
            : `Failed to check pod availability before deleting ${podName}`
        );
        restartFailed = true;
        break;
      }

      if (!podToDelete) {
        notifyError(`Restart stopped because pod ${podName} is no longer present`);
        restartFailed = true;
        break;
      }

      if (podToDelete.metadata.deletionTimestamp) {
        notifyError(`Restart stopped because pod ${podName} is already terminating`);
        restartFailed = true;
        break;
      }

      try {
        setProgress(
          `Restart in progress: deleting pod ${podName} (${i + 1}/${deletablePods.length})`
        );
        await podToDelete.delete();
        const deleted = await waitForPodDeletion({
          cluster,
          namespace,
          labelSelector,
          podName,
          listPodsByLabelSelector,
        });
        if (!deleted) {
          notifyError(`Timed out waiting for pod deletion: ${podName}`);
          restartFailed = true;
          break;
        }
      } catch (err: unknown) {
        const error = err as { message?: string } | undefined;
        const detail = error?.message?.trim();
        notifyError(
          detail ? `Failed to delete pod ${podName}: ${detail}` : `Failed to delete pod ${podName}`
        );
        restartFailed = true;
        break;
      }

      const recovered = await waitForRunningPodRecovery({
        cluster,
        namespace,
        labelSelector,
        targetRunningCount: runningBefore,
        listPodsByLabelSelector,
      });

      if (!recovered) {
        notifyError(`Timed out waiting for replacement pod after deleting ${podName}`);
        restartFailed = true;
        break;
      }

      if (i < deletablePods.length - 1) {
        await sleep(POD_DELETE_DELAY_MS);
      }
    }

    if (!restartFailed) {
      notifyInfo('Restart completed successfully');
    }
    if (onDone) {
      onDone();
    }
  } finally {
    clearProgress();
  }
}
