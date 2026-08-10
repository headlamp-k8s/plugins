import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { BmcMachine } from '../../../resources/bmcMachine';
import { statusValue } from '../../common/detailHelpers';

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
      extraInfo={item =>
        item ? [{ name: 'Power State', value: statusValue(item.status?.powerState) }] : []
      }
      extraSections={item =>
        item
          ? [
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
