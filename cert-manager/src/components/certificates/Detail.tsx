import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Certificate } from '../../resources/certificate';
import { IssuerRef, NotInstalledBanner, StringArray } from '../common/CommonComponents';

export function CertificateDetail() {
  const { t } = useTranslation();
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return (
    <>
      {isManagerInstalled ? (
        <DetailsGrid
          resourceType={Certificate}
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
                name: t('Common Name'),
                value: item.spec?.commonName,
              },
              {
                name: t('DNS Names'),
                value: <StringArray items={item.spec?.dnsNames} />,
              },
              {
                name: t('Email Addresses'),
                value: <StringArray items={item.spec?.emailAddresses} />,
              },
              {
                name: t('IP Addresses'),
                value: <StringArray items={item.spec?.ipAddresses} />,
              },
              {
                name: t('URIs'),
                value: <StringArray items={item.spec?.uris} />,
              },
              {
                name: t('Duration'),
                value: item.spec?.duration,
              },
              {
                name: t('Renew Before'),
                value: item.spec?.renewBefore,
              },
              {
                name: t('Is CA'),
                value: item.spec?.isCA ? t('Yes') : t('No'),
              },
              {
                name: t('Usages'),
                value: <StringArray items={item.spec?.usages} />,
              },
              {
                name: t('Revision History Limit'),
                value: item.spec?.revisionHistoryLimit?.toString(),
              },
              {
                name: t('Secret Name'),
                value: item.spec.secretName,
              },
              {
                name: t('Issuer Ref'),
                value: item.spec.issuerRef && (
                  <IssuerRef issuerRef={item.spec.issuerRef} namespace={item.metadata.namespace} />
                ),
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'Subject',
                section: item.spec.subject && (
                  <SectionBox title={t('Subject')}>
                    <NameValueTable
                      rows={[
                        {
                          name: t('Organizations'),
                          value: <StringArray items={item.spec.subject?.organizations} />,
                        },
                        {
                          name: t('Countries'),
                          value: <StringArray items={item.spec.subject?.countries} />,
                        },
                        {
                          name: t('Organizational Units'),
                          value: <StringArray items={item.spec.subject?.organizationalUnits} />,
                        },
                        {
                          name: t('Localities'),
                          value: <StringArray items={item.spec.subject?.localities} />,
                        },
                        {
                          name: t('Provinces'),
                          value: <StringArray items={item.spec.subject?.provinces} />,
                        },
                        {
                          name: t('Street Addresses'),
                          value: <StringArray items={item.spec.subject?.streetAddresses} />,
                        },
                        {
                          name: t('Postal Codes'),
                          value: <StringArray items={item.spec.subject?.postalCodes} />,
                        },
                        {
                          name: t('Serial Number'),
                          value: item.spec?.subject?.serialNumber,
                        },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'Private Key',
                section: item.spec.privateKey && (
                  <SectionBox title={t('Private Key')}>
                    <NameValueTable
                      rows={[
                        {
                          name: t('Algorithm'),
                          value: item.spec.privateKey?.algorithm,
                        },
                        {
                          name: t('Size'),
                          value: item.spec.privateKey.size?.toString(),
                        },
                        {
                          name: t('Encoding'),
                          value: item.spec.privateKey?.encoding,
                        },
                        {
                          name: t('Rotation Policy'),
                          value: item.spec.privateKey?.rotationPolicy,
                        },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'Keystores',
                section: item.spec.keystores && (
                  <SectionBox title={t('Keystores')}>
                    <NameValueTable
                      rows={[
                        {
                          name: 'JKS',
                          value: item.spec?.keystores?.jks && (
                            <NameValueTable
                              rows={[
                                {
                                  name: t('Create'),
                                  value: item.spec?.keystores?.jks?.create.toString(),
                                },
                                {
                                  name: t('Password Secret Ref'),
                                  value: item.spec?.keystores?.jks?.passwordSecretRef && (
                                    <NameValueTable
                                      rows={[
                                        {
                                          name: t('Name'),
                                          value: item.spec?.keystores?.jks?.passwordSecretRef?.name,
                                        },
                                        {
                                          name: t('Key'),
                                          value: item.spec?.keystores?.jks?.passwordSecretRef?.key,
                                        },
                                      ]}
                                    />
                                  ),
                                },
                              ]}
                            />
                          ),
                        },
                        {
                          name: 'PKCS12',
                          value: item.spec?.keystores?.pkcs12 && (
                            <NameValueTable
                              rows={[
                                {
                                  name: t('Create'),
                                  value: item.spec?.keystores?.pkcs12?.create.toString(),
                                },
                                {
                                  name: t('Password Secret Ref'),
                                  value: item.spec?.keystores?.pkcs12?.passwordSecretRef && (
                                    <NameValueTable
                                      rows={[
                                        {
                                          name: t('Name'),
                                          value:
                                            item.spec?.keystores?.pkcs12?.passwordSecretRef?.name,
                                        },
                                        {
                                          name: t('Key'),
                                          value:
                                            item.spec?.keystores?.pkcs12?.passwordSecretRef?.key,
                                        },
                                      ]}
                                    />
                                  ),
                                },
                              ]}
                            />
                          ),
                        },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'Status',
                section: item.status && (
                  <SectionBox title={t('Status')}>
                    <NameValueTable
                      rows={[
                        {
                          name: t('Not Before'),
                          value: item.status?.notBefore,
                        },
                        {
                          name: t('Not After'),
                          value: item.status?.notAfter,
                        },
                        {
                          name: t('Renewal Time'),
                          value: item.status?.renewalTime,
                        },
                        {
                          name: t('Revision'),
                          value: item.status?.revision?.toString(),
                        },
                        {
                          name: t('Next Private Key Secret'),
                          value: item.status?.nextPrivateKeySecretName,
                        },
                      ]}
                    />
                  </SectionBox>
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
