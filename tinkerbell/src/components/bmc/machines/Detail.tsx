import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { BmcMachine } from '../../../resources/bmcMachine';
import { fallback, renderRecordSection, statusValue } from '../../common/detailHelpers';

/**
 * Renders the Tinkerbell BMC Machine detail view.
 *
 * @returns BMC Machine detail page with power, connection, and conditions.
 */
export function BmcMachineDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={BmcMachine}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Power State', value: statusValue(item.status?.powerState) },
              {
                name: 'Connection',
                value: fallback(item.spec?.connection ? 'Configured' : undefined),
              },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'tinkerbell.bmc-machine-power',
                section: (
                  <SectionBox title="Power Status">
                    <NameValueTable
                      rows={[{ name: 'Power State', value: statusValue(item.status?.powerState) }]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.bmc-machine-connection',
                section: renderRecordSection('Connection', item.spec?.connection),
              },
              {
                id: 'tinkerbell.bmc-machine-conditions',
                section: <ConditionsSection resource={item.jsonData} />,
              },
            ]
          : []
      }
    />
  );
}
