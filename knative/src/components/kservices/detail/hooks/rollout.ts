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

export const RESTARTED_AT_ANNOTATION = 'kubectl.kubernetes.io/restartedAt';

/**
 * Where a Deployment's rollout stands: `progressing` while it is still under way, `failed` when it
 * exceeded its progress deadline, and `complete` when every Pod runs the latest template and is
 * available.
 */
type RolloutState = 'complete' | 'progressing' | 'failed';

/** What a restart remembers about one Deployment it is following. */
export type Tracked = {
  /** The Deployment's restart annotation from before the patch. */
  previous: string | undefined;
  /**
   * The generation the restart patch reached; data from an older generation is ignored. Unset while
   * the patch has no clear answer, until the Deployment shows this restart's annotation.
   */
  minGeneration?: number;
  /** The error the unanswered patch failed with. */
  patchError?: string;
};

/**
 * Tells whether a Deployment has running Pods to restart.
 *
 * @param deployment - The Deployment to check.
 * @returns True when the Deployment wants at least one Pod.
 */
export function isRunning(deployment: KubeDeployment): boolean {
  return (deployment.spec?.replicas ?? 0) > 0;
}

/**
 * Judges a Deployment's rollout with the rules of `kubectl rollout status`.
 *
 * @param deployment - The Deployment to judge.
 * @returns `progressing` while the controller has not acted on the latest spec, new Pods are
 * missing or not yet available, or old Pods remain; `failed` when the rollout exceeded its progress
 * deadline; and `complete` otherwise.
 */
export function getRolloutState(deployment: KubeDeployment): RolloutState {
  const status = deployment.status ?? {};
  if ((status.observedGeneration ?? 0) < (deployment.metadata.generation ?? 0)) {
    return 'progressing';
  }

  const progressing = status.conditions?.find(condition => condition.type === 'Progressing');
  if (progressing?.reason === 'ProgressDeadlineExceeded') {
    return 'failed';
  }

  const updated = status.updatedReplicas ?? 0;
  if (
    updated < (deployment.spec?.replicas ?? 0) ||
    (status.replicas ?? 0) > updated ||
    (status.availableReplicas ?? 0) < updated
  ) {
    return 'progressing';
  }

  return 'complete';
}

/**
 * Reads a Deployment's restart annotation.
 *
 * @param deployment - The Deployment to read.
 * @returns The `kubectl.kubernetes.io/restartedAt` annotation of its Pod template, if it has one.
 */
export function restartAnnotation(deployment: KubeDeployment): string | undefined {
  return deployment.spec?.template?.metadata?.annotations?.[RESTARTED_AT_ANNOTATION];
}

/**
 * Tells whether a Deployment carries this restart.
 *
 * @param annotation - The Deployment's `kubectl.kubernetes.io/restartedAt` annotation.
 * @param previous - The annotation the Deployment had before this restart's patch.
 * @param restartedAt - The time this restart wrote to the annotation.
 * @returns True when the annotation has changed since before the patch and holds this restart's
 * time or a later one.
 */
function keepsRestart(
  annotation: string | undefined,
  previous: string | undefined,
  restartedAt: string
): boolean {
  return annotation !== previous && Date.parse(annotation ?? '') >= Date.parse(restartedAt);
}

/** What {@link judgeRollouts} makes of the latest Deployments. */
type Judgement = {
  /**
   * The Deployments whose rollout has not finished yet, by name. It is the very `pending` that was
   * passed in when nothing changed.
   */
  pending: ReadonlyMap<string, Tracked>;
  /** Sentences about the Deployments whose restart did not complete, found by this judgement. */
  problems: string[];
};

/**
 * Checks each pending Deployment against the latest data. A Deployment whose rollout has finished,
 * or that has disappeared, leaves `pending`, and any problem with it is reported in `problems`.
 * Nothing that is passed in is modified.
 *
 * @param deployments - The latest Deployments, from the watch or from a fresh read.
 * @param pending - The Deployments whose rollout has not finished yet, by name.
 * @param restartedAt - The time this restart wrote to the restart annotation.
 * @returns The Deployments that are still pending, where one whose patch is now confirmed has its
 * `minGeneration`, and the problems found.
 */
export function judgeRollouts(
  deployments: readonly KubeDeployment[],
  pending: ReadonlyMap<string, Tracked>,
  restartedAt: string
): Judgement {
  const next = new Map(pending);
  const problems: string[] = [];
  let changed = false;

  for (const [name, tracked] of pending) {
    const deployment = deployments.find(item => item.metadata.name === name);
    if (!deployment) {
      problems.push(`${name} was removed before its rollout finished`);
      next.delete(name);
      changed = true;
      continue;
    }

    const carriesRestart = keepsRestart(
      restartAnnotation(deployment),
      tracked.previous,
      restartedAt
    );
    const generation = deployment.metadata.generation ?? 0;
    let minGeneration = tracked.minGeneration;
    if (minGeneration === undefined) {
      if (!carriesRestart) {
        continue;
      }
      minGeneration = generation;
      next.set(name, { ...tracked, minGeneration });
      changed = true;
    }
    if (generation < minGeneration) {
      continue;
    }

    const state = getRolloutState(deployment);
    if (state === 'progressing') {
      continue;
    }
    if (state === 'failed') {
      problems.push(`${name} exceeded its progress deadline`);
    } else if (!carriesRestart) {
      problems.push(`${name} lost its restart annotation (restarts need Knative 1.21 or later)`);
    }
    next.delete(name);
    changed = true;
  }

  return { pending: changed ? next : pending, problems };
}
