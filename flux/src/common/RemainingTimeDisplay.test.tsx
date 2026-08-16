import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatRemainingTime } from './remainingTime';
import RemainingTimeDisplay from './RemainingTimeDisplay';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  HoverInfoLabel: ({ label }: { label: string }) => <span>{label}</span>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/cluster', () => ({}));

// The helpers barrel pulls in unrelated Headlamp modules, so only the one
// function this component uses is stubbed here.
vi.mock('../helpers', () => ({
  parseDuration: (d: string) => {
    const m = /^(\d+)([smh])$/.exec(d);
    if (!m) return 0;
    const n = Number(m[1]);
    return m[2] === 'h' ? n * 3600000 : m[2] === 'm' ? n * 60000 : n * 1000;
  },
}));

describe('formatRemainingTime', () => {
  const now = 1700000000000;

  it('formats a seconds-scale future time', () => {
    expect(formatRemainingTime(now + 45 * 1000, now)).toBe('45s');
  });

  it('formats a minute-scale future time', () => {
    expect(formatRemainingTime(now + 5 * 60 * 1000, now)).toBe('5m');
  });
});

describe('RemainingTimeDisplay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // An item whose last reconcile was just now, so the next attempt is one
  // interval away and the component schedules a refresh timeout.
  function itemDueIn(interval: string) {
    return {
      jsonData: {
        spec: { interval },
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'True',
              lastTransitionTime: new Date().toISOString(),
            },
          ],
        },
      },
    } as any;
  }

  it('clears its pending timeout when unmounted', () => {
    const setSpy = vi.spyOn(window, 'setTimeout');
    const clearSpy = vi.spyOn(window, 'clearTimeout');

    const { unmount } = render(<RemainingTimeDisplay item={itemDueIn('5m')} />);
    expect(setSpy).toHaveBeenCalled();

    clearSpy.mockClear();
    unmount();

    expect(clearSpy).toHaveBeenCalled();
  });
});
