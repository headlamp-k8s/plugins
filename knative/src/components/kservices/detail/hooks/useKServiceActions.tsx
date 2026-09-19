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
import { restartKServicePods } from './restartKServicePods';

type KServiceActionId = 'redeploy' | 'restart';

type UseKServiceActionsOptions = {
  onDone?: () => void;
};

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
              name: null as any,
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

      await restartKServicePods({
        clearProgress,
        cluster: kservice.cluster,
        listPodsByLabelSelector,
        namespace,
        notifyError,
        notifyInfo,
        onDone,
        serviceName,
        setProgress,
      });
    } catch (err: unknown) {
      const error = err as { message?: string } | undefined;
      const detail = error?.message?.trim();
      notifyError(detail ? `Restart failed: ${detail}` : 'Restart failed');
    } finally {
      setActing(null);
    }
  }

  return {
    acting,
    handleRedeploy,
    handleRestart,
  };
}
