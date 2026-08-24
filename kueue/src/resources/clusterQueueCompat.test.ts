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

  /**
   * Regression tests for the Detail page admission check row pipeline.
   *
   * Detail.tsx builds admission check rows by calling:
   *   getAdmissionChecksStrategy(clusterQueue.spec)?.admissionChecks?.map(...)
   *
   * These tests replicate that exact pipeline to verify that v1beta1 flat
   * admissionChecks produce non-empty rows through the resolver.
   * A caller that bypasses the resolver and reads spec.admissionChecksStrategy
   * directly would get empty rows for v1beta1 — this is the bug the reviewer
   * identified.
   */
  describe('Detail page admission check row pipeline', () => {
    /** Replicate the row-building logic from Detail.tsx getAdmissionCheckRows. */
    function buildAdmissionCheckRows(spec: Record<string, unknown>) {
      return (
        getAdmissionChecksStrategy(spec)?.admissionChecks?.map(check => ({
          name: check.name,
          flavors: check.onFlavors || [],
        })) || []
      );
    }

    it('builds rows from v1beta2 admissionChecksStrategy', () => {
      expect(
        buildAdmissionCheckRows({
          admissionChecksStrategy: {
            admissionChecks: [
              { name: 'prov-request', onFlavors: ['spot'] },
              { name: 'quota-check', onFlavors: ['default', 'gpu-flavor'] },
            ],
          },
        })
      ).toEqual([
        { name: 'prov-request', flavors: ['spot'] },
        { name: 'quota-check', flavors: ['default', 'gpu-flavor'] },
      ]);
    });

    it('builds rows from v1beta1 flat admissionChecks via compatibility resolver', () => {
      const rows = buildAdmissionCheckRows({
        admissionChecks: ['check-a', 'check-b'],
      });

      expect(rows).toEqual([
        { name: 'check-a', flavors: [] },
        { name: 'check-b', flavors: [] },
      ]);
    });

    it('returns empty array when no admission checks are configured', () => {
      expect(buildAdmissionCheckRows({})).toEqual([]);
    });

    it('prefers v1beta2 strategy over v1beta1 flat list when both are present', () => {
      expect(
        buildAdmissionCheckRows({
          admissionChecksStrategy: {
            admissionChecks: [{ name: 'v2-check', onFlavors: ['spot'] }],
          },
          admissionChecks: ['v1-check-a', 'v1-check-b'],
        })
      ).toEqual([{ name: 'v2-check', flavors: ['spot'] }]);
    });

    it('falls back to v1beta1 when v1beta2 strategy has empty admissionChecks', () => {
      expect(
        buildAdmissionCheckRows({
          admissionChecksStrategy: { admissionChecks: [] },
          admissionChecks: ['fallback-check'],
        })
      ).toEqual([{ name: 'fallback-check', flavors: [] }]);
    });

    it('v1beta1 checks have no per-flavor scoping and use empty flavors', () => {
      const rows = buildAdmissionCheckRows({
        admissionChecks: ['check-a'],
      });

      expect(rows).toHaveLength(1);
      expect(rows[0].flavors).toEqual([]);
    });
  });
});
