import { formatDuration } from '@kinvolk/headlamp-plugin/lib/Utils';

export type ExpiryStatus = 'success' | 'warning' | 'error';

export interface CertificateExpiryInfo {
  /** Formatted relative time string, e.g. "29d", "4h", or "Expired" */
  label: string;
  /** StatusLabel status color: 'success' (>30d), 'warning' (<30d), 'error' (<7d or expired) */
  status: ExpiryStatus;
  /** Whether the certificate has expired (notAfter <= now) */
  isExpired: boolean;
  /** Difference in ms (negative if expired) */
  diffMs: number;
}

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Calculates expiry info, relative remaining time, and color-coded status for a certificate's notAfter timestamp.
 *
 * Thresholds:
 * - notAfter <= now: Expired (status: 'error')
 * - diff < 7 days: Critical (status: 'error')
 * - diff < 30 days: Warning (status: 'warning')
 * - diff >= 30 days: Healthy (status: 'success')
 */
export function getCertificateExpiryInfo(
  notAfter?: string | null,
  now: number = Date.now()
): CertificateExpiryInfo | null {
  if (!notAfter) {
    return null;
  }

  const notAfterMs = new Date(notAfter).getTime();
  if (isNaN(notAfterMs)) {
    return null;
  }

  const diffMs = notAfterMs - now;

  if (diffMs <= 0) {
    return {
      label: 'Expired',
      status: 'error',
      isExpired: true,
      diffMs,
    };
  }

  const label = formatDuration(diffMs, { format: 'mini' });

  if (diffMs < SEVEN_DAYS_MS) {
    return {
      label,
      status: 'error',
      isExpired: false,
      diffMs,
    };
  }

  if (diffMs < THIRTY_DAYS_MS) {
    return {
      label,
      status: 'warning',
      isExpired: false,
      diffMs,
    };
  }

  return {
    label,
    status: 'success',
    isExpired: false,
    diffMs,
  };
}
