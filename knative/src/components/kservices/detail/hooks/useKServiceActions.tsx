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

import React from 'react';
import type { KService } from '../../../../resources/knative';
import { errorDetail, withDetail } from '../../../../utils/error';
import { useNotify } from '../../../common/notifications/useNotify';
import { useKServiceRestart } from '../restart/KServiceRestartProvider';

type KServiceActionId = 'redeploy' | 'restart';

type UseKServiceActionsOptions = {
  onDone?: () => void;
};

/**
 * Provides the Redeploy and Restart actions of a Knative Service.
 *
 * @param kservice - The Knative Service to act on; the actions do nothing until it has loaded.
 * @param options - `onDone`, called after a successful redeploy, or once a restart has reported its
 * result for the running Deployments.
 * @returns `acting`, the action in progress or null, and the `handleRedeploy` and `handleRestart`
 * handlers. Must be used within a `KServiceRestartProvider`, which keeps the restart going when the
 * component that started it is gone.
 */
export function useKServiceActions(
  kservice: KService | null | undefined,
  options?: UseKServiceActionsOptions
) {
  const [redeploying, setRedeploying] = React.useState(false);
  const { notifyError, notifyInfo } = useNotify();
  const { restarting, restart } = useKServiceRestart(kservice);
  const acting: KServiceActionId | null = restarting ? 'restart' : redeploying ? 'redeploy' : null;
  const onDone = options?.onDone;

  async function handleRedeploy() {
    if (acting !== null) {
      return;
    }

    if (!kservice || !kservice.cluster) {
      return;
    }

    setRedeploying(true);
    try {
      const now = new Date().toISOString();
      await kservice.patch({
        spec: {
          template: {
            metadata: {
              name: null,
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
      notifyError(withDetail('Redeploy failed', errorDetail(err)));
    } finally {
      setRedeploying(false);
    }
  }

  /**
   * Starts restarting the Knative Service's Pods with a Deployment rollout; the result is reported
   * once the rollout is over. Does nothing while another action is running or the Knative Service
   * has not loaded.
   */
  function handleRestart() {
    if (acting !== null) {
      return;
    }

    if (!kservice || !kservice.cluster) {
      return;
    }

    if (!kservice.metadata.namespace) {
      notifyError('Restart failed: namespace not found');
      return;
    }

    if (!kservice.metadata.name) {
      notifyError('Restart failed: KService name not found');
      return;
    }

    restart(onDone);
  }

  return {
    acting,
    handleRedeploy,
    handleRestart,
  };
}
