import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { localeDate } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { getCertificateExpiryInfo } from '../../utils';

export interface CertificateExpiryLabelProps {
  /** The notAfter timestamp string from the Certificate status. */
  notAfter?: string | null;
  /**
   * Whether to format label with 'remaining' suffix (e.g. "14d remaining")
   * suitable for detail views, or compact format (e.g. "14d") for table columns.
   */
  showRemainingSuffix?: boolean;
}

/**
 * Renders a color-coded certificate expiry status badge with a localized tooltip.
 * Automatically recalculates remaining time on an interval so long-open pages
 * refresh expiry countdowns and threshold transitions without requiring manual re-renders.
 */
export function CertificateExpiryLabel({
  notAfter,
  showRemainingSuffix = false,
}: CertificateExpiryLabelProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!notAfter) return;
    // Update periodically so transitions across thresholds or into expiration stay fresh
    const intervalId = setInterval(() => {
      setTick(tick => tick + 1);
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [notAfter]);

  if (!notAfter) {
    return <>-</>;
  }

  const expiry = getCertificateExpiryInfo(notAfter);
  if (!expiry) {
    return <>-</>;
  }

  const tooltipTitle = localeDate(notAfter);
  const labelText = expiry.isExpired
    ? t('Expired')
    : showRemainingSuffix
    ? t('{{time}} remaining', { time: expiry.label })
    : expiry.label;

  return (
    <Tooltip title={tooltipTitle}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <span tabIndex={0}>
        <StatusLabel status={expiry.status}>{labelText}</StatusLabel>
      </span>
    </Tooltip>
  );
}

export default CertificateExpiryLabel;
