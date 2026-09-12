import { deriveCapiStatus } from './capiStatus';

describe('capiStatus.ts', () => {
  describe('deriveCapiStatus', () => {
    it('returns success when Available condition is True (v1beta2)', () => {
      const item: any = {
        status: {
          conditions: [{ type: 'Available', status: 'True', reason: 'Ready' }],
        },
      };
      expect(deriveCapiStatus(item)).toBe('success');
    });

    it('returns error when Available condition is False', () => {
      const item: any = {
        status: {
          conditions: [{ type: 'Available', status: 'False', reason: 'Unavailable' }],
        },
      };
      expect(deriveCapiStatus(item)).toBe('error');
    });

    it('returns success when Ready condition is True (v1beta1)', () => {
      const item: any = {
        status: {
          conditions: [{ type: 'Ready', status: 'True', reason: 'Ready' }],
        },
      };
      expect(deriveCapiStatus(item)).toBe('success');
    });

    it('returns error when Ready condition is False', () => {
      const item: any = {
        status: {
          conditions: [{ type: 'Ready', status: 'False', reason: 'NotReady' }],
        },
      };
      expect(deriveCapiStatus(item)).toBe('error');
    });

    it('returns warning when Ready condition is Unknown', () => {
      const item: any = {
        status: {
          conditions: [{ type: 'Ready', status: 'Unknown', reason: 'Pending' }],
        },
      };
      expect(deriveCapiStatus(item)).toBe('warning');
    });

    it('falls back to phase when no condition present', () => {
      const item: any = {
        status: { phase: 'Running' },
      };
      expect(deriveCapiStatus(item)).toBe('success');
    });

    it('returns undefined when no status info available', () => {
      const item: any = {};
      expect(deriveCapiStatus(item)).toBeUndefined();
    });

    it('prioritizes Available condition over Ready', () => {
      const item: any = {
        status: {
          conditions: [
            { type: 'Available', status: 'True', reason: 'Ready' },
            { type: 'Ready', status: 'False', reason: 'NotReady' },
          ],
        },
      };
      expect(deriveCapiStatus(item)).toBe('success');
    });
  });
});
