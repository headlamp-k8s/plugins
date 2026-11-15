import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { BmcMachine } from '../../../resources/bmcMachine';
import { statusValue } from '../../common/detailHelpers';
import type { TinkerbellDetailProps } from '../../common/detailTypes';

/**
 * Renders the Tinkerbell BMC Machine detail view.
 *
 * @returns BMC Machine detail page with power, connection, and conditions.
 */
export function BmcMachineDetail(props: TinkerbellDetailProps = {}) {
  const params = useParams<{ namespace: string; name: string }>();
  const namespace = props.namespace ?? params.namespace;
  const name = props.name ?? params.name;

  return (
    <DetailsGrid
      resourceType={BmcMachine}
      name={name}
      namespace={namespace}
      cluster={props.cluster}
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
