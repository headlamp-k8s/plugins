import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { DateLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Certificate } from '../../resources/certificate';
import { NotInstalledBanner } from '../common/CommonComponents';

export function CertificatesList() {
  const { t } = useTranslation();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title={t('Certificates')}
      resourceClass={Certificate}
      columns={[
        'name',
        'namespace',
        {
          id: 'ready',
          label: t('Ready'),
          getValue: item => (item.ready ? t('Ready') : t('Not Ready')),
        },
        {
          id: 'secret',
          label: t('Secret'),
          getValue: item => item.spec.secretName,
        },
        {
          id: 'expiresIn',
          label: t('Expires In (Not After)'),
          render: item => {
            return item?.status?.notAfter ? (
              <DateLabel date={item.status.notAfter} format="mini" />
            ) : null;
          },
          getValue: item => item.status?.notAfter ?? '',
          sort: (a, b) => {
            const timeA = a.status?.notAfter ? new Date(a.status.notAfter).getTime() : Infinity;
            const timeB = b.status?.notAfter ? new Date(b.status.notAfter).getTime() : Infinity;
            return timeA - timeB;
          },
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
