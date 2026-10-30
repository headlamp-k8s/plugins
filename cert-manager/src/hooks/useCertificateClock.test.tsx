import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useCertificateClock } from './useCertificateClock';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('shares one timer, refreshes on focus, and cleans up after the last subscriber', () => {
  vi.useFakeTimers();
  vi.setSystemTime('2030-01-01T00:00:00Z');
  const first = renderHook(useCertificateClock);
  const second = renderHook(useCertificateClock);
  expect(vi.getTimerCount()).toBe(1);
  act(() => vi.advanceTimersByTime(30_000));
  expect(first.result.current).toBe(Date.now());
  expect(second.result.current).toBe(first.result.current);
  vi.setSystemTime('2030-02-01T00:00:00Z');
  act(() => window.dispatchEvent(new Event('focus')));
  expect(first.result.current).toBe(Date.now());
  first.unmount();
  expect(vi.getTimerCount()).toBe(1);
  second.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
