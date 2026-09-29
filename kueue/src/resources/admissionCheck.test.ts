import { describe, expect, it } from 'vitest';
import {
  renderAdmissionCheckStatus,
  renderControllerName,
  renderParametersRef,
  renderRetryDelay,
} from './admissionCheckFormatters';

describe('AdmissionCheck formatters', () => {
  describe('renderControllerName', () => {
    it('formats controller name when valid', () => {
      expect(renderControllerName('kueue.x-k8s.io/provisioning-request')).toBe(
        'kueue.x-k8s.io/provisioning-request'
      );
      expect(renderControllerName('kueue.x-k8s.io/multikueue')).toBe(
        'kueue.x-k8s.io/multikueue'
      );
    });

    it('returns fallback dash for empty or missing controller name', () => {
      expect(renderControllerName('')).toBe('-');
      expect(renderControllerName('   ')).toBe('-');
      expect(renderControllerName(undefined)).toBe('-');
    });
  });

  describe('renderRetryDelay', () => {
    it('formats retry delay in seconds with unit suffix', () => {
      expect(renderRetryDelay(undefined, 15)).toBe('15s');
      expect(renderRetryDelay(undefined, 0)).toBe('0s');
    });

    it('formats retry delay in minutes with unit suffix', () => {
      expect(renderRetryDelay(15, undefined)).toBe('15m');
      expect(renderRetryDelay(30, undefined)).toBe('30m');
    });

    it('returns fallback dash for undefined delays', () => {
      expect(renderRetryDelay(undefined, undefined)).toBe('-');
      expect(renderRetryDelay(null as any, null as any)).toBe('-');
    });
  });

  describe('renderParametersRef', () => {
    it('formats group, kind, and name when fully specified', () => {
      expect(
        renderParametersRef({
          apiGroup: 'autoscaling.x-k8s.io',
          kind: 'ProvisioningRequestConfig',
          name: 'default-config',
        })
      ).toBe('autoscaling.x-k8s.io/ProvisioningRequestConfig: default-config');
    });

    it('formats kind and name when group is omitted', () => {
      expect(
        renderParametersRef({
          kind: 'ConfigMap',
          name: 'custom-config',
        })
      ).toBe('ConfigMap: custom-config');
    });

    it('uses default Resource kind when kind is omitted', () => {
      expect(
        renderParametersRef({
          apiGroup: 'kueue.x-k8s.io',
          name: 'custom-resource',
        })
      ).toBe('kueue.x-k8s.io/Resource: custom-resource');
    });

    it('returns fallback dash for null, undefined, or empty parameters', () => {
      expect(renderParametersRef(null)).toBe('-');
      expect(renderParametersRef(undefined)).toBe('-');
      expect(renderParametersRef({})).toBe('-');
      expect(renderParametersRef({ name: '' })).toBe('-');
    });
  });

  describe('renderAdmissionCheckStatus', () => {
    it('returns Unknown for empty or undefined conditions', () => {
      expect(renderAdmissionCheckStatus([])).toBe('Unknown');
      expect(renderAdmissionCheckStatus(undefined)).toBe('Unknown');
    });

    it('formats Active condition status correctly', () => {
      expect(
        renderAdmissionCheckStatus([
          {
            type: 'Active',
            status: 'True',
            lastTransitionTime: '',
          },
        ])
      ).toBe('Active');

      expect(
        renderAdmissionCheckStatus([
          {
            type: 'Active',
            status: 'False',
            lastTransitionTime: '',
          },
        ])
      ).toBe('Inactive');
    });

    it('formats Ready condition status when Active is not present', () => {
      expect(
        renderAdmissionCheckStatus([
          {
            type: 'Ready',
            status: 'True',
            lastTransitionTime: '',
          },
        ])
      ).toBe('Ready');

      expect(
        renderAdmissionCheckStatus([
          {
            type: 'Ready',
            status: 'False',
            lastTransitionTime: '',
          },
        ])
      ).toBe('Not Ready');
    });

    it('falls back to first condition type if Active/Ready are not present', () => {
      expect(
        renderAdmissionCheckStatus([
          {
            type: 'CustomValidation',
            status: 'True',
            lastTransitionTime: '',
          },
        ])
      ).toBe('CustomValidation');
    });
  });
});
