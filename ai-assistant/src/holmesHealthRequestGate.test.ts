import { describe, expect, it } from 'vitest';
import { HolmesHealthRequestGate } from './holmesHealthRequestGate';

describe('HolmesHealthRequestGate', () => {
  it('accepts only the most recently started request', () => {
    const gate = new HolmesHealthRequestGate();
    const first = gate.begin();
    const second = gate.begin();

    expect(gate.isCurrent(first)).toBe(false);
    expect(gate.isCurrent(second)).toBe(true);
  });

  it('invalidates a pending request when the user leaves Holmes mode', () => {
    const gate = new HolmesHealthRequestGate();
    const pending = gate.begin();
    gate.invalidate();

    expect(gate.isCurrent(pending)).toBe(false);
  });
});
