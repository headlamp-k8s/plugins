import { describe, expect, it } from 'vitest';
import { formatExpiryLabel, getCertificateExpiry, needsExpiryAttention } from './certificateExpiry';

const NOW = Date.parse('2026-08-19T12:00:00.000Z');

function isoFromDays(days: number): string {
  return new Date(NOW + days * 24 * 60 * 60 * 1000).toISOString();
}

describe('getCertificateExpiry', () => {
  it('returns unknown when notAfter is missing or invalid', () => {
    expect(getCertificateExpiry(undefined, NOW).level).toBe('unknown');
    expect(getCertificateExpiry('not-a-date', NOW).level).toBe('unknown');
  });

  it('marks certificates with more than 30 days left as ok', () => {
    const expiry = getCertificateExpiry(isoFromDays(45), NOW);
    expect(expiry.level).toBe('ok');
    expect(expiry.daysRemaining).toBe(45);
    expect(expiry.statusLabelStatus).toBe('success');
  });

  it('marks certificates with fewer than 30 days left as warning', () => {
    const expiry = getCertificateExpiry(isoFromDays(12), NOW);
    expect(expiry.level).toBe('warning');
    expect(expiry.statusLabelStatus).toBe('warning');
  });

  it('marks certificates with fewer than 7 days left as critical', () => {
    const expiry = getCertificateExpiry(isoFromDays(3), NOW);
    expect(expiry.level).toBe('critical');
    expect(expiry.statusLabelStatus).toBe('error');
  });

  it('treats exactly 7 days as warning, not critical', () => {
    expect(getCertificateExpiry(isoFromDays(7), NOW).level).toBe('warning');
  });

  it('treats exactly 30 days as warning', () => {
    expect(getCertificateExpiry(isoFromDays(30), NOW).level).toBe('warning');
  });

  it('marks past notAfter as expired', () => {
    const expiry = getCertificateExpiry(isoFromDays(-1), NOW);
    expect(expiry.level).toBe('expired');
    expect(expiry.statusLabelStatus).toBe('error');
  });
});

describe('needsExpiryAttention', () => {
  it('is true for warning, critical, and expired certificates', () => {
    expect(needsExpiryAttention(getCertificateExpiry(isoFromDays(45), NOW))).toBe(false);
    expect(needsExpiryAttention(getCertificateExpiry(isoFromDays(12), NOW))).toBe(true);
    expect(needsExpiryAttention(getCertificateExpiry(isoFromDays(1), NOW))).toBe(true);
    expect(needsExpiryAttention(getCertificateExpiry(isoFromDays(-2), NOW))).toBe(true);
  });
});

describe('formatExpiryLabel', () => {
  const t = (key: string, options?: Record<string, unknown>) =>
    key === '{{count}} days' ? `${options?.count} days` : key;

  it('formats unknown, expired, and remaining days', () => {
    expect(formatExpiryLabel(getCertificateExpiry(undefined, NOW), t)).toBe('Unknown');
    expect(formatExpiryLabel(getCertificateExpiry(isoFromDays(-1), NOW), t)).toBe('Expired');
    expect(formatExpiryLabel(getCertificateExpiry(isoFromDays(1), NOW), t)).toBe('1 day');
    expect(formatExpiryLabel(getCertificateExpiry(isoFromDays(12), NOW), t)).toBe('12 days');
  });
});
