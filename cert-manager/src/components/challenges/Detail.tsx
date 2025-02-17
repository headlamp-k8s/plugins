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
                name: 'DNS Name',
                value: item.spec.dnsName,
              },
              {
                name: 'Authorization URL',
                value: item.spec.authorizationURL,
              },
              {
                name: 'Type',
                value: item.spec.type,
              },
              {
                name: 'Issuer Ref',
                value: item.spec.issuerRef && (
                  <IssuerRef issuerRef={item.spec.issuerRef} namespace={item.metadata.namespace} />
                ),
              },
              {
                name: 'Key',
                value: <CopyToClipboard text={item.spec.key} />,
              },
              {
                name: 'Solver',
                value: <ACMEChallengeSolverComponent solver={item.spec.solver} />,
              },
              {
                name: 'Token',
                value: item.spec.token,
              },
              {
                name: 'URL',
                value: item.spec.url,
              },
              {
                name: 'Wildcard',
                value: item.spec?.wildcard?.toString() || 'false',
              },
            ]
          }
          extraSections={item =>
            item && [
              {
                id: 'Status',
                section: item?.status && (
                  <SectionBox title="Status">
                    <NameValueTable
                      rows={[
                        { name: 'State', value: item.status?.state },
                        { name: 'Presented', value: item.status.presented.toString() },
                        { name: 'Processing', value: item.status.processing.toString() },
                        { name: 'Reason', value: item.status?.reason },
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
