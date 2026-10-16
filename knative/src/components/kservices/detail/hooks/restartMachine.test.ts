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

import {
  ApiStatusError,
  FIRST,
  IDLE,
  makeDeployment,
  type MockDeployment,
  NOW,
  restarted,
  SECOND,
} from './restartFixtures';
import {
  initialRestartState,
  MAX_ROLLOUT_TIMEOUT_MS,
  type PatchOutcome,
  type RestartAction,
  restartReducer,
  type RestartState,
} from './restartMachine';

/**
 * Applies the actions one after the other.
 *
 * @param actions - What happens to the restart, in order.
 * @returns The state the restart ends in.
 */
function run(...actions: RestartAction[]): RestartState {
  return actions.reduce(restartReducer, initialRestartState);
}

/**
 * Builds the action for a first list that finds the given Deployments.
 *
 * @param deployments - The Deployments of the Knative Service.
 * @returns The action.
 */
function listed(...deployments: MockDeployment[]): RestartAction {
  return { type: 'listed', deployments, restartedAt: NOW };
}

const fulfilled: PatchOutcome = { status: 'fulfilled', value: undefined };

describe('restartReducer', () => {
  describe('after the first list', () => {
    it('patches the running Deployments and says which it rolls out', () => {
      const { phase, outbox } = run(
        listed(makeDeployment(FIRST, 2), makeDeployment(IDLE, 0), makeDeployment(SECOND, 1))
      );

      expect(phase).toMatchObject({
        step: 'patching',
        restartedAt: NOW,
        progress: `Restart in progress: rolling out ${FIRST}, ${SECOND}`,
      });
      expect(phase.step === 'patching' && phase.targets.map(target => target.name)).toEqual([
        FIRST,
        SECOND,
      ]);
      expect(outbox).toEqual([]);
    });

    it('records what each target looked like before the patch', () => {
      const { phase } = run(
        listed(makeDeployment(FIRST, 1, {}, { generation: 4, restartedAt: NOW }))
      );

      expect(phase.step === 'patching' && phase.targets[0]).toMatchObject({
        name: FIRST,
        generation: 4,
        previous: NOW,
        progressDeadlineSeconds: 600,
      });
    });

    it('finishes without calling onDone when no Pods are running', () => {
      expect(run(listed(makeDeployment(IDLE, 0)))).toEqual({
        phase: { step: 'done', callOnDone: false },
        outbox: [{ level: 'info', message: 'No running Pods found for KService' }],
      });
    });
  });

  describe('after the patches', () => {
    it('follows every Deployment the API server did not refuse', () => {
      const { phase, outbox } = run(listed(makeDeployment(FIRST, 1), makeDeployment(SECOND, 1)), {
        type: 'patched',
        outcomes: [fulfilled, { status: 'rejected', reason: new ApiStatusError(409, 'conflict') }],
      });

      expect(phase).toMatchObject({ step: 'rolling', followed: [FIRST], patchRefused: true });
      expect(outbox).toEqual([
        { level: 'error', message: `Failed to restart ${SECOND}: conflict` },
      ]);
    });

    it.each([
      ['a timed-out request', new ApiStatusError(408, 'Request timed-out')],
      ['a server error', new ApiStatusError(500, 'Internal Server Error')],
      ['an error without a status', new Error('Failed to fetch')],
    ])('follows a Deployment whose patch failed with %s', (_name, reason) => {
      const { phase, outbox } = run(listed(makeDeployment(FIRST, 1)), {
        type: 'patched',
        outcomes: [{ status: 'rejected', reason }],
      });

      expect(phase).toMatchObject({ step: 'rolling', followed: [FIRST], patchRefused: false });
      expect(phase.step === 'rolling' && phase.pending.get(FIRST)).toEqual({
        previous: undefined,
        patchError: reason.message,
      });
      expect(outbox).toEqual([]);
    });

    it('expects the generation the patch returned, or the next one', () => {
      const { phase } = run(listed(makeDeployment(FIRST, 1, {}, { generation: 4 })), {
        type: 'patched',
        outcomes: [fulfilled],
      });

      expect(phase.step === 'rolling' && phase.pending.get(FIRST)?.minGeneration).toBe(5);
    });

    it('finishes, with onDone, when the API server refused every patch', () => {
      expect(
        run(listed(makeDeployment(FIRST, 1)), {
          type: 'patched',
          outcomes: [{ status: 'rejected', reason: new ApiStatusError(403, 'forbidden') }],
        })
      ).toEqual({
        phase: { step: 'done', callOnDone: true },
        outbox: [{ level: 'error', message: `Failed to restart ${FIRST}: forbidden` }],
      });
    });

    it('waits for the longest progress deadline plus a minute', () => {
      const { phase } = run(
        listed(
          makeDeployment(FIRST, 1),
          makeDeployment(SECOND, 1, {}, { progressDeadlineSeconds: 900 })
        ),
        { type: 'patched', outcomes: [fulfilled, fulfilled] }
      );

      expect(phase.step === 'rolling' && phase.idleMs).toBe(960_000);
    });

    it('never waits longer than an hour for a rollout to go quiet', () => {
      const { phase } = run(
        listed(makeDeployment(FIRST, 1, {}, { progressDeadlineSeconds: 2_147_483_647 })),
        { type: 'patched', outcomes: [fulfilled] }
      );

      expect(phase.step === 'rolling' && phase.idleMs).toBe(MAX_ROLLOUT_TIMEOUT_MS);
    });
  });

  describe('while the rollouts are followed', () => {
    const rolling = run(listed(makeDeployment(FIRST, 1)), {
      type: 'patched',
      outcomes: [fulfilled],
    });

    it('ignores data that changes nothing, keeping the very same state', () => {
      expect(
        restartReducer(rolling, {
          type: 'observed',
          deployments: [restarted(FIRST, 1, { observedGeneration: 1 })],
        })
      ).toBe(rolling);
    });

    it('reports success once the rollout is complete', () => {
      expect(
        restartReducer(rolling, { type: 'observed', deployments: [restarted(FIRST, 1)] })
      ).toEqual({
        phase: { step: 'done', callOnDone: true },
        outbox: [{ level: 'info', message: 'Restart completed successfully' }],
      });
    });

    it('lists the Deployments it followed when another one was refused', () => {
      const partly = run(listed(makeDeployment(FIRST, 1), makeDeployment(SECOND, 1)), {
        type: 'patched',
        outcomes: [fulfilled, { status: 'rejected', reason: new ApiStatusError(409, 'conflict') }],
      });

      expect(
        restartReducer(partly, { type: 'observed', deployments: [restarted(FIRST, 1)] }).outbox
      ).toEqual([
        { level: 'error', message: `Failed to restart ${SECOND}: conflict` },
        { level: 'info', message: `Restarted ${FIRST}` },
      ]);
    });

    it('reports the problems of the rollouts that did not complete', () => {
      expect(restartReducer(rolling, { type: 'observed', deployments: [] }).outbox).toEqual([
        {
          level: 'error',
          message: `Restart did not complete: ${FIRST} was removed before its rollout finished`,
        },
      ]);
    });

    it('moves on to a fresh read when it gives up', () => {
      expect(restartReducer(rolling, { type: 'gaveUp' }).phase.step).toBe('confirming');
    });
  });

  describe('after it gave up', () => {
    const confirming = run(
      listed(makeDeployment(FIRST, 1)),
      { type: 'patched', outcomes: [fulfilled] },
      {
        type: 'gaveUp',
      }
    );

    it('settles the rollouts the fresh read shows', () => {
      expect(
        restartReducer(confirming, { type: 'confirmed', deployments: [restarted(FIRST, 1)] }).outbox
      ).toEqual([{ level: 'info', message: 'Restart completed successfully' }]);
    });

    it('reports the rollouts that still did not finish', () => {
      expect(
        restartReducer(confirming, {
          type: 'confirmed',
          deployments: [restarted(FIRST, 1, { observedGeneration: 1 })],
        }).outbox
      ).toEqual([
        {
          level: 'error',
          message: `Restart did not complete: ${FIRST} did not finish rolling out in time`,
        },
      ]);
    });

    it('reports the rollouts it could not check', () => {
      expect(
        restartReducer(confirming, { type: 'confirmFailed', error: new Error('boom') }).outbox
      ).toEqual([
        {
          level: 'error',
          message: `Restart did not complete: ${FIRST} could not be checked: boom`,
        },
      ]);
    });

    it('reports a patch that no Deployment ever showed', () => {
      const unanswered = run(
        listed(makeDeployment(FIRST, 1)),
        { type: 'patched', outcomes: [{ status: 'rejected', reason: new Error('Unreachable') }] },
        { type: 'gaveUp' }
      );

      expect(
        restartReducer(unanswered, { type: 'confirmed', deployments: [makeDeployment(FIRST, 1)] })
          .outbox
      ).toEqual([
        {
          level: 'error',
          message: `Restart did not complete: ${FIRST} may not have been patched: Unreachable`,
        },
      ]);
    });
  });

  describe('when the Deployments cannot be listed', () => {
    it('fails without calling onDone', () => {
      expect(run({ type: 'failed', error: new ApiStatusError(403, 'forbidden') })).toEqual({
        phase: { step: 'done', callOnDone: false },
        outbox: [{ level: 'error', message: 'Restart failed: forbidden' }],
      });
    });

    it('fails with a bare message when the error says nothing', () => {
      expect(run({ type: 'failed', error: undefined }).outbox).toEqual([
        { level: 'error', message: 'Restart failed' },
      ]);
    });

    it('ignores a failure once the restart has begun', () => {
      const patching = run(listed(makeDeployment(FIRST, 1)));

      expect(restartReducer(patching, { type: 'failed', error: new Error('late') })).toBe(patching);
    });
  });

  describe('delivering messages', () => {
    it('empties the outbox', () => {
      const finished = run(listed(makeDeployment(IDLE, 0)));

      expect(restartReducer(finished, { type: 'delivered' })).toEqual({
        phase: { step: 'done', callOnDone: false },
        outbox: [],
      });
    });

    it('keeps the very same state when there is nothing to deliver', () => {
      expect(restartReducer(initialRestartState, { type: 'delivered' })).toBe(initialRestartState);
    });
  });

  it('ignores every action that does not fit where the restart stands', () => {
    const finished = run(listed(makeDeployment(IDLE, 0)));

    for (const action of [
      listed(makeDeployment(FIRST, 1)),
      { type: 'patched', outcomes: [fulfilled] },
      { type: 'observed', deployments: [restarted(FIRST, 1)] },
      { type: 'gaveUp' },
      { type: 'confirmed', deployments: [] },
      { type: 'confirmFailed', error: new Error('late') },
      { type: 'failed', error: new Error('late') },
    ] as RestartAction[]) {
      expect(restartReducer(finished, action)).toBe(finished);
    }
    expect(restartReducer(initialRestartState, { type: 'gaveUp' })).toBe(initialRestartState);
    expect(restartReducer(initialRestartState, { type: 'patched', outcomes: [] })).toBe(
      initialRestartState
    );
  });
});
