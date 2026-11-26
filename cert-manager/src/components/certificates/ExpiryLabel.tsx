import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { HoverInfoLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { formatDuration, localeDate } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useEffect, useState } from 'react';

/** Display time remaining until a certificate expires, with the exact date on hover. */
export function ExpiryLabel({ date }: { date: string }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const expiry = new Date(date).getTime();
  const invalid = Number.isNaN(expiry);
  const label = invalid
    ? '<invalid>'
    : expiry <= now
    ? t('Expired')
    : formatDuration(expiry - now, { format: 'mini' });

  return (
    <HoverInfoLabel
      label={label}
      hoverInfo={invalid ? date : localeDate(date)}
      icon="mdi:calendar"
    />
  );
}
