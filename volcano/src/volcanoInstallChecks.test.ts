import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request },
}));

import { probeVolcanoCoreInstalled, probeVolcanoFlowInstalled } from './volcanoInstallChecks';

const SCHEDULING_PATH = '/apis/scheduling.volcano.sh/v1beta1';
const JOB_PATH = '/apis/batch.volcano.sh/v1alpha1';
const FLOW_PATH = '/apis/flow.volcano.sh/v1alpha1';

/** Builds the ApiError shape Headlamp rejects with: an Error carrying `status`. */
function apiError(status?: number): Error {
  return Object.assign(new Error(`request failed: ${status}`), { status });
}

/** Routes each discovery path to its own resolved value or rejection. */
function respondPerPath(outcomes: Record<string, unknown>) {
  request.mockImplementation((path: string) => {
    const outcome = outcomes[path];
    return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
  });
}

describe('probeVolcanoCoreInstalled', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('reports installed when both required groups are served', async () => {
    respondPerPath({ [SCHEDULING_PATH]: {}, [JOB_PATH]: {} });

    await expect(probeVolcanoCoreInstalled()).resolves.toBe('installed');
    expect(request).toHaveBeenCalledWith(SCHEDULING_PATH, { method: 'GET' });
    expect(request).toHaveBeenCalledWith(JOB_PATH, { method: 'GET' });
  });

  it('reports absent when every group returns 404', async () => {
    respondPerPath({ [SCHEDULING_PATH]: apiError(404), [JOB_PATH]: apiError(404) });

    await expect(probeVolcanoCoreInstalled()).resolves.toBe('absent');
  });

  it('reports absent when one required group is missing', async () => {
    respondPerPath({ [SCHEDULING_PATH]: {}, [JOB_PATH]: apiError(404) });

    await expect(probeVolcanoCoreInstalled()).resolves.toBe('absent');
  });

  it('prefers unreachable over absent when a probe was inconclusive', async () => {
    respondPerPath({ [SCHEDULING_PATH]: apiError(403), [JOB_PATH]: apiError(404) });

    await expect(probeVolcanoCoreInstalled()).resolves.toBe('unreachable');
  });

  it('reports unreachable when one group is served and the other is inconclusive', async () => {
    respondPerPath({ [SCHEDULING_PATH]: {}, [JOB_PATH]: apiError(502) });

    await expect(probeVolcanoCoreInstalled()).resolves.toBe('unreachable');
  });

  it('keeps probing every group even when one rejects', async () => {
    respondPerPath({ [SCHEDULING_PATH]: apiError(404), [JOB_PATH]: {} });

    await expect(probeVolcanoCoreInstalled()).resolves.toBe('absent');
    expect(request).toHaveBeenCalledTimes(2);
  });
});

describe('probeVolcanoFlowInstalled', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('reports installed when the flow group is served', async () => {
    respondPerPath({ [FLOW_PATH]: {} });

    await expect(probeVolcanoFlowInstalled()).resolves.toBe('installed');
    expect(request).toHaveBeenCalledWith(FLOW_PATH, { method: 'GET' });
  });

  it('reports absent only when discovery returns 404', async () => {
    respondPerPath({ [FLOW_PATH]: apiError(404) });

    await expect(probeVolcanoFlowInstalled()).resolves.toBe('absent');
  });

  it('reports unreachable for the 408 Headlamp synthesises on timeout', async () => {
    respondPerPath({ [FLOW_PATH]: apiError(408) });

    await expect(probeVolcanoFlowInstalled()).resolves.toBe('unreachable');
  });

  it('reports unreachable when the rejection carries no status', async () => {
    respondPerPath({ [FLOW_PATH]: new Error('network down') });

    await expect(probeVolcanoFlowInstalled()).resolves.toBe('unreachable');
  });
});
