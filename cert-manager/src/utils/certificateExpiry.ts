export type CertificateExpiryLevel = 'ok' | 'warning' | 'critical' | 'expired' | 'unknown';

export type StatusLabelStatus = 'success' | 'warning' | 'error' | '';

export interface CertificateExpiry {
  level: CertificateExpiryLevel;
  daysRemaining: number | null;
  statusLabelStatus: StatusLabelStatus;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WARNING_DAYS = 30;
const CRITICAL_DAYS = 7;

export function getCertificateExpiry(
  notAfter: string | undefined,
  now = Date.now()
): CertificateExpiry {
  if (!notAfter) {
    return { level: 'unknown', daysRemaining: null, statusLabelStatus: '' };
  }

  const expiry = Date.parse(notAfter);
  if (Number.isNaN(expiry)) {
    return { level: 'unknown', daysRemaining: null, statusLabelStatus: '' };
  }

  const daysRemaining = Math.floor((expiry - now) / MS_PER_DAY);

  if (daysRemaining < 0) {
    return { level: 'expired', daysRemaining, statusLabelStatus: 'error' };
  }
  if (daysRemaining < CRITICAL_DAYS) {
    return { level: 'critical', daysRemaining, statusLabelStatus: 'error' };
  }
  if (daysRemaining <= WARNING_DAYS) {
    return { level: 'warning', daysRemaining, statusLabelStatus: 'warning' };
  }
  return { level: 'ok', daysRemaining, statusLabelStatus: 'success' };
}

export function needsExpiryAttention(expiry: CertificateExpiry): boolean {
  return expiry.level === 'warning' || expiry.level === 'critical' || expiry.level === 'expired';
}

export function formatExpiryLabel(
  expiry: CertificateExpiry,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  if (expiry.level === 'unknown' || expiry.daysRemaining === null) {
    return t('Unknown');
  }
  if (expiry.level === 'expired') {
    return t('Expired');
  }
  if (expiry.daysRemaining === 1) {
    return t('1 day');
  }
  return t('{{count}} days', { count: expiry.daysRemaining });
}
