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
  AHEAD,
  DEADLINE_EXCEEDED,
  FIRST,
  makeDeployment,
  NOW,
  restarted,
  REVERTED,
  SECOND,
} from './restartFixtures';
import { getRolloutState, judgeRollouts, type Tracked } from './rollout';

/**
 * Builds the Deployments a restart still follows.
 *
 * @param entries - The followed Deployments by name.
 * @returns The `pending` map of a restart.
 */
function following(entries: Record<string, Tracked>): ReadonlyMap<string, Tracked> {
  return new Map(Object.entries(entries));
}

describe('getRolloutState', () => {
  it('waits until the controller has observed the new Pod template', () => {
    expect(getRolloutState(restarted(FIRST, 1, { observedGeneration: 1 }))).toBe('progressing');
  });

  it('waits until old Pods are gone and new Pods are available', () => {
    expect(getRolloutState(makeDeployment(FIRST, 2, { replicas: 3 }))).toBe('progressing');
    expect(getRolloutState(makeDeployment(FIRST, 2, { updatedReplicas: 1 }))).toBe('progressing');
    expect(getRolloutState(makeDeployment(FIRST, 2, { availableReplicas: 1 }))).toBe('progressing');
    expect(getRolloutState(makeDeployment(FIRST, 2))).toBe('complete');
  });

  it('fails when the rollout exceeds its progress deadline', () => {
    expect(getRolloutState(makeDeployment(FIRST, 1, { conditions: DEADLINE_EXCEEDED }))).toBe(
      'failed'
    );
  });
});

describe('judgeRollouts', () => {
  it('finishes a Deployment whose restarted rollout is complete', () => {
    const pending = following({ [FIRST]: { previous: undefined, minGeneration: 2 } });

    const judgement = judgeRollouts([restarted(FIRST, 1)], pending, NOW);

    expect(judgement.pending.size).toBe(0);
    expect(judgement.problems).toEqual([]);
  });

  it('keeps following a Deployment that is still rolling out', () => {
    const pending = following({ [FIRST]: { previous: undefined, minGeneration: 2 } });

    const judgement = judgeRollouts([restarted(FIRST, 1, { observedGeneration: 1 })], pending, NOW);

    expect(judgement.pending).toBe(pending);
    expect(judgement.problems).toEqual([]);
  });

  it('ignores data that still shows the Deployment from before the patch', () => {
    const pending = following({ [FIRST]: { previous: undefined, minGeneration: 2 } });

    const judgement = judgeRollouts([makeDeployment(FIRST, 1)], pending, NOW);

    expect(judgement.pending).toBe(pending);
    expect(judgement.problems).toEqual([]);
  });

  it('ignores data from before the generation the patch returned', () => {
    const pending = following({ [FIRST]: { previous: undefined, minGeneration: 3 } });

    const judgement = judgeRollouts(
      [makeDeployment(FIRST, 1, {}, { generation: 2, restartedAt: NOW })],
      pending,
      NOW
    );

    expect(judgement.pending).toBe(pending);
    expect(judgement.problems).toEqual([]);
  });

  it('finishes a Deployment that shows a newer restart annotation', () => {
    const pending = following({ [FIRST]: { previous: undefined } });

    const judgement = judgeRollouts(
      [makeDeployment(FIRST, 1, {}, { generation: 3, restartedAt: '2026-01-01T00:05:00.000Z' })],
      pending,
      NOW
    );

    expect(judgement.pending.size).toBe(0);
    expect(judgement.problems).toEqual([]);
  });

  describe('for a patch that got no clear answer', () => {
    it('does not take another change for the restart', () => {
      const pending = following({ [FIRST]: { previous: undefined, patchError: 'Unreachable' } });

      const judgement = judgeRollouts(
        [makeDeployment(FIRST, 2, {}, { generation: 2 })],
        pending,
        NOW
      );

      expect(judgement.pending).toBe(pending);
      expect(judgement.problems).toEqual([]);
    });

    it('does not take an annotation from before the patch for the restart', () => {
      const pending = following({ [FIRST]: { previous: AHEAD, patchError: 'Unreachable' } });

      const judgement = judgeRollouts(
        [makeDeployment(FIRST, 2, {}, { generation: 2, restartedAt: AHEAD })],
        pending,
        NOW
      );

      expect(judgement.pending).toBe(pending);
      expect(judgement.problems).toEqual([]);
    });

    it('confirms the patch once the Deployment shows this restart, over a clock ahead', () => {
      const pending = following({ [FIRST]: { previous: AHEAD, patchError: 'Unreachable' } });

      const judgement = judgeRollouts([restarted(FIRST, 1)], pending, NOW);

      expect(judgement.pending.size).toBe(0);
      expect(judgement.problems).toEqual([]);
    });

    it('remembers the generation of the confirming data while the rollout goes on', () => {
      const pending = following({ [FIRST]: { previous: undefined, patchError: 'Unreachable' } });

      const judgement = judgeRollouts(
        [restarted(FIRST, 1, { observedGeneration: 1 })],
        pending,
        NOW
      );

      expect(judgement.pending).not.toBe(pending);
      expect(judgement.pending.get(FIRST)).toEqual({
        previous: undefined,
        patchError: 'Unreachable',
        minGeneration: 2,
      });
      expect(judgement.problems).toEqual([]);
    });
  });

  it('reports every Deployment whose rollout does not complete', () => {
    const pending = following({
      [FIRST]: { previous: undefined, minGeneration: 2 },
      [SECOND]: { previous: undefined, minGeneration: 2 },
    });

    const judgement = judgeRollouts(
      [restarted(FIRST, 1, { conditions: DEADLINE_EXCEEDED })],
      pending,
      NOW
    );

    expect(judgement.pending.size).toBe(0);
    expect(judgement.problems).toEqual([
      `${FIRST} exceeded its progress deadline`,
      `${SECOND} was removed before its rollout finished`,
    ]);
  });

  it('reports a Deployment that disappears during the rollout', () => {
    const pending = following({ [FIRST]: { previous: undefined, minGeneration: 2 } });

    const judgement = judgeRollouts([], pending, NOW);

    expect(judgement.pending.size).toBe(0);
    expect(judgement.problems).toEqual([`${FIRST} was removed before its rollout finished`]);
  });

  it.each([
    ['reverted', undefined],
    ['set back to an older restart annotation', '2025-12-01T00:00:00.000Z'],
    ['set back to an annotation from a clock ahead', AHEAD],
  ])('reports a restart that Knative %s', (_name, annotation) => {
    const pending = following({ [FIRST]: { previous: annotation, minGeneration: 2 } });

    const judgement = judgeRollouts(
      [makeDeployment(FIRST, 1, {}, { generation: 3, restartedAt: annotation })],
      pending,
      NOW
    );

    expect(judgement.pending.size).toBe(0);
    expect(judgement.problems).toEqual([REVERTED]);
  });

  it('modifies nothing it is given', () => {
    const tracked: Tracked = { previous: undefined, patchError: 'Unreachable' };
    const pending = following({ [FIRST]: tracked });
    const deployments = [restarted(FIRST, 1, { observedGeneration: 1 })];

    judgeRollouts(deployments, pending, NOW);

    expect(pending.get(FIRST)).toBe(tracked);
    expect(tracked).toEqual({ previous: undefined, patchError: 'Unreachable' });
  });
});
