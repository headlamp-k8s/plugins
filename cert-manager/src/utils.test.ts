import { describe, expect, it } from 'vitest';
import { getCertificateExpiryInfo, SEVEN_DAYS_MS, THIRTY_DAYS_MS } from './utils';

describe('getCertificateExpiryInfo', () => {
  const now = new Date('2026-10-25T12:00:00Z').getTime();

  it('returns null for empty or invalid notAfter values', () => {
    expect(getCertificateExpiryInfo(null, now)).toBeNull();
    expect(getCertificateExpiryInfo(undefined, now)).toBeNull();
    expect(getCertificateExpiryInfo('', now)).toBeNull();
    expect(getCertificateExpiryInfo('not-a-date', now)).toBeNull();
  });

  it('reports expired certificates when notAfter is in the past or now', () => {
    const expiredPast = new Date(now - 1000).toISOString();
    const resultPast = getCertificateExpiryInfo(expiredPast, now);
    expect(resultPast).toEqual({
      label: 'Expired',
      status: 'error',
      isExpired: true,
      diffMs: -1000,
    });

    const expiredExact = new Date(now).toISOString();
    const resultExact = getCertificateExpiryInfo(expiredExact, now);
    expect(resultExact).toEqual({
      label: 'Expired',
      status: 'error',
      isExpired: true,
      diffMs: 0,
    });
  });

  it('reports error status for certificates expiring within 7 days', () => {
    // 3 days in the future
    const threeDays = new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = getCertificateExpiryInfo(threeDays, now);
    expect(result).not.toBeNull();
    expect(result?.status).toBe('error');
    expect(result?.isExpired).toBe(false);
    expect(result?.label).toBe('3d');
  });

  it('reports warning status for certificates expiring between 7 and 30 days', () => {
    // 15 days in the future
    const fifteenDays = new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString();
    const result = getCertificateExpiryInfo(fifteenDays, now);
    expect(result).not.toBeNull();
    expect(result?.status).toBe('warning');
    expect(result?.isExpired).toBe(false);
    expect(result?.label).toBe('15d');
  });

  it('reports success status for certificates expiring beyond 30 days', () => {
    // 60 days in the future
    const sixtyDays = new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString();
    const result = getCertificateExpiryInfo(sixtyDays, now);
    expect(result).not.toBeNull();
    expect(result?.status).toBe('success');
    expect(result?.isExpired).toBe(false);
    expect(result?.label).toBe('60d');
  });

  it('handles boundary conditions at exactly 7 and 30 days', () => {
    // Exactly 7 days minus 1 second -> error (< 7 days)
    const justUnderSeven = new Date(now + SEVEN_DAYS_MS - 1000).toISOString();
    expect(getCertificateExpiryInfo(justUnderSeven, now)?.status).toBe('error');

    // Exactly 7 days -> warning (>= 7 days and < 30 days)
    const exactlySeven = new Date(now + SEVEN_DAYS_MS).toISOString();
    expect(getCertificateExpiryInfo(exactlySeven, now)?.status).toBe('warning');

    // Exactly 30 days -> success (>= 30 days)
    const exactlyThirty = new Date(now + THIRTY_DAYS_MS).toISOString();
    expect(getCertificateExpiryInfo(exactlyThirty, now)?.status).toBe('success');
  });
});
