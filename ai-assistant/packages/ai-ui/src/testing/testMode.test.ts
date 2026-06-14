import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTestModeCheck } from './testMode';

afterEach(() => vi.unstubAllEnvs());

describe('isTestModeCheck', () => {
  it('enables test mode only for the exact true string', () => {
    vi.stubEnv('VITE_HEADLAMP_AI_TEST', 'true');
    expect(isTestModeCheck()).toBe(true);
  });

  it.each(['false', 'TRUE', '1'])('disables test mode for %s', value => {
    vi.stubEnv('VITE_HEADLAMP_AI_TEST', value);
    expect(isTestModeCheck()).toBe(false);
  });

  it('disables test mode when the variable is absent', () => {
    vi.stubEnv('VITE_HEADLAMP_AI_TEST', undefined);
    expect(isTestModeCheck()).toBe(false);
  });
});
