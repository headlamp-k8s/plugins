import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Tooltip } from '@mui/material';
import { useCertificateClock } from '../../hooks/useCertificateClock';
import { formatExpiryLabel, getCertificateExpiry } from '../../utils/certificateExpiry';

export function CertificateExpiryLabel({ notAfter, now }: { notAfter?: string; now?: number }) {
  const { t } = useTranslation();
  const clockNow = useCertificateClock();
  const expiry = getCertificateExpiry(notAfter, now ?? clockNow);

  return (
    <Tooltip title={notAfter || t('Unknown')}>
      <span>
        <StatusLabel
          status={expiry.statusLabelStatus}
          sx={
            expiry.level === 'expired'
              ? {
                  backgroundColor: 'common.black',
                  color: 'common.white',
                  borderColor: 'common.black',
                }
              : undefined
          }
        >
          {formatExpiryLabel(expiry, t)}
        </StatusLabel>
      </span>
    </Tooltip>
  );
}
