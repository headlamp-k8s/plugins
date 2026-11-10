import { describe, expect, it } from 'vitest';
import { renderDescription, renderPriorityValue } from './workloadPriorityClassFormatters';

describe('WorkloadPriorityClass formatters', () => {
  it('formats priority value correctly preserving 0 and negative integers', () => {
    expect(renderPriorityValue(10000)).toBe(10000);
    expect(renderPriorityValue(0)).toBe(0);
    expect(renderPriorityValue(-50)).toBe(-50);
    expect(renderPriorityValue(undefined)).toBe('-');
    expect(renderPriorityValue(null as any)).toBe('-');
  });

  it('formats description correctly handling empty strings and whitespace', () => {
    expect(renderDescription('Production critical workloads')).toBe(
      'Production critical workloads'
    );
    expect(renderDescription('')).toBe('-');
    expect(renderDescription('   ')).toBe('-');
    expect(renderDescription(undefined)).toBe('-');
  });
});
