import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { useCertManagerInstalled } from '../../hooks/useCertManagerInstalled';
import { Issuer } from '../../resources/issuer';
import {
  ACMEIssuerStatusComponent,
  ConditionsTable,
  NotInstalledBanner,
} from '../common/CommonComponents';
import { processIssuerExtraInfo } from '../common/processIssuerExtraInfo';

export function IssuerDetail() {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
  const { isManagerInstalled, isCertManagerCheckLoading } = useCertManagerInstalled();

  return isManagerInstalled ? (
    <DetailsGrid
      resourceType={Issuer}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item => item?.spec && processIssuerExtraInfo(item.spec)}
      extraSections={item =>
        item && [
          {
            id: 'Status',
            section: item?.status && (
              <SectionBox title="Status">
                {item.status?.acme && <ACMEIssuerStatusComponent status={item.status?.acme} />}
              </SectionBox>
            ),
          },
          {
            id: 'Conditions',
            section: item?.status && item.status?.conditions && (
              <ConditionsTable conditions={item.status?.conditions} />
            ),
          },
        ]
      }
    />
  ) : (
    <NotInstalledBanner isLoading={isCertManagerCheckLoading} />
  );
}
