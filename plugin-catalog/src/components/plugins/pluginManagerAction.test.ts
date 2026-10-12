import { beforeEach, describe, expect, test, vi } from 'vitest';
import { pollPluginManagerStatus } from './pluginManagerAction';

const getStatus = vi.fn();

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  PluginManager: {
    getStatus: (...args: unknown[]) => getStatus(...args),
  },
}));

describe('pollPluginManagerStatus', () => {
  beforeEach(() => {
    getStatus.mockReset();
  });

  test('returns success when the operation completes', async () => {
    getStatus
      .mockResolvedValueOnce({ type: 'in-progress', message: 'working' })
      .mockResolvedValueOnce({ type: 'success', message: 'done' });

    const status = await pollPluginManagerStatus('repo_plugin', {
      isCancelled: () => false,
      shouldContinue: () => true,
      intervalMs: 1,
    });

    expect(status).toEqual({ type: 'success', message: 'done' });
    expect(getStatus).toHaveBeenCalledTimes(2);
  });
});
