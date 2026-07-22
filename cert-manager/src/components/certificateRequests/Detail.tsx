import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { DetailsGrid, NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { CertificateRequest } from '../../resources/certificateRequest';
import {
  ConditionsTable,
  CopyToClipboard,
  IssuerRef,
  NotInstalledBanner,
} from '../common/CommonComponents';

export function CertificateRequestDetail() {
  const { t } = useTranslation();
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return (
    <>
      {isManagerInstalled ? (
        <DetailsGrid
          resourceType={CertificateRequest}
          name={name}
          withEvents
          namespace={namespace}
          extraInfo={item =>
            item && [
              {
                name: t('Ready'),
                value: item.ready ? t('Ready') : t('Not Ready'),
              },
              {
                name: t('Approved'),
                value: item.approved === 'True' ? t('Yes') : t('No'),
              },
              {
                name: t('Denied'),
                value: item.denied === 'True' ? t('Yes') : t('No'),
              },
              {
                name: t('Duration'),
                value: item.spec?.duration,
              },
              {
                name: t('Is CA'),
                value: item.spec?.isCA ? t('Yes') : t('No'),
              },
              {
                name: t('Usages'),
                value: item.spec?.usages?.length && (
                  <NameValueTable
                    rows={item.spec?.usages?.map((usage, index) => ({
                      name: t('Usage {{index}}', { index: index + 1 }),
                      value: usage,
                    }))}
                  />
                ),
              },
              {
                name: t('Issuer Ref'),
                value: item.spec.issuerRef && (
                  <IssuerRef issuerRef={item.spec.issuerRef} namespace={item.metadata?.namespace} />
                ),
              },
              {
                name: t('Request'),
                value: <CopyToClipboard text={item.spec.request} />,
              },
              {
                name: t('Certificate'),
                value: item.status?.certificate && (
                  <CopyToClipboard text={item.status.certificate} />
                ),
              },
              {
                name: t('CA'),
                value: item.status?.ca && <CopyToClipboard text={item.status.ca} />,
              },
              {
                name: t('Failure Time'),
                value: item.status?.failureTime,
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'Status',
                section: item.status?.conditions && (
                  <ConditionsTable conditions={item.status.conditions} />
                ),
              },
            ]
          }
        />
      ) : (
        <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
      )}
    </>
  );
}
