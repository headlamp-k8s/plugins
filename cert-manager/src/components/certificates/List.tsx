import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { DateLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Certificate } from '../../resources/certificate';
import { NotInstalledBanner } from '../common/CommonComponents';

export function CertificatesList() {
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <ResourceListView
      title="Certificates"
      resourceClass={Certificate}
      columns={[
        'name',
        'namespace',
        {
          id: 'ready',
          label: 'Ready',
          getValue: item => (item.ready ? 'Ready' : 'Not Ready'),
        },
        {
          id: 'secret',
          label: 'Secret',
          getValue: item => item.spec.secretName,
        },
        {
          id: 'expiresIn',
          label: 'Expires In (Not After)',
          render: item => {
            return item?.status?.notAfter ? (
              <DateLabel date={item.status.notAfter} format="mini" />
            ) : null;
          },
          getValue: item => item.status?.notAfter ?? '',
          sort: (a, b) => {
            const dateA = new Date(a.status?.notAfter);
            const dateB = new Date(b.status?.notAfter);
            return dateA.getTime() - dateB.getTime();
          },
        },
        'age',
      ]}
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
