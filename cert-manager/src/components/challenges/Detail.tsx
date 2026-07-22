import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Challenge } from '../../resources/challenge';
import {
  ACMEChallengeSolverComponent,
  CopyToClipboard,
  IssuerRef,
  NotInstalledBanner,
} from '../common/CommonComponents';

export function ChallengeDetail() {
  const { t } = useTranslation();
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return (
    <>
      {isManagerInstalled ? (
        <DetailsGrid
          resourceType={Challenge}
          name={name}
          namespace={namespace}
          withEvents
          extraInfo={item =>
            item && [
              {
                name: t('DNS Name'),
                value: item.spec.dnsName,
              },
              {
                name: t('Authorization URL'),
                value: item.spec.authorizationURL,
              },
              {
                name: t('Type'),
                value: item.spec.type,
              },
              {
                name: t('Issuer Ref'),
                value: item.spec.issuerRef && (
                  <IssuerRef issuerRef={item.spec.issuerRef} namespace={item.metadata.namespace} />
                ),
              },
              {
                name: t('Key'),
                value: <CopyToClipboard text={item.spec.key} />,
              },
              {
                name: t('Solver'),
                value: (
                  <ACMEChallengeSolverComponent
                    solver={item.spec.solver}
                    namespace={item.metadata.namespace}
                  />
                ),
              },
              {
                name: t('Token'),
                value: item.spec.token,
              },
              {
                name: t('URL'),
                value: item.spec.url,
              },
              {
                name: t('Wildcard'),
                value: item.spec?.wildcard ? t('Yes') : t('No'),
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'Status',
                section: item?.status && (
                  <SectionBox title={t('Status')}>
                    <NameValueTable
                      rows={[
                        { name: t('State'), value: item.status?.state },
                        {
                          name: t('Presented'),
                          value: item.status.presented ? t('Yes') : t('No'),
                        },
                        {
                          name: t('Processing'),
                          value: item.status.processing ? t('Yes') : t('No'),
                        },
                        { name: t('Reason'), value: item.status?.reason },
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
