import React from 'react';
import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KafkaTopic } from '../../resources/kafkaTopic';

export function KafkaTopicDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <DetailsGrid
      resourceType={KafkaTopic}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Partitions', value: item.partitions },
              { name: 'Replicas', value: item.replicas },
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
