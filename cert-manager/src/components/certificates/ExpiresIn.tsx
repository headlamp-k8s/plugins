import { useTranslation, Utils } from '@kinvolk/headlamp-plugin/lib';
import { HoverInfoLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useEffect, useState } from 'react';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * How long to wait before the displayed duration can change: every second in the last
 * minute, every minute in the last hour, otherwise every hour. Never later than the
 * expiry itself, so the label flips to "Expired" on time.
 */
function getRefreshDelay(remainingMs: number): number {
  const step = remainingMs <= MINUTE_MS ? SECOND_MS : remainingMs <= HOUR_MS ? MINUTE_MS : HOUR_MS;
  return Math.min(step, remainingMs);
}

function useNow(expiryMs: number): number {
  const [clock, setClock] = useState({ expiryMs, now: Date.now() });
  // A clock stamped for a previous expiry may be stale (the timer stops once a
  // certificate expires), so take a fresh reading as soon as the expiry changes.
  const now = clock.expiryMs === expiryMs ? clock.now : Date.now();

  useEffect(() => {
    const remainingMs = expiryMs - now;
    if (Number.isNaN(remainingMs) || remainingMs <= 0) {
      return;
    }
    const timer = setTimeout(
      () => setClock({ expiryMs, now: Date.now() }),
      getRefreshDelay(remainingMs)
    );
    return () => clearTimeout(timer);
  }, [expiryMs, now]);

  return now;
}

/**
 * Shows the time remaining until a certificate's notAfter date. notAfter is a future
 * expiry, so DateLabel/TimeAgo (time elapsed since a date) would render "<invalid>".
 */
export function ExpiresIn({ notAfter }: { notAfter?: string }) {
  const { t } = useTranslation();
  const notAfterMs = notAfter ? new Date(notAfter).getTime() : NaN;
  const now = useNow(notAfterMs);

  if (!notAfter || Number.isNaN(notAfterMs)) {
    return null;
  }

  const remainingMs = notAfterMs - now;
  const label =
    remainingMs <= 0 ? t('Expired') : Utils.formatDuration(remainingMs, { format: 'mini' });

  return (
    <HoverInfoLabel label={label} hoverInfo={Utils.localeDate(notAfter)} icon="mdi:calendar" />
  );
}
