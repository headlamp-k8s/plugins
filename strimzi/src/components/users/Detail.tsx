import React from 'react';
import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KafkaUser, KafkaUserV1 } from '../../resources/kafkaUser';
import { useStrimziApiVersions } from '../../hooks/useStrimziApiVersions';

export function KafkaUserDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const { kafka: kafkaVersion } = useStrimziApiVersions();
  const KafkaUserClass = kafkaVersion === 'v1' ? KafkaUserV1 : KafkaUser;

  return (
    <DetailsGrid
      resourceType={KafkaUserClass}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Authentication', value: item.authenticationType },
              { name: 'Authorization', value: item.authorizationType },
              { name: 'Status', value: String(item.readyStatus ?? 'Unknown') },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'conditions',
                section: <ConditionsSection resource={item?.jsonData} />,
              },
            ]
          : []
      }
    />
  );
}
