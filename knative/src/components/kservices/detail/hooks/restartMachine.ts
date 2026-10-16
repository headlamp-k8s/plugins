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

import type Deployment from '@kinvolk/headlamp-plugin/lib/k8s/deployment';
import type { KubeDeployment } from '@kinvolk/headlamp-plugin/lib/k8s/deployment';
import { errorDetail, wasRefused, withDetail } from '../../../../utils/error';
import { isRunning, judgeRollouts, restartAnnotation, type Tracked } from './rollout';

export const REQUEST_TIMEOUT_MS = 120_000;
export const MAX_ROLLOUT_TIMEOUT_MS = 3_600_000;
const DEFAULT_PROGRESS_DEADLINE_SECONDS = 600;
const ROLLOUT_TIMEOUT_MARGIN_MS = 60_000;

/** A message for the user. */
type Notice = {
  /** How the message is shown. */
  level: 'info' | 'error';
  /** What the message says. */
  message: string;
};

/**
 * What a restart uses of a Deployment: its data, and the `patch` that starts the rollout.
 * Headlamp's `Deployment` fits it, and so does a test double without the rest of the class.
 */
export type RestartableDeployment = KubeDeployment & Pick<Deployment, 'patch'>;

/** A running Deployment that the restart patches. */
type Target = {
  /** The Deployment to patch. */
  deployment: RestartableDeployment;
  /** Name of the Deployment. */
  name: string;
  /** The Deployment's generation before the patch. */
  generation: number;
  /** The Deployment's restart annotation before the patch. */
  previous: string | undefined;
  /** Seconds the Deployment's rollout may go without progress. */
  progressDeadlineSeconds: number;
};

/** How one Deployment's restart patch ended. */
export type PatchOutcome = PromiseSettledResult<KubeDeployment | undefined>;

/** What a restart knows once its patches have been sent. */
type Following = {
  /** The time this restart wrote to the restart annotation. */
  restartedAt: string;
  /** The progress message. */
  progress: string;
  /** Names of the Deployments whose rollout is followed, in the order they were patched. */
  followed: string[];
  /** The Deployments whose rollout has not finished yet. */
  pending: ReadonlyMap<string, Tracked>;
  /** Sentences about the Deployments whose restart did not complete. */
  problems: string[];
  /** Whether the API server refused the patch of some Deployment. */
  patchRefused: boolean;
  /** Milliseconds without activity after which the wait for the rollouts gives up. */
  idleMs: number;
};

/** Where a restart stands. */
type Phase =
  /** Waiting for the first fresh list of the Service's Deployments. */
  | { step: 'listing' }
  /** Patching the running Deployments. */
  | { step: 'patching'; restartedAt: string; progress: string; targets: Target[] }
  /** Following the rollouts through the watch. */
  | ({ step: 'rolling' } & Following)
  /** The watch went quiet; waiting for a fresh read that settles what is left. */
  | ({ step: 'confirming' } & Following)
  /** Finished; everything has been decided. */
  | { step: 'done'; callOnDone: boolean };

/** The state of one restart. */
export type RestartState = {
  /** Where the restart stands. */
  phase: Phase;
  /** Messages that have not been shown yet. */
  outbox: readonly Notice[];
};

/** What can happen to a restart. */
export type RestartAction =
  /** The first fresh list arrived. */
  | { type: 'listed'; deployments: readonly RestartableDeployment[]; restartedAt: string }
  /** Every restart patch ended. */
  | { type: 'patched'; outcomes: readonly PatchOutcome[] }
  /** The watch delivered new data. */
  | { type: 'observed'; deployments: readonly KubeDeployment[] }
  /** The wait for the rollouts gave up. */
  | { type: 'gaveUp' }
  /** The fresh read after the wait gave up answered. */
  | { type: 'confirmed'; deployments: readonly KubeDeployment[] }
  /** The fresh read after the wait gave up failed. */
  | { type: 'confirmFailed'; error: unknown }
  /** The Deployments could not be listed. */
  | { type: 'failed'; error: unknown }
  /** The messages of the outbox have been shown. */
  | { type: 'delivered' };

const NO_MESSAGES: readonly Notice[] = [];

export const initialRestartState: RestartState = {
  phase: { step: 'listing' },
  outbox: NO_MESSAGES,
};

/**
 * Ends the restart.
 *
 * @param state - The state of the restart.
 * @param notices - The messages to show on top of those that are still to be shown.
 * @param callOnDone - Whether the caller's `onDone` should be called.
 * @returns The finished state.
 */
function finish(state: RestartState, notices: Notice[], callOnDone: boolean): RestartState {
  return { phase: { step: 'done', callOnDone }, outbox: [...state.outbox, ...notices] };
}

/**
 * Says how a restart ended, once every followed rollout has finished or been given up.
 *
 * @param following - What the restart knew; only its followed names and its flags are used.
 * @param problems - Sentences about the Deployments whose restart did not complete.
 * @returns The message.
 */
function summarize(following: Following, problems: string[]): Notice {
  if (problems.length > 0) {
    return { level: 'error', message: `Restart did not complete: ${problems.join('; ')}` };
  }
  if (following.patchRefused) {
    return { level: 'info', message: `Restarted ${following.followed.join(', ')}` };
  }
  return { level: 'info', message: 'Restart completed successfully' };
}

/**
 * Starts a restart from the first fresh list: the running Deployments become the targets.
 *
 * @param state - The state of the restart.
 * @param deployments - The Deployments of the Knative Service.
 * @param restartedAt - The time the restart will write to the restart annotation.
 * @returns The state with the targets to patch, or the finished state when no Pods are running.
 */
function start(
  state: RestartState,
  deployments: readonly RestartableDeployment[],
  restartedAt: string
): RestartState {
  const running = deployments.filter(isRunning);
  if (running.length === 0) {
    return finish(state, [{ level: 'info', message: 'No running Pods found for KService' }], false);
  }

  return {
    ...state,
    phase: {
      step: 'patching',
      restartedAt,
      progress: `Restart in progress: rolling out ${running
        .map(deployment => deployment.metadata.name)
        .join(', ')}`,
      targets: running.map(deployment => ({
        deployment,
        name: deployment.metadata.name,
        generation: deployment.metadata.generation ?? 0,
        previous: restartAnnotation(deployment),
        progressDeadlineSeconds:
          deployment.spec?.progressDeadlineSeconds ?? DEFAULT_PROGRESS_DEADLINE_SECONDS,
      })),
    },
  };
}

/**
 * Takes in how the restart patches ended. A patch that the API server refused changed nothing and
 * is reported at once. Any other patch may have been applied, even one that failed or got no
 * answer, so its Deployment is followed all the same.
 *
 * @param state - The state of the restart.
 * @param phase - The patching phase.
 * @param outcomes - How each target's patch ended, in the order of the targets.
 * @returns The state that follows the rollouts, or the finished state when no patch can have
 * worked.
 */
function takeOutcomes(
  state: RestartState,
  phase: Extract<Phase, { step: 'patching' }>,
  outcomes: readonly PatchOutcome[]
): RestartState {
  const pending = new Map<string, Tracked>();
  const refused: string[] = [];
  let progressDeadlineSeconds = 0;

  outcomes.forEach((outcome, index) => {
    const { name, generation, previous, progressDeadlineSeconds: deadline } = phase.targets[index];
    if (outcome.status === 'rejected' && wasRefused(outcome.reason)) {
      refused.push(withDetail(name, errorDetail(outcome.reason)));
      return;
    }

    pending.set(
      name,
      outcome.status === 'fulfilled'
        ? { previous, minGeneration: outcome.value?.metadata?.generation ?? generation + 1 }
        : { previous, patchError: errorDetail(outcome.reason) }
    );
    progressDeadlineSeconds = Math.max(progressDeadlineSeconds, deadline);
  });

  const notices: Notice[] =
    refused.length > 0
      ? [{ level: 'error', message: `Failed to restart ${refused.join('; ')}` }]
      : [];
  if (pending.size === 0) {
    return finish(state, notices, true);
  }

  return {
    phase: {
      step: 'rolling',
      restartedAt: phase.restartedAt,
      progress: phase.progress,
      followed: Array.from(pending.keys()),
      pending,
      problems: [],
      patchRefused: refused.length > 0,
      idleMs: Math.min(
        progressDeadlineSeconds * 1000 + ROLLOUT_TIMEOUT_MARGIN_MS,
        MAX_ROLLOUT_TIMEOUT_MS
      ),
    },
    outbox: [...state.outbox, ...notices],
  };
}

/**
 * Checks the followed rollouts against the data the watch delivered.
 *
 * @param state - The state of the restart.
 * @param phase - The rolling phase.
 * @param deployments - The latest Deployments.
 * @returns The state without the rollouts that have finished, or the finished state once none is
 * left. The very `state` when nothing has changed.
 */
function observe(
  state: RestartState,
  phase: Extract<Phase, { step: 'rolling' }>,
  deployments: readonly KubeDeployment[]
): RestartState {
  const judgement = judgeRollouts(deployments, phase.pending, phase.restartedAt);
  if (judgement.pending === phase.pending) {
    return state;
  }

  const problems = [...phase.problems, ...judgement.problems];
  if (judgement.pending.size === 0) {
    return finish(state, [summarize(phase, problems)], true);
  }

  return { ...state, phase: { ...phase, pending: judgement.pending, problems } };
}

/**
 * Settles the rollouts that are left after the wait gave up: each of them did not finish, could not
 * be checked, or may not have been patched.
 *
 * @param state - The state of the restart.
 * @param phase - The confirming phase.
 * @param deployments - The Deployments the fresh read returned, or undefined when it failed.
 * @param error - Why the fresh read failed.
 * @returns The finished state.
 */
function settleLeftovers(
  state: RestartState,
  phase: Extract<Phase, { step: 'confirming' }>,
  deployments: readonly KubeDeployment[] | undefined,
  error?: unknown
): RestartState {
  const problems = [...phase.problems];
  let pending = phase.pending;
  if (deployments) {
    const judgement = judgeRollouts(deployments, pending, phase.restartedAt);
    pending = judgement.pending;
    problems.push(...judgement.problems);
    pending.forEach((tracked, name) =>
      problems.push(
        tracked.minGeneration === undefined
          ? withDetail(`${name} may not have been patched`, tracked.patchError)
          : `${name} did not finish rolling out in time`
      )
    );
  } else {
    pending.forEach((_, name) =>
      problems.push(withDetail(`${name} could not be checked`, errorDetail(error)))
    );
  }

  return finish(state, [summarize(phase, problems)], true);
}

/**
 * Moves a restart on. An action that does not fit where the restart stands is ignored, and the very
 * `state` is returned, so that a repeated or late event changes nothing.
 *
 * @param state - The state of the restart.
 * @param action - What happened.
 * @returns The new state.
 */
export function restartReducer(state: RestartState, action: RestartAction): RestartState {
  const { phase } = state;

  switch (action.type) {
    case 'delivered':
      return state.outbox.length === 0 ? state : { ...state, outbox: NO_MESSAGES };
    case 'failed':
      return phase.step === 'listing'
        ? finish(
            state,
            [{ level: 'error', message: withDetail('Restart failed', errorDetail(action.error)) }],
            false
          )
        : state;
    case 'listed':
      return phase.step === 'listing'
        ? start(state, action.deployments, action.restartedAt)
        : state;
    case 'patched':
      return phase.step === 'patching' ? takeOutcomes(state, phase, action.outcomes) : state;
    case 'observed':
      return phase.step === 'rolling' ? observe(state, phase, action.deployments) : state;
    case 'gaveUp':
      return phase.step === 'rolling'
        ? { ...state, phase: { ...phase, step: 'confirming' } }
        : state;
    case 'confirmed':
      return phase.step === 'confirming'
        ? settleLeftovers(state, phase, action.deployments)
        : state;
    case 'confirmFailed':
      return phase.step === 'confirming'
        ? settleLeftovers(state, phase, undefined, action.error)
        : state;
  }
}
