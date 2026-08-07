import { describe, expect, it } from 'vitest';
import {
  renderWorkloadPriorityClassDescription,
  renderWorkloadPriorityClassValue,
} from './workloadPriorityClassFormatters';

describe('WorkloadPriorityClass formatters', () => {
  describe('renderWorkloadPriorityClassValue', () => {
    it('returns the stringified value when present', () => {
      expect(renderWorkloadPriorityClassValue(100)).toBe('100');
      expect(renderWorkloadPriorityClassValue(-50)).toBe('-50');
    });

    it('returns "0" strictly when value is 0', () => {
      expect(renderWorkloadPriorityClassValue(0)).toBe('0');
    });

    it('returns "-" when value is missing', () => {
      expect(renderWorkloadPriorityClassValue()).toBe('-');
      expect(renderWorkloadPriorityClassValue(undefined)).toBe('-');
    });
  });

  describe('renderWorkloadPriorityClassDescription', () => {
    it('returns the description when present', () => {
      expect(renderWorkloadPriorityClassDescription('Test desc')).toBe('Test desc');
    });

    it('returns "-" when description is missing', () => {
      expect(renderWorkloadPriorityClassDescription()).toBe('-');
      expect(renderWorkloadPriorityClassDescription(undefined)).toBe('-');
      expect(renderWorkloadPriorityClassDescription('')).toBe('-');
    });
  });
});
