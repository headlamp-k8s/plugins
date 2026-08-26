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

    it('returns success for None, empty, dash, or undefined', () => {
      expect(getStopPolicyColor('None')).toBe('success');
      expect(getStopPolicyColor('')).toBe('success');
      expect(getStopPolicyColor('-')).toBe('success');
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
      expect(getStopPolicyLabel('None')).toBe('No maintenance stop policy (None)');
      expect(getStopPolicyLabel('-')).toBe('No maintenance stop policy (None)');
      expect(getStopPolicyLabel(undefined)).toBe('No maintenance stop policy (None)');
    });

    it('supports localization function', () => {
      const mockT = (key: string) => `[translated] ${key}`;
      expect(getStopPolicyLabel('HoldAndDrain', mockT)).toBe('[translated] Drain (HoldAndDrain)');
      expect(getStopPolicyLabel('Hold', mockT)).toBe('[translated] Paused (Hold)');
      expect(getStopPolicyLabel('None', mockT)).toBe(
        '[translated] No maintenance stop policy (None)'
      );
    });
  });

  describe('getStopPolicyDescription', () => {
    it('returns explanatory description for each policy state', () => {
      expect(getStopPolicyDescription('HoldAndDrain')).toContain('Drain mode');
      expect(getStopPolicyDescription('HoldAndDrain')).toContain('admitted workloads are evicted');
      expect(getStopPolicyDescription('HoldAndDrain')).toContain(
        'reservations for Reserving workloads are cancelled'
      );
      expect(getStopPolicyDescription('Hold')).toContain('Pause mode');
      expect(getStopPolicyDescription('Hold')).toContain(
        'reservations for Reserving workloads are cancelled'
      );
      expect(getStopPolicyDescription('None')).toContain('No maintenance stop policy');
      expect(getStopPolicyDescription('-')).toContain('No maintenance stop policy');
      expect(getStopPolicyDescription(undefined)).toContain('No maintenance stop policy');
    });

    it('supports localization function', () => {
      const mockT = (key: string) => `[translated] ${key}`;
      expect(getStopPolicyDescription('HoldAndDrain', mockT)).toContain('[translated]');
      expect(getStopPolicyDescription('Hold', mockT)).toContain('[translated]');
      expect(getStopPolicyDescription('None', mockT)).toContain('[translated]');
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
