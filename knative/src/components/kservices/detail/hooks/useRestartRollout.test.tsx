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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import {
  AHEAD,
  ApiStatusError,
  DEADLINE_EXCEEDED,
  FIRST,
  IDLE,
  makeDeployment,
  type MockDeployment,
  NOW,
  restarted,
  REVERTED,
  SECOND,
} from './restartFixtures';
import { RESTARTED_AT_ANNOTATION } from './rollout';
import { useRestartRollout } from './useRestartRollout';

const mocks = vi.hoisted(() => ({
  closeSnackbar: vi.fn(),
  enqueueSnackbar: vi.fn(),
  notifyError: vi.fn(),
  notifyInfo: vi.fn(),
}));

vi.mock('notistack', () => ({
  useSnackbar: () => ({
    closeSnackbar: mocks.closeSnackbar,
    enqueueSnackbar: mocks.enqueueSnackbar,
  }),
}));

vi.mock('../../../common/notifications/useNotify', () => ({
  useNotify: () => ({ notifyError: mocks.notifyError, notifyInfo: mocks.notifyInfo }),
}));

const { closeSnackbar, enqueueSnackbar, notifyError, notifyInfo } = mocks;

/** What the hook receives from the component that watches the Deployments. */
type Watched = {
  /** The Deployments the watch last delivered. */
  deployments: MockDeployment[] | null;
  /** The Deployments of the read made when the restart began; null until it answers. */
  start: MockDeployment[] | null;
  /** The error the watch failed with. */
  listError: unknown;
};

/**
 * Lets pending promise callbacks, zero-delay timers and the renders they cause run. It moves the
 * clock on by a millisecond per round, because a zero-delay timer that is set while the clock is
 * ticking only fires a millisecond later.
 *
 * @returns A promise that resolves once they have run.
 */
async function settle() {
  for (let round = 0; round < 3; round++) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
  }
}

/**
 * Lets time pass, and then lets everything that follows from it run.
 *
 * @param ms - Milliseconds to advance the clock by.
 * @returns A promise that resolves once the time has passed and everything has run.
 */
async function elapse(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
  await settle();
}

/**
 * Starts a restart of `service-a`, with the Deployments its watch has listed so far.
 *
 * @param initial - The Deployments of the first list; null when the watch has listed nothing yet.
 * @param options - `listed` false holds back the read the restart starts from.
 * @returns The mocks the hook calls, and functions to feed it with what the watch delivers.
 */
async function begin(initial: MockDeployment[] | null, options: { listed?: boolean } = {}) {
  const readDeployments = vi.fn();
  const onFinished = vi.fn();
  const queryClient = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </React.StrictMode>
  );
  const view = renderHook(
    (watched: Watched) =>
      useRestartRollout({
        serviceKey: 'cluster-a/default/service-a',
        deployments: watched.deployments,
        start: watched.start,
        listError: watched.listError,
        readDeployments,
        onFinished,
      }),
    {
      initialProps: {
        deployments: initial,
        start: options.listed ?? initial !== null ? initial : null,
        listError: null,
      } as Watched,
      wrapper,
    }
  );
  await settle();

  /**
   * Hands the hook what the watch delivers.
   *
   * @param watched - The fields of the delivery that differ from a fresh list of Deployments.
   * @returns A promise that resolves once the hook has reacted.
   */
  const deliver = async (watched: Partial<Watched>) => {
    view.rerender({ deployments: initial, start: initial, listError: null, ...watched });
    await settle();
  };

  return {
    onFinished,
    readDeployments,
    deliver,
    /** Delivers a new list of Deployments. */
    show: (deployments: MockDeployment[]) => deliver({ deployments }),
    unmount: view.unmount,
  };
}

describe('useRestartRollout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    closeSnackbar.mockReset();
    enqueueSnackbar.mockReset().mockReturnValue('progress');
    notifyError.mockReset();
    notifyInfo.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('annotates each running Deployment and follows its rollout', async () => {
    const running = makeDeployment(FIRST, 2);
    const idle = makeDeployment(IDLE, 0);
    const restart = await begin([running, idle]);

    expect(running.patch).toHaveBeenCalledTimes(1);
    expect(running.patch).toHaveBeenCalledWith({
      spec: { template: { metadata: { annotations: { [RESTARTED_AT_ANNOTATION]: NOW } } } },
    });
    expect(idle.patch).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(`Restart in progress: rolling out ${FIRST}`, {
      variant: 'info',
      persist: true,
    });

    await restart.show([restarted(FIRST, 2, { replicas: 3 })]);
    expect(notifyInfo).not.toHaveBeenCalled();
    await restart.show([restarted(FIRST, 2)]);

    expect(notifyInfo).toHaveBeenCalledTimes(1);
    expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
    expect(notifyError).not.toHaveBeenCalled();
    expect(restart.onFinished).toHaveBeenCalledTimes(1);
    expect(restart.onFinished).toHaveBeenCalledWith(true);
    expect(closeSnackbar).toHaveBeenCalledWith('progress');
    expect(restart.readDeployments).not.toHaveBeenCalled();
  });

  it('keeps the progress message on screen until the restart is over', async () => {
    const restart = await begin([makeDeployment(FIRST, 1)]);

    expect(enqueueSnackbar).toHaveBeenCalledTimes(1);
    expect(closeSnackbar).not.toHaveBeenCalled();
    await restart.show([restarted(FIRST, 1, { observedGeneration: 1 })]);
    expect(closeSnackbar).not.toHaveBeenCalled();

    await restart.show([restarted(FIRST, 1)]);
    expect(closeSnackbar).toHaveBeenCalledTimes(1);
  });

  it('ignores updates that still show the Deployment from before the patch', async () => {
    const running = makeDeployment(FIRST, 1);
    const restart = await begin([running]);

    await restart.show([running]);
    await restart.show([makeDeployment(FIRST, 1)]);
    expect(notifyError).not.toHaveBeenCalled();
    expect(notifyInfo).not.toHaveBeenCalled();

    await restart.show([restarted(FIRST, 1)]);

    expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
  });

  it('waits for the generation from the patch when the patch updates the object', async () => {
    const running = makeDeployment(FIRST, 1);
    running.patch.mockImplementationOnce(async () => {
      running.metadata.generation = 2;
      return {};
    });
    const restart = await begin([running]);

    await restart.show([running]);
    await restart.show([restarted(FIRST, 1)]);

    expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('waits for the generation the patch returned, not an earlier change', async () => {
    const running = makeDeployment(FIRST, 2);
    running.patch.mockResolvedValueOnce({ metadata: { generation: 3 } });
    const restart = await begin([running]);

    await restart.show([makeDeployment(FIRST, 1, {}, { generation: 2 })]);
    expect(notifyError).not.toHaveBeenCalled();
    expect(notifyInfo).not.toHaveBeenCalled();

    await restart.show([makeDeployment(FIRST, 2, {}, { generation: 3, restartedAt: NOW })]);

    expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('treats a newer restart annotation as a finished restart', async () => {
    const restart = await begin([makeDeployment(FIRST, 1)]);

    await restart.show([makeDeployment(FIRST, 1)]);
    await restart.show([
      makeDeployment(FIRST, 1, {}, { generation: 3, restartedAt: '2026-01-01T00:05:00.000Z' }),
    ]);

    expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
    expect(notifyError).not.toHaveBeenCalled();
  });

  describe('before the Deployments are listed', () => {
    it('does nothing when no Pods are running', async () => {
      const idle = makeDeployment(IDLE, 0);
      const restart = await begin([idle]);

      expect(idle.patch).not.toHaveBeenCalled();
      expect(notifyInfo).toHaveBeenCalledWith('No running Pods found for KService');
      expect(enqueueSnackbar).not.toHaveBeenCalled();
      expect(restart.onFinished).toHaveBeenCalledTimes(1);
      expect(restart.onFinished).toHaveBeenCalledWith(false);
    });

    it('waits for the read it starts from', async () => {
      const running = makeDeployment(FIRST, 1);
      const restart = await begin([running], { listed: false });

      expect(running.patch).not.toHaveBeenCalled();
      expect(enqueueSnackbar).not.toHaveBeenCalled();

      await restart.show([running]);

      expect(running.patch).toHaveBeenCalledTimes(1);
    });

    it('starts from the read, not from an older list the watch began with', async () => {
      const cached = makeDeployment(FIRST, 1);
      const current = makeDeployment(SECOND, 1);
      const restart = await begin([cached], { listed: false });

      await restart.deliver({ deployments: [cached], start: [current] });

      expect(current.patch).toHaveBeenCalledTimes(1);
      expect(cached.patch).not.toHaveBeenCalled();
    });

    it('fails the restart when the watch cannot list the Deployments', async () => {
      const restart = await begin(null);

      await restart.deliver({
        deployments: null,
        start: null,
        listError: new ApiStatusError(403, 'forbidden'),
      });

      expect(notifyError).toHaveBeenCalledWith('Restart failed: forbidden');
      expect(enqueueSnackbar).not.toHaveBeenCalled();
      expect(restart.onFinished).toHaveBeenCalledWith(false);
    });

    it('fails the restart when the watch never lists the Deployments', async () => {
      const restart = await begin(null);

      await elapse(119_000);
      expect(notifyError).not.toHaveBeenCalled();

      await elapse(1_000);

      expect(notifyError).toHaveBeenCalledWith('Restart failed: Timed out listing Deployments');
      expect(restart.onFinished).toHaveBeenCalledWith(false);
    });
  });

  describe('when a patch fails', () => {
    it('reports a refused patch without waiting for a rollout', async () => {
      const running = makeDeployment(FIRST, 1);
      running.patch.mockRejectedValueOnce(new ApiStatusError(403, 'forbidden'));
      const restart = await begin([running]);

      expect(notifyError).toHaveBeenCalledWith(`Failed to restart ${FIRST}: forbidden`);
      expect(notifyInfo).not.toHaveBeenCalled();
      expect(restart.onFinished).toHaveBeenCalledTimes(1);
      expect(restart.onFinished).toHaveBeenCalledWith(true);
    });

    it('keeps tracking the Deployments it patched when another patch is refused', async () => {
      const first = makeDeployment(FIRST, 1);
      const second = makeDeployment(SECOND, 1);
      second.patch.mockRejectedValueOnce(new ApiStatusError(409, 'conflict'));
      const restart = await begin([first, second]);

      expect(notifyError).toHaveBeenCalledWith(`Failed to restart ${SECOND}: conflict`);
      expect(notifyInfo).not.toHaveBeenCalled();

      await restart.show([restarted(FIRST, 1), second]);

      expect(notifyInfo).toHaveBeenCalledWith(`Restarted ${FIRST}`);
    });

    it.each([
      ['a timed-out request', new ApiStatusError(408, 'Request timed-out')],
      ['an unreachable cluster', new ApiStatusError(502, 'Unreachable')],
      ['a server error', new ApiStatusError(500, 'Internal Server Error')],
      ['an error without a status', new Error('Failed to fetch')],
    ])('keeps following a Deployment whose patch fails with %s', async (_name, err) => {
      const running = makeDeployment(FIRST, 1);
      running.patch.mockRejectedValueOnce(err);
      const restart = await begin([running]);

      await restart.show([restarted(FIRST, 1)]);

      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
      expect(notifyError).not.toHaveBeenCalled();
    });

    it('keeps following a Deployment whose patch gets no answer', async () => {
      const first = makeDeployment(FIRST, 1);
      const second = makeDeployment(SECOND, 1);
      second.patch.mockReturnValueOnce(new Promise(() => {}));
      const restart = await begin([first, second]);

      await restart.show([restarted(FIRST, 1), restarted(SECOND, 1)]);
      await elapse(119_000);
      expect(notifyInfo).not.toHaveBeenCalled();

      await elapse(1_000);

      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
      expect(notifyError).not.toHaveBeenCalled();
    });

    it('reports a Deployment whose unanswered patch never rolls out', async () => {
      const running = makeDeployment(FIRST, 1);
      running.patch.mockReturnValueOnce(new Promise(() => {}));
      const restart = await begin([running]);
      restart.readDeployments.mockResolvedValueOnce([running]);

      await elapse(120_000);
      await elapse(660_000);

      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} may not have been patched: ` +
          'Timed out patching Deployment'
      );
    });

    it('does not take another change for an unanswered patch', async () => {
      const running = makeDeployment(FIRST, 1);
      running.patch.mockReturnValueOnce(new Promise(() => {}));
      const restart = await begin([running]);

      await restart.show([makeDeployment(FIRST, 2, {}, { generation: 2 })]);
      await elapse(120_000);
      expect(notifyError).not.toHaveBeenCalled();
      expect(notifyInfo).not.toHaveBeenCalled();

      await restart.show([makeDeployment(FIRST, 2, {}, { generation: 3, restartedAt: NOW })]);

      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
      expect(notifyError).not.toHaveBeenCalled();
    });

    it('does not take an annotation from before the patch for an unanswered patch', async () => {
      const running = makeDeployment(FIRST, 1, {}, { restartedAt: AHEAD });
      running.patch.mockRejectedValueOnce(new ApiStatusError(502, 'Unreachable'));
      const restart = await begin([running]);
      const scaled = makeDeployment(FIRST, 2, {}, { generation: 2, restartedAt: AHEAD });
      restart.readDeployments.mockResolvedValueOnce([scaled]);

      await restart.show([scaled]);
      expect(notifyError).not.toHaveBeenCalled();
      expect(notifyInfo).not.toHaveBeenCalled();

      await elapse(660_000);

      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} may not have been patched: Unreachable`
      );
      expect(notifyInfo).not.toHaveBeenCalled();
    });

    it('confirms an unanswered patch that replaced an annotation from a clock ahead', async () => {
      const running = makeDeployment(FIRST, 1, {}, { restartedAt: AHEAD });
      running.patch.mockRejectedValueOnce(new ApiStatusError(502, 'Unreachable'));
      const restart = await begin([running]);

      await restart.show([restarted(FIRST, 1)]);

      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
      expect(notifyError).not.toHaveBeenCalled();
    });
  });

  describe('when a rollout does not complete', () => {
    it('reports every Deployment whose rollout does not complete', async () => {
      const restart = await begin([makeDeployment(FIRST, 1), makeDeployment(SECOND, 1)]);

      await restart.show([restarted(FIRST, 1, { conditions: DEADLINE_EXCEEDED })]);

      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} exceeded its progress deadline; ` +
          `${SECOND} was removed before its rollout finished`
      );
      expect(notifyInfo).not.toHaveBeenCalled();
    });

    it('reports a restart that Knative reverted', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);

      await restart.show([makeDeployment(FIRST, 1, {}, { generation: 3 })]);

      expect(notifyError).toHaveBeenCalledWith(`Restart did not complete: ${REVERTED}`);
    });

    it('reports a Deployment that disappears during the rollout', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);

      await restart.show([]);

      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} was removed before its rollout finished`
      );
    });

    it('times out when a rollout makes no progress, after one fresh read', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);
      restart.readDeployments.mockResolvedValueOnce([
        restarted(FIRST, 1, { observedGeneration: 1 }),
      ]);

      await restart.show([restarted(FIRST, 1, { observedGeneration: 1 })]);
      await elapse(659_000);
      expect(restart.readDeployments).not.toHaveBeenCalled();

      await elapse(1_000);

      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} did not finish rolling out in time`
      );
      expect(restart.onFinished).toHaveBeenCalledTimes(1);
      expect(restart.onFinished).toHaveBeenCalledWith(true);
    });

    it('confirms with a fresh read when the watch stops delivering updates', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);
      restart.readDeployments.mockResolvedValueOnce([restarted(FIRST, 1)]);

      await elapse(660_000);

      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
      expect(notifyError).not.toHaveBeenCalled();
    });

    it('reports the error when the fresh read fails', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);
      restart.readDeployments.mockRejectedValueOnce(new ApiStatusError(403, 'forbidden'));

      await elapse(660_000);

      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} could not be checked: forbidden`
      );
    });

    it('reports the Deployments as unchecked when the fresh read never answers', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);
      restart.readDeployments.mockReturnValueOnce(new Promise(() => {}));

      await elapse(660_000);
      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      await elapse(119_000);
      expect(notifyError).not.toHaveBeenCalled();

      await elapse(1_000);

      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} could not be checked: Timed out listing Deployments`
      );
      expect(restart.onFinished).toHaveBeenCalledTimes(1);
    });
  });

  describe('how long it waits', () => {
    it('does not wait longer for repeated identical updates', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);
      const stuck = [restarted(FIRST, 1, { observedGeneration: 1 })];
      restart.readDeployments.mockResolvedValueOnce(stuck);

      await restart.show(stuck);
      await elapse(300_000);
      await restart.show(stuck);
      await elapse(300_000);
      await restart.show(stuck);
      await elapse(60_000);

      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} did not finish rolling out in time`
      );
    });

    it('does not wait longer for changes to Deployments it is not tracking', async () => {
      const restart = await begin([makeDeployment(FIRST, 1), makeDeployment(IDLE, 0)]);
      const stuck = restarted(FIRST, 1, { observedGeneration: 1 });
      restart.readDeployments.mockResolvedValueOnce([stuck]);

      await restart.show([stuck, makeDeployment(IDLE, 1)]);
      await elapse(300_000);
      await restart.show([stuck, makeDeployment(IDLE, 2)]);
      await elapse(300_000);
      await restart.show([stuck, makeDeployment(IDLE, 3)]);
      await elapse(60_000);

      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} did not finish rolling out in time`
      );
    });

    it('does not wait longer for changes to a rollout that has finished', async () => {
      const restart = await begin([makeDeployment(FIRST, 1), makeDeployment(SECOND, 1)]);
      const stuck = restarted(SECOND, 1, { observedGeneration: 1 });
      restart.readDeployments.mockResolvedValueOnce([restarted(FIRST, 1), stuck]);

      await restart.show([restarted(FIRST, 1), stuck]);
      await elapse(300_000);
      await restart.show([restarted(FIRST, 1, { replicas: 2 }), stuck]);
      await elapse(360_000);

      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${SECOND} did not finish rolling out in time`
      );
    });

    it('stops waiting after an hour even while a rollout keeps changing', async () => {
      const restart = await begin([makeDeployment(FIRST, 4)]);
      restart.readDeployments.mockResolvedValueOnce([restarted(FIRST, 4, { updatedReplicas: 2 })]);

      for (let step = 0; step < 6; step++) {
        await restart.show([restarted(FIRST, 4, { updatedReplicas: step % 2 === 0 ? 1 : 2 })]);
        await elapse(500_000);
      }
      expect(restart.readDeployments).not.toHaveBeenCalled();

      for (let step = 6; step < 8; step++) {
        await restart.show([restarted(FIRST, 4, { updatedReplicas: step % 2 === 0 ? 1 : 2 })]);
        await elapse(500_000);
      }

      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      expect(notifyError).toHaveBeenCalledWith(
        `Restart did not complete: ${FIRST} did not finish rolling out in time`
      );
    });

    it("waits for the Deployment's own progress deadline plus one minute", async () => {
      const running = makeDeployment(FIRST, 1, {}, { progressDeadlineSeconds: 120 });
      const restart = await begin([running]);
      restart.readDeployments.mockResolvedValueOnce([restarted(FIRST, 1)]);

      await elapse(179_000);
      expect(restart.readDeployments).not.toHaveBeenCalled();

      await elapse(1_000);

      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
    });

    it('caps the wait at an hour for a Deployment without a progress deadline', async () => {
      const running = makeDeployment(FIRST, 1, {}, { progressDeadlineSeconds: 2_147_483_647 });
      const restart = await begin([running]);
      restart.readDeployments.mockResolvedValueOnce([restarted(FIRST, 1)]);

      await elapse(3_599_000);
      expect(notifyError).not.toHaveBeenCalled();
      expect(restart.readDeployments).not.toHaveBeenCalled();

      await elapse(1_000);

      expect(restart.readDeployments).toHaveBeenCalledTimes(1);
      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
    });

    it('keeps waiting while the rollout keeps making progress', async () => {
      const restart = await begin([makeDeployment(FIRST, 3)]);

      await restart.show([restarted(FIRST, 3, { updatedReplicas: 1, replicas: 4 })]);
      await elapse(500_000);
      await restart.show([restarted(FIRST, 3, { updatedReplicas: 2, replicas: 4 })]);
      await elapse(500_000);
      await restart.show([restarted(FIRST, 3)]);

      expect(notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
      expect(restart.readDeployments).not.toHaveBeenCalled();
    });
  });

  describe('when the component goes away', () => {
    it('removes the progress message and stops following', async () => {
      const restart = await begin([makeDeployment(FIRST, 1)]);

      restart.unmount();
      expect(closeSnackbar).toHaveBeenCalledWith('progress');

      await elapse(3_600_000);

      expect(restart.readDeployments).not.toHaveBeenCalled();
      expect(notifyError).not.toHaveBeenCalled();
      expect(notifyInfo).not.toHaveBeenCalled();
      expect(restart.onFinished).not.toHaveBeenCalled();
    });
  });
});
