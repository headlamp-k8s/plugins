import { describe, expect, it } from 'vitest';
import {
  createStopPolicyPatch,
  getStopPolicyColor,
  getStopPolicyDescription,
  getStopPolicyLabel,
} from './queueControlFormatters';

describe('queueControlFormatters', () => {
  describe('getStopPolicyColor', () => {
    it('returns error for HoldAndDrain', () => {
      expect(getStopPolicyColor('HoldAndDrain')).toBe('error');
    });

    it('returns warning for Hold', () => {
      expect(getStopPolicyColor('Hold')).toBe('warning');
    });

    it('returns success for None, empty, or undefined', () => {
      expect(getStopPolicyColor('None')).toBe('success');
      expect(getStopPolicyColor('')).toBe('success');
      expect(getStopPolicyColor(undefined)).toBe('success');
    });

    it('returns default for unknown string', () => {
      expect(getStopPolicyColor('CustomPolicy')).toBe('default');
    });
  });

  describe('getStopPolicyLabel', () => {
    it('returns correct label for standard policies', () => {
      expect(getStopPolicyLabel('HoldAndDrain')).toBe('Drain (HoldAndDrain)');
      expect(getStopPolicyLabel('Hold')).toBe('Paused (Hold)');
      expect(getStopPolicyLabel('None')).toBe('Active (None)');
      expect(getStopPolicyLabel(undefined)).toBe('Active (None)');
    });
  });

  describe('getStopPolicyDescription', () => {
    it('returns explanatory description for each policy state', () => {
      expect(getStopPolicyDescription('HoldAndDrain')).toContain('Drain mode');
      expect(getStopPolicyDescription('Hold')).toContain('Pause mode');
      expect(getStopPolicyDescription('None')).toContain('Active');
      expect(getStopPolicyDescription(undefined)).toContain('Active');
    });
  });

  describe('createStopPolicyPatch', () => {
    it('creates standard spec patch', () => {
      expect(createStopPolicyPatch('Hold')).toEqual({
        spec: { stopPolicy: 'Hold' },
      });
      expect(createStopPolicyPatch('None')).toEqual({
        spec: { stopPolicy: 'None' },
      });
    });
  });
});
