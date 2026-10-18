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

import type { KubeDeployment } from '@kinvolk/headlamp-plugin/lib/k8s/deployment';
import { vi } from 'vitest';
import { RESTARTED_AT_ANNOTATION } from './rollout';

/** An API error with an HTTP status, like the ones Headlamp's API calls reject with. */
export class ApiStatusError extends Error {
  /** HTTP status code of the failed request. */
  readonly status: number;

  /**
   * Creates an error for a request that failed with the given status.
   *
   * @param status - HTTP status code of the failed request.
   * @param message - Error message.
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiStatusError';
    this.status = status;
  }
}

/** The fields of a mock Deployment that the restart reads. */
type MockFields = {
  /** Name, generation, and a resourceVersion that changes with the generation or status. */
  metadata: {
    /** Name of the Deployment. */
    name: string;
    /** Generation of the Deployment's spec. */
    generation: number;
    /** Changes whenever the generation or the status changes. */
    resourceVersion: string;
  };
  /** Desired Pods, progress deadline and the Pod template's annotations. */
  spec: {
    /** Number of Pods the Deployment should run. */
    replicas: number;
    /** Seconds a rollout may go without progress; unset means the 600-second default. */
    progressDeadlineSeconds?: number;
    /** The Pod template. */
    template: {
      /** Metadata of the Pod template. */
      metadata: {
        /** Annotations of the Pod template, including the restart annotation. */
        annotations: Record<string, string>;
      };
    };
  };
  /** What the Deployment controller reports about the rollout. */
  status: {
    /** The generation the controller has acted on. */
    observedGeneration: number;
    /** All Pods of the Deployment, old and new. */
    replicas: number;
    /** Pods created from the latest template. */
    updatedReplicas: number;
    /** Pods that are ready to serve. */
    availableReplicas: number;
    /** Conditions reported by the controller. */
    conditions?: Array<{
      /** Condition type, for example `Progressing`. */
      type: string;
      /** Why the condition is in its state, for example `ProgressDeadlineExceeded`. */
      reason: string;
    }>;
  };
  /** Mock of the Deployment's `patch`. */
  patch: ReturnType<typeof vi.fn>;
};

/**
 * A Deployment as the tests hand it to the restart. It fills in only {@link MockFields}, so it is
 * typed as a `KubeDeployment` by assertion.
 */
export type MockDeployment = MockFields & KubeDeployment;

export const NOW = '2026-01-01T00:00:00.000Z';
export const AHEAD = '2026-01-01T00:10:00.000Z';
export const FIRST = 'service-a-00002-deployment';
export const SECOND = 'service-a-00003-deployment';
export const IDLE = 'service-a-00001-deployment';
export const REVERTED =
  `${FIRST} lost its restart annotation ` + '(restarts need Knative 1.21 or later)';
export const DEADLINE_EXCEEDED = [{ type: 'Progressing', reason: 'ProgressDeadlineExceeded' }];

/**
 * Builds a Deployment whose rollout is complete unless `status` says otherwise.
 *
 * @param name - Name of the Deployment.
 * @param replicas - Desired number of Pods, also used for every status count.
 * @param status - Status fields to override.
 * @param options - Generation, restart annotation time and progress deadline.
 * @returns The Deployment, with a `patch` mock that resolves.
 */
export function makeDeployment(
  name: string,
  replicas: number,
  status: Partial<MockFields['status']> = {},
  options: { generation?: number; restartedAt?: string; progressDeadlineSeconds?: number } = {}
): MockDeployment {
  const generation = options.generation ?? 1;
  const fullStatus = {
    observedGeneration: generation,
    replicas,
    updatedReplicas: replicas,
    availableReplicas: replicas,
    ...status,
  };
  return {
    metadata: { name, generation, resourceVersion: JSON.stringify([generation, fullStatus]) },
    spec: {
      replicas,
      progressDeadlineSeconds: options.progressDeadlineSeconds,
      template: {
        metadata: {
          annotations: options.restartedAt
            ? { [RESTARTED_AT_ANNOTATION]: options.restartedAt }
            : {},
        },
      },
    },
    status: fullStatus,
    patch: vi.fn().mockResolvedValue({}),
  } as MockDeployment;
}

/**
 * Builds a Deployment as it looks after the restart patch: generation 2, with the restart
 * annotation.
 *
 * @param name - Name of the Deployment.
 * @param replicas - Desired number of Pods.
 * @param status - Status fields to override.
 * @returns The restarted Deployment.
 */
export function restarted(
  name: string,
  replicas: number,
  status: Partial<MockFields['status']> = {}
): MockDeployment {
  return makeDeployment(name, replicas, status, { generation: 2, restartedAt: NOW });
}
