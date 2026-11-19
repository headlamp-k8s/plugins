import { describe, expect, it } from 'vitest';
import { formatHPAPolicyValue } from './hpaPolicy';

describe('formatHPAPolicyValue', () => {
  it('adds a percent sign to Percent policies', () => {
    expect(formatHPAPolicyValue({ type: 'Percent', value: 100 })).toBe('100%');
  });

  it('shows Pods policies as a plain pod count', () => {
    expect(formatHPAPolicyValue({ type: 'Pods', value: 4 })).toBe('4');
  });
});
