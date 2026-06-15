import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  vi.useRealTimers();
});

async function loadHook(options?: { cluster?: string | null; isElectron?: boolean }) {
  vi.resetModules();

  const cluster = options?.cluster ?? 'my-cluster';
  const mockGetCluster = vi.fn(() => cluster);
  const mockNotifyClusterChange = vi.fn();

  // Set up window.desktopApi if electron
  if (options?.isElectron) {
    (globalThis as any).window = { desktopApi: { notifyClusterChange: mockNotifyClusterChange } };
  } else {
    (globalThis as any).window = {};
  }

  let stateIndex = 0;
  const effects: Array<() => void | (() => void)> = [];
  const mockSetCurrentCluster = vi.fn();

  vi.doMock('react', () => {
    const React = {
      useState: vi.fn((init: unknown) => {
        if (stateIndex === 0) {
          stateIndex++;
          return [init, mockSetCurrentCluster];
        }
        stateIndex++;
        return [init, vi.fn()];
      }),
      useEffect: vi.fn((effect: () => void | (() => void)) => {
        effects.push(effect);
      }),
      useRef: vi.fn((init: unknown) => ({ current: init })),
    };
    return { ...React, default: React };
  });

  vi.doMock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
    getCluster: mockGetCluster,
  }));

  const module = await import('./useClusterChangeNotifier');

  return {
    useClusterChangeNotifier: module.useClusterChangeNotifier,
    ClusterChangeNotifier: module.ClusterChangeNotifier,
    mockGetCluster,
    mockNotifyClusterChange,
    mockSetCurrentCluster,
    effects,
  };
}

describe('useClusterChangeNotifier', () => {
  it('returns null as initial current cluster', async () => {
    const { useClusterChangeNotifier } = await loadHook({ cluster: 'test-cluster' });
    const result = useClusterChangeNotifier();
    // Initial state is null (from useState(null))
    expect(result).toBeNull();
  });

  it('exports ClusterChangeNotifier component that returns null', async () => {
    const { ClusterChangeNotifier } = await loadHook();
    const result = ClusterChangeNotifier();
    expect(result).toBeNull();
  });

  it('sets up effects for cluster monitoring', async () => {
    const { useClusterChangeNotifier, effects } = await loadHook({ cluster: 'test-cluster' });
    useClusterChangeNotifier();
    // Should have registered 2 useEffect calls
    expect(effects.length).toBe(2);
  });

  it('first effect sets up interval for cluster checking', async () => {
    vi.useFakeTimers();
    const { useClusterChangeNotifier, effects, mockGetCluster } = await loadHook({
      cluster: 'new-cluster',
    });
    useClusterChangeNotifier();

    // Run the first effect (cluster polling)
    const cleanup = effects[0]();

    // getCluster should have been called at least once (initial check)
    expect(mockGetCluster).toHaveBeenCalled();

    // Cleanup should clear the interval
    if (typeof cleanup === 'function') {
      cleanup();
    }
  });

  it('does not notify when not running in Electron', async () => {
    const { useClusterChangeNotifier, effects, mockNotifyClusterChange } = await loadHook({
      cluster: 'test-cluster',
      isElectron: false,
    });
    useClusterChangeNotifier();

    // Run the second effect (notification)
    if (effects[1]) {
      effects[1]();
    }

    expect(mockNotifyClusterChange).not.toHaveBeenCalled();
  });
});
