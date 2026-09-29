import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Tooltip } from '@mui/material';
import { formatExpiryLabel, getCertificateExpiry } from '../../utils/certificateExpiry';

export function CertificateExpiryLabel({ notAfter }: { notAfter?: string }) {
  const { t } = useTranslation();
  const expiry = getCertificateExpiry(notAfter);

  return (
    <Tooltip title={notAfter || t('Unknown')}>
      <span>
        <StatusLabel status={expiry.statusLabelStatus}>{formatExpiryLabel(expiry, t)}</StatusLabel>
      </span>
    </Tooltip>
  );
}
