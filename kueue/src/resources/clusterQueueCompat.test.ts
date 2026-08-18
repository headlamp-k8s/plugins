import { describe, expect, it } from 'vitest';
import { getAdmissionChecksStrategy, getCohortName } from './clusterQueueCompat';
import { renderAdmissionChecks } from './clusterQueueFormatters';

describe('ClusterQueue compatibility resolvers', () => {
  describe('getCohortName', () => {
    it('resolves cohort from v1beta2 cohortName', () => {
      expect(getCohortName({ cohortName: 'research' })).toBe('research');
    });

    it('resolves cohort from v1beta1 cohort fallback', () => {
      expect(getCohortName({ cohort: 'research' })).toBe('research');
    });

    it('prioritizes v1beta2 cohortName when both are present', () => {
      expect(getCohortName({ cohortName: 'v2-name', cohort: 'v1-name' })).toBe('v2-name');
    });

    it('returns undefined for undefined or empty specs', () => {
      expect(getCohortName(undefined)).toBeUndefined();
      expect(getCohortName({})).toBeUndefined();
    });

    it('handles empty string cohort values', () => {
      expect(getCohortName({ cohortName: '', cohort: '' })).toBeUndefined();
      expect(getCohortName({ cohortName: '' })).toBeUndefined();
      expect(getCohortName({ cohort: '' })).toBeUndefined();
    });
  });

  describe('getAdmissionChecksStrategy', () => {
    it('returns v1beta2 strategy unchanged when present', () => {
      const strategy = {
        admissionChecks: [{ name: 'prov-request', onFlavors: ['spot'] }],
      };
      expect(getAdmissionChecksStrategy({ admissionChecksStrategy: strategy })).toBe(strategy);
    });

    it('converts v1beta1 flat array into admissionChecksStrategy shape', () => {
      expect(
        getAdmissionChecksStrategy({
          admissionChecks: ['prov-request'],
        })
      ).toEqual({
        admissionChecks: [{ name: 'prov-request' }],
      });
    });

    it('converts multiple v1beta1 admission checks', () => {
      expect(
        getAdmissionChecksStrategy({
          admissionChecks: ['prov-request', 'quota-check'],
        })
      ).toEqual({
        admissionChecks: [{ name: 'prov-request' }, { name: 'quota-check' }],
      });
    });

    it('prioritizes non-empty v1beta2 strategy over v1beta1 admissionChecks', () => {
      const v2Strategy = {
        admissionChecks: [{ name: 'v2-check' }],
      };
      expect(
        getAdmissionChecksStrategy({
          admissionChecksStrategy: v2Strategy,
          admissionChecks: ['v1-check'],
        })
      ).toBe(v2Strategy);
    });

    it('falls back to v1beta1 when v1beta2 strategy has empty admissionChecks', () => {
      expect(
        getAdmissionChecksStrategy({
          admissionChecksStrategy: { admissionChecks: [] },
          admissionChecks: ['v1-check'],
        })
      ).toEqual({
        admissionChecks: [{ name: 'v1-check' }],
      });
    });

    it('returns undefined or empty strategy when no admission checks exist', () => {
      expect(getAdmissionChecksStrategy(undefined)).toBeUndefined();
      expect(getAdmissionChecksStrategy({})).toBeUndefined();
      expect(getAdmissionChecksStrategy({ admissionChecks: [] })).toBeUndefined();
      expect(
        getAdmissionChecksStrategy({
          admissionChecksStrategy: { admissionChecks: [] },
        })
      ).toEqual({ admissionChecks: [] });
    });

    it('formats converted v1beta1 checks as applying to all flavors', () => {
      const v1beta1Spec = {
        admissionChecks: ['prov-request', 'quota-check'],
      };
      const resolvedStrategy = getAdmissionChecksStrategy(v1beta1Spec);

      expect(renderAdmissionChecks(resolvedStrategy)).toBe(
        'prov-request (all flavors); quota-check (all flavors)'
      );
    });
  });
});
